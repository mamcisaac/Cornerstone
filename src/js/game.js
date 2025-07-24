// Main Cornerstones Game Class
import { HAMILTONIAN_PATHS, SAMPLE_PUZZLES, ADJACENCY } from './constants.js';
import { GAME_CONFIG } from './config.js';
import { HintSystem } from './hints.js';
import { logger } from './logger.js';
import { updateStats, showMessage, updateCurrentWord, updateFoundWordsList, updateCornerstoneProgress, showDefinition } from './ui.js';
import { WordFinder } from './wordFinder.js';

export class CornerstonesGame {
    constructor() {
        console.log('CornerstonesGame v1.1 - Keystone celebration enabled');
        this.currentPuzzle = "CORNERSTONES";
        this.grid = [];
        this.selectedPath = [];
        this.foundWords = new Set();
        this.allPossibleWords = new Set();
        this.cornerstoneWords = [];
        this.validWords = [];
        this.isSelecting = false;
        this.gameStarted = false;
        this.hintSystem = new HintSystem();
        this.sortAlphabetically = false;
        this.letterSelectionWord = null;
        this.definitionRevealMode = false;
        this.globalLetterRevealMode = false;
        this.letterRevealCancelHandler = null;
        this.definitionCancelHandler = null;
        this.isDragging = false;
        this.touchStartTime = 0;
        this.wordFinder = new WordFinder();
        
        // Expose SAMPLE_PUZZLES to window for testing
        if (!window.SAMPLE_PUZZLES) {
            window.SAMPLE_PUZZLES = SAMPLE_PUZZLES;
        }
        
        this.initializeGame();
        this.setupEventListeners();
        this.cleanupOldPreferences();
    }

    cleanupOldPreferences() {
        // Remove old tap mode preferences that are no longer used
        localStorage.removeItem('cornerstones_input_mode');
    }
    
    addCellEventListeners(cell) {
        // Mouse events for desktop drag interaction
        cell.addEventListener('mousedown', (e) => this.startSelection(e));
        cell.addEventListener('mouseenter', (e) => this.continueSelection(e));
        cell.addEventListener('mouseup', (e) => this.endSelection(e));
        
        // Touch events for mobile
        cell.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        cell.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        cell.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
    }
    
    recreateGridEventListeners() {
        // Remove all existing event listeners and re-add
        const cells = document.querySelectorAll('.cell:not(.empty)');
        cells.forEach(cell => {
            // Clone node to remove all event listeners
            const newCell = cell.cloneNode(true);
            cell.parentNode.replaceChild(newCell, cell);
            this.addCellEventListeners(newCell);
        });
    }

    async initializeGame() {
        try {
            this.createGrid();
            this.generatePuzzle();
            await this.findAllPossibleWords();
            this.updateStats();
            this.updateCornerstoneDisplay();
            this.updateHintButtons();
            await this.loadProgress();
            this.gameStarted = true;
            logger.success('Game initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize game:', error);
            showMessage('Failed to initialize game. Please refresh the page.', 'error');
            this.gameStarted = false;
        }
    }

    createGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            
            // Calculate row and column for ARIA label (4x4 grid)
            const row = Math.floor(i / 4) + 1;
            const col = (i % 4) + 1;
            
            if ([0, 3, 12, 15].includes(i)) {
                cell.classList.add('empty');
                cell.setAttribute('aria-hidden', 'true');
            } else {
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('tabindex', '0');
                cell.setAttribute('aria-label', `Empty cell at row ${row}, column ${col}`);
                this.addCellEventListeners(cell);
            }
            
            gridElement.appendChild(cell);
        }
    }

    generatePuzzle() {
        const puzzle = SAMPLE_PUZZLES[this.currentPuzzle];
        const path = HAMILTONIAN_PATHS[puzzle.pathIndex];
        const letters = puzzle.seedWord.split('');
        
        this.grid = new Array(16).fill('');
        
        path.forEach((position, index) => {
            this.grid[position] = letters[index];
        });
        
        const cells = document.querySelectorAll('.cell:not(.empty)');
        cells.forEach((cell) => {
            const index = parseInt(cell.dataset.index);
            const letter = this.grid[index] || '';
            const row = Math.floor(index / 4) + 1;
            const col = (index % 4) + 1;
            
            cell.textContent = letter;
            if (letter) {
                cell.setAttribute('aria-label', `Letter ${letter} at row ${row}, column ${col}`);
            }
        });
    }

    async findAllPossibleWords() {
        this.allPossibleWords = new Set();
        this.cornerstoneWords = [];
        this.validWords = [];
        
        if (!window.COMPREHENSIVE_WORD_SET) {
            logger.error('Word database not loaded!');
            return;
        }
        logger.info(`Word database loaded with ${window.COMPREHENSIVE_WORD_SET.size} words`);
        
        // Use WordFinder to get all words
        this.wordFinder.wordSet = window.COMPREHENSIVE_WORD_SET;
        this.allPossibleWords = this.wordFinder.findAllWords(this.grid);
        
        // Ensure CORNERSTONE_WORDS_SET is loaded
        if (!window.CORNERSTONE_WORDS_SET) {
            logger.error('CORNERSTONE_WORDS_SET not loaded! Game cannot determine cornerstone words.');
            showMessage('Error loading word database. Please refresh the page.', 'error');
            return;
        }
        
        logger.info(`Found ${this.allPossibleWords.size} total possible words`);
        logger.info(`CORNERSTONE_WORDS_SET size: ${window.CORNERSTONE_WORDS_SET.size}`);
        
        // Classify words as cornerstone or valid
        this.allPossibleWords.forEach(word => {
            const wordData = {
                word: word,
                found: false,
                revealed: null,
                pattern: null,
                showDefinition: false,
                definition: "Loading definition..." // Will be populated async
            };
            
            // Only common words qualify as cornerstone words
            // CORNERSTONE_WORDS_SET contains lowercase words, so we need to check lowercase
            const isCommon = window.CORNERSTONE_WORDS_SET.has(word.toLowerCase());
            
            if (isCommon) {
                this.cornerstoneWords.push(wordData);
            } else {
                this.validWords.push(word);
            }
        });
        
        logger.game(`Found ${this.cornerstoneWords.length} cornerstone words and ${this.validWords.length} other valid words`);
        
        // Fetch definitions asynchronously
        this.fetchAllDefinitions();
    }

    async fetchAllDefinitions() {
        logger.info('Fetching definitions for all words...');
        
        // Fetch definitions for cornerstone words
        const cornerstonePromises = this.cornerstoneWords.map(async (wordData) => {
            try {
                // Check if it's a seed word first
                if (window.SEED_WORDS && window.SEED_WORDS[wordData.word]) {
                    wordData.definition = window.SEED_WORDS[wordData.word].definition;
                } else if (window.getDefinition) {
                    // Use async getDefinition which can fetch from API
                    const def = await window.getDefinition(wordData.word, true);
                    wordData.definition = def || "A common English word";
                } else if (window.getDefinitionSync) {
                    const def = window.getDefinitionSync(wordData.word);
                    wordData.definition = (def === "Loading definition...") ? "A common English word" : def;
                } else {
                    wordData.definition = "A common English word";
                }
            } catch (error) {
                logger.warn(`Failed to fetch definition for cornerstone word "${wordData.word}":`, error);
                wordData.definition = "A common English word";
            }
        });

        // Fetch definitions for all valid words  
        const validWordPromises = this.validWords.map(async (word) => {
            try {
                let definition = "A common English word";
                if (window.getDefinition) {
                    definition = await window.getDefinition(word, false);
                } else if (window.getDefinitionSync) {
                    const def = window.getDefinitionSync(word);
                    definition = (def === "Loading definition..." || !def) ? "A valid English word" : def;
                }
                
                // Store in a map for quick lookup when showing definitions
                if (!this.wordDefinitions) {
                    this.wordDefinitions = new Map();
                }
                this.wordDefinitions.set(word.toUpperCase(), definition);
            } catch (error) {
                logger.warn(`Failed to fetch definition for word "${word}":`, error);
                if (!this.wordDefinitions) {
                    this.wordDefinitions = new Map();
                }
                this.wordDefinitions.set(word.toUpperCase(), "A valid English word");
            }
        });

        // Wait for all definitions to be fetched
        try {
            await Promise.all([...cornerstonePromises, ...validWordPromises]);
        } catch (error) {
            logger.warn('Some definitions failed to load:', error);
        }
        
        // Update the display once all definitions are loaded
        this.updateCornerstoneDisplay();
        logger.success('All definitions loaded successfully');
    }

    setupEventListeners() {
        // Global mouseup for ending drag selections
        this.globalMouseUpHandler = () => this.endSelection();
        document.addEventListener('mouseup', this.globalMouseUpHandler);
        
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeDefinition());
        }
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Add keyboard navigation support
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    handleKeyDown(e) {
        // Handle arrow keys globally - if not on a cell, start from center
        let currentIndex;
        if (e.target.classList.contains('cell')) {
            currentIndex = parseInt(e.target.dataset.index);
        } else {
            // If arrow key pressed but not focused on a cell, start from center (index 5 or 6)
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                currentIndex = 5; // Good starting position
            } else {
                return; // Only handle arrow keys when not focused on grid
            }
        }
        
        let newIndex = currentIndex;
        
        switch (e.key) {
            case 'ArrowUp':
                newIndex = currentIndex - 4;
                break;
            case 'ArrowDown':
                newIndex = currentIndex + 4;
                break;
            case 'ArrowLeft':
                newIndex = currentIndex - 1;
                break;
            case 'ArrowRight':
                newIndex = currentIndex + 1;
                break;
            case ' ':
            case 'Spacebar':
                // Add current cell to selection (only if we have a focused cell)
                if (e.target.classList.contains('cell')) {
                    if (this.selectedPath.length === 0) {
                        this.selectedPath = [currentIndex];
                        this.updateSelection();
                    } else if (!this.selectedPath.includes(currentIndex) && 
                             this.isAdjacent(this.selectedPath[this.selectedPath.length - 1], currentIndex)) {
                        this.addToPath(currentIndex);
                    }
                }
                e.preventDefault();
                return;
            case 'Enter':
                // Submit current word (works globally)
                if (this.selectedPath.length > 0) {
                    this.submitCurrentWord();
                }
                e.preventDefault();
                return;
            case 'Escape':
                // Clear selection (works globally)
                this.clearSelection();
                e.preventDefault();
                return;
            case 'Backspace':
                // Remove last letter from selection (works globally)
                if (this.selectedPath.length > 0) {
                    this.selectedPath.pop();
                    this.updateSelection();
                    this.updateCurrentWord();
                }
                e.preventDefault();
                return;
            default:
                return; // Don't handle other keys
        }
        
        // Navigate to new cell
        if (newIndex >= 0 && newIndex < 16) {
            const newCell = document.querySelector(`[data-index="${newIndex}"]`);
            if (newCell && !newCell.classList.contains('empty')) {
                e.preventDefault();
                newCell.focus();
            }
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.touchStartTime = Date.now();
        this.isDragging = false;
        // Don't start selection here - wait to see if it's a tap or drag
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        
        // Start drag selection on first move
        if (!this.isDragging) {
            this.isDragging = true;
            const startElement = e.target;
            if (startElement && startElement.classList.contains('cell')) {
                this.startSelection({ target: startElement, preventDefault: () => {} });
            }
        }
        
        // Continue selection
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && element.classList.contains('cell')) {
            this.continueSelection({ target: element });
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        
        // Only end selection if it was a drag
        if (this.isDragging) {
            this.endSelection(e);
        }
        // For taps, don't end selection - let the click handler manage it
    }

    startSelection(e) {
        e.preventDefault();
        this.isSelecting = true;
        this.selectedPath = [];
        const index = parseInt(e.target.dataset.index);
        this.addToPath(index);
    }

    continueSelection(e) {
        // Only continue on mouseenter if we're actively dragging (mouse button down)
        if (e.type === 'mouseenter' && !e.buttons) {
            return;
        }
        
        if (!this.isSelecting) return;
        
        const index = parseInt(e.target.dataset.index);
        this.addToPath(index);
    }

    endSelection() {
        if (!this.isSelecting) return;
        this.isSelecting = false;
        this.submitCurrentWord();
    }
    
    submitCurrentWord() {
        const word = this.getSelectedWord();
        
        // Clear selection first, before showing messages
        this.clearSelection();
        
        if (word.length >= GAME_CONFIG.MIN_WORD_LENGTH) {
            this.checkWord(word);
        } else if (word.length > 0) {
            showMessage(GAME_CONFIG.MESSAGES.TOO_SHORT, 'error');
        }
    }

    addToPath(index) {
        // Check if we're going back to a previously selected letter
        const existingIndex = this.selectedPath.indexOf(index);
        if (existingIndex !== -1) {
            // If it's the second-to-last letter, remove the last letter (backtrack)
            if (existingIndex === this.selectedPath.length - 2) {
                this.selectedPath.pop(); // Remove the last letter
                this.updateSelection();
                this.updateCurrentWord();
            }
            // If it's any other previously selected letter, do nothing
            return;
        }
        
        if (this.selectedPath.length > 0) {
            const lastIndex = this.selectedPath[this.selectedPath.length - 1];
            if (!this.isAdjacent(lastIndex, index)) return;
        }
        
        this.selectedPath.push(index);
        this.updateSelection();
        this.updateCurrentWord();
    }

    isAdjacent(pos1, pos2) {
        const neighbors = ADJACENCY[pos1] || [];
        return neighbors.includes(pos2);
    }

    updateSelection() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'in-path');
        });
        
        this.selectedPath.forEach((index, i) => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            if (cell) {
                if (i === this.selectedPath.length - 1) {
                    cell.classList.add('selected');
                } else {
                    cell.classList.add('in-path');
                }
            }
        });
    }

    clearSelection() {
        this.selectedPath = [];
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'in-path');
        });
        
        // Update current word display after clearing selection
        this.updateCurrentWord();
    }

    getSelectedWord() {
        return this.selectedPath.map(index => this.grid[index]).join('').toUpperCase();
    }

    updateCurrentWord() {
        const word = this.getSelectedWord();
        
        if (word && word.length > 0) {
            // Show the selected letters
            updateCurrentWord(word);
        } else if (this.letterSelectionWord) {
            // In letter selection mode - show specific instructions
            updateCurrentWord('Click on a letter position to reveal it!');
        } else {
            // Show default instructions when no word is selected
            updateCurrentWord('Select letters to form words');
        }
    }

    checkWord(word) {
        try {
            const upperWord = word.toUpperCase();
            
            if (this.foundWords.has(upperWord)) {
                showMessage(`"${upperWord}" already found!`, 'error');
                return;
            }
            
            // Track if this is the keystone word
            const isKeystoneWord = upperWord === this.currentPuzzle;
            
            // Check if it's a cornerstone word
            const cornerstoneWord = this.cornerstoneWords.find(w => w.word === upperWord);
            if (cornerstoneWord) {
                // Animate grid cells
                this.animateWordAcceptance();
                
                cornerstoneWord.found = true;
                this.foundWords.add(upperWord);
                
                // Check if this cornerstone word is also the keystone word
                if (isKeystoneWord) {
                    // Award 5 hints for finding the keystone word
                    for (let i = 0; i < 5; i++) {
                        this.hintSystem.earnHint(true); // Pass true for bonus animation
                    }
                    showMessage(`🎊 You found the KEYSTONE word: "${upperWord}"! +5 hints!`, 'cornerstone keystone-celebration');
                } else {
                    showMessage(`Cornerstone word found: "${upperWord}"!`, 'cornerstone');
                }
                
                this.updateFoundWords();
                this.updateStats();
                this.updateCornerstoneDisplay();
                this.updateHintButtons();
                this.saveProgress();
                
                // Check if puzzle is complete
                const allCornerstonesFound = this.cornerstoneWords.every(w => w.found);
                if (allCornerstonesFound) {
                    showMessage('🎉 Puzzle complete! All cornerstone words found!', 'cornerstone');
                }
            } else if (isKeystoneWord || this.validWords.includes(upperWord)) {
                // Animate grid cells
                this.animateWordAcceptance();
                
                this.foundWords.add(upperWord);
                
                // Check if this is the keystone word
                if (isKeystoneWord) {
                    // Award 5 hints for finding the keystone word
                    for (let i = 0; i < 5; i++) {
                        this.hintSystem.earnHint(true); // Pass true for bonus animation
                    }
                    showMessage(`🎊 You found the KEYSTONE word: "${upperWord}"! +5 hints!`, 'cornerstone keystone-celebration');
                } else {
                    // Valid word but not cornerstone - earn a hint
                    this.hintSystem.earnHint();
                    showMessage(`"${upperWord}" found! +1 hint earned`, 'success');
                }
                this.updateFoundWords();
                this.updateStats();
                this.updateHintButtons();
                this.updateCornerstoneDisplay();
                this.saveProgress();
            } else {
                showMessage('Not a valid word', 'error');
            }
        } catch (error) {
            logger.error('Error checking word:', error);
            showMessage('Error checking word. Please try again.', 'error');
        }
    }

    animateWordAcceptance() {
        // Animate all cells in the current path
        this.selectedPath.forEach((cellIndex, pathIndex) => {
            const cell = document.querySelector(`[data-index="${cellIndex}"]`);
            if (cell) {
                setTimeout(() => {
                    cell.classList.add('word-found');
                    setTimeout(() => {
                        cell.classList.remove('word-found');
                    }, 600);
                }, pathIndex * 50); // Stagger animation
            }
        });
    }

    displayDefinitionPopup(word, isCornerstone) {
        let definition;
        if (isCornerstone) {
            // Find the cornerstone word data
            const wordData = this.cornerstoneWords.find(w => w.word === word);
            definition = wordData ? wordData.definition : "A common English word";
        } else {
            // Look up in the valid words definitions map
            definition = this.wordDefinitions ? this.wordDefinitions.get(word.toUpperCase()) : "A common English word";
            if (!definition) {
                definition = "A common English word";
            }
        }
        
        showDefinition(word, definition, isCornerstone);
    }

    closeDefinition() {
        const overlay = document.getElementById('overlay');
        const popup = document.getElementById('definition-popup');
        if (overlay) overlay.classList.remove('show');
        if (popup) popup.classList.remove('show');
    }

    updateFoundWords() {
        const sortedWords = Array.from(this.foundWords).sort();
        const cornerstoneWordsSet = new Set(this.cornerstoneWords.map(w => w.word));
        updateFoundWordsList(sortedWords, Array.from(cornerstoneWordsSet));
    }

    updateStats() {
        const cornerstoneFound = this.cornerstoneWords.filter(w => w.found).length;
        const totalCornerstone = this.cornerstoneWords.length;
        const totalFound = this.foundWords.size;
        const totalPossible = this.allPossibleWords.size;
        
        // Update all stats displays to ensure consistency
        // UI should show: cornerstone found, total cornerstone, total found words, total possible words, hints
        updateStats(totalFound, cornerstoneFound, totalCornerstone, totalPossible, this.hintSystem.availableHints);
        updateCornerstoneProgress(cornerstoneFound, totalCornerstone);
        
        // Log for debugging if there's a mismatch
        if (totalCornerstone === 0 && this.allPossibleWords.size > 0) {
            logger.error(`No cornerstone words found for puzzle ${this.currentPuzzle}!`);
        }
    }

    updateCornerstoneDisplay() {
        const listEl = document.getElementById('cornerstone-words');
        if (!listEl) return;
        
        listEl.innerHTML = '';
        
        const displayWords = [...this.cornerstoneWords];
        // Always sort alphabetically
        displayWords.sort((a, b) => a.word.localeCompare(b.word));
        
        displayWords.forEach((wordData) => {
            const wordEl = document.createElement('div');
            wordEl.className = `cornerstone-word ${wordData.found ? 'found' : 'hidden'}`;
            
            let content = '<div>';
            if (wordData.found) {
                content += `<span class="cornerstone-word-text">${wordData.word}</span>`;
            } else if (this.globalLetterRevealMode) {
                // In global letter reveal mode - show individual clickable letters
                content += '<span class="cornerstone-word-text">';
                for (let i = 0; i < wordData.word.length; i++) {
                    const letter = wordData.revealed && wordData.revealed[i] ? wordData.word[i] : '_';
                    const isClickable = !wordData.revealed || !wordData.revealed[i];
                    const letterClass = isClickable ? 'clickable-letter-global' : 'revealed-letter-global';
                    content += `<span class="${letterClass}" data-word="${wordData.word}" data-letter-index="${i}">${letter}</span>`;
                    if (i < wordData.word.length - 1) content += ' ';
                }
                content += '</span>';
            } else if (wordData.pattern) {
                content += `<span class="cornerstone-word-text">${wordData.pattern}</span>`;
            } else {
                const hiddenPattern = '_ '.repeat(wordData.word.length).trim();
                content += `<span class="cornerstone-word-text">${hiddenPattern}</span>`;
            }
            
            // Always show word length
            content += `<span class="word-length">(${wordData.word.length} letters)</span>`;
            content += '</div>';
            
            if (wordData.showDefinition || wordData.found) {
                content += `<div class="word-definition">${wordData.definition}</div>`;
            }
            
            wordEl.innerHTML = content;
            
            if (wordData.found) {
                wordEl.onclick = () => this.displayDefinitionPopup(wordData.word, true);
            } else if (this.definitionRevealMode && !wordData.showDefinition) {
                // In definition reveal mode, make unfound words clickable
                wordEl.style.cursor = 'pointer';
                wordEl.classList.add('definition-selectable');
                wordEl.onclick = () => this.revealDefinitionForWord(wordData);
            }
            
            listEl.appendChild(wordEl);
        });
        
        // Add click handlers for letters in global reveal mode
        if (this.globalLetterRevealMode) {
            const clickableLetters = listEl.querySelectorAll('.clickable-letter-global');
            clickableLetters.forEach(letterEl => {
                letterEl.onclick = (e) => {
                    e.stopPropagation();
                    const word = letterEl.dataset.word;
                    const letterIndex = parseInt(letterEl.dataset.letterIndex);
                    const wordData = this.cornerstoneWords.find(w => w.word === word);
                    if (wordData) {
                        this.revealLetterAtPosition(wordData, letterIndex);
                    }
                };
            });
        }
    }

    updateHintButtons() {
        const hints = this.hintSystem.availableHints;
        
        // Enable/disable buttons
        const revealLetterBtn = document.getElementById('reveal-letter-btn');
        const showDefinitionBtn = document.getElementById('show-definition-btn');
        
        if (revealLetterBtn) {
            revealLetterBtn.disabled = hints < 1 || this.cornerstoneWords.every(w => w.found);
        }
        if (showDefinitionBtn) {
            showDefinitionBtn.disabled = hints < 1 || this.cornerstoneWords.every(w => w.showDefinition);
        }
    }

    // Hint methods
    revealLetter() {
        // Check if player has enough hints
        if (!this.hintSystem.canUseHint(1)) {
            showMessage('Not enough hints!', 'error');
            return;
        }

        // Check if there are any unfound cornerstone words
        const unfoundWords = this.cornerstoneWords.filter(w => !w.found);
        if (unfoundWords.length === 0) {
            showMessage('All cornerstone words found!', 'error');
            return;
        }

        // Enter global letter reveal mode for cornerstone words
        this.globalLetterRevealMode = true;
        
        // Initialize revealed arrays for all unfound words if needed
        this.cornerstoneWords.forEach(wordData => {
            if (!wordData.found && !wordData.revealed) {
                wordData.revealed = new Array(wordData.word.length).fill(false);
            }
        });
        
        showMessage('Click on any letter position to reveal it!', 'success');
        this.updateCornerstoneDisplay();
        
        // Add click handler for cancellation
        this.addLetterRevealCancelHandler();
    }

    startDefinitionRevealMode() {
        // Check if player has enough hints
        if (!this.hintSystem.canUseHint(1)) {
            showMessage('Not enough hints!', 'error');
            return;
        }

        // Find cornerstone words that don't have definitions shown
        const wordsWithoutDef = this.cornerstoneWords.filter(w => !w.showDefinition);
        if (wordsWithoutDef.length === 0) {
            showMessage('All definitions already revealed!', 'error');
            return;
        }

        // Enter definition reveal mode
        this.definitionRevealMode = true;
        showMessage('Click on a cornerstone word to reveal its definition!', 'success');
        this.updateCornerstoneDisplay();
        
        // Add click handler for cancellation
        this.addDefinitionCancelHandler();
    }


    exitLetterRevealMode() {
        this.globalLetterRevealMode = false;
        this.removeLetterRevealCancelHandler();
        this.updateCornerstoneDisplay();
    }

    addLetterRevealCancelHandler() {
        this.letterRevealCancelHandler = (e) => {
            // Check if click is on a clickable letter
            if (!e.target.classList.contains('clickable-letter-global')) {
                this.exitLetterRevealMode();
                showMessage('Letter reveal cancelled', 'info');
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', this.letterRevealCancelHandler);
        }, 100);
    }

    removeLetterRevealCancelHandler() {
        if (this.letterRevealCancelHandler) {
            document.removeEventListener('click', this.letterRevealCancelHandler);
            this.letterRevealCancelHandler = null;
        }
    }

    addDefinitionCancelHandler() {
        this.definitionCancelHandler = (e) => {
            // Check if click is outside cornerstone words
            if (!e.target.closest('.cornerstone-word')) {
                this.exitDefinitionRevealMode();
                showMessage('Definition reveal cancelled', 'info');
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', this.definitionCancelHandler);
        }, 100);
    }

    removeDefinitionCancelHandler() {
        if (this.definitionCancelHandler) {
            document.removeEventListener('click', this.definitionCancelHandler);
            this.definitionCancelHandler = null;
        }
    }

    exitDefinitionRevealMode() {
        this.definitionRevealMode = false;
        this.removeDefinitionCancelHandler();
        this.updateCornerstoneDisplay();
    }

    revealDefinitionForWord(wordData) {
        // Use the hint
        if (!this.hintSystem.useHints(1)) {
            showMessage('Not enough hints!', 'error');
            this.exitDefinitionRevealMode();
            return;
        }
        
        // Reveal the definition
        wordData.showDefinition = true;
        
        // Exit definition reveal mode
        this.exitDefinitionRevealMode();
        
        showMessage(`Definition revealed for "${wordData.word}"!`, 'success');
        
        // Update displays
        this.updateStats();
        this.updateCornerstoneDisplay();
        this.updateHintButtons();
        this.saveProgress();
    }
    
    revealLetterAtPosition(wordData, letterIndex) {
        // Exit letter reveal mode
        this.globalLetterRevealMode = false;
        this.removeLetterRevealCancelHandler();
        
        // Use the hint
        if (!this.hintSystem.useHints(1)) {
            showMessage('Not enough hints!', 'error');
            this.updateCornerstoneDisplay();
            return;
        }
        
        // Initialize revealed array if needed
        if (!wordData.revealed) {
            wordData.revealed = new Array(wordData.word.length).fill(false);
        }
        
        // Check if already revealed (shouldn't happen with proper UI)
        if (wordData.revealed[letterIndex]) {
            showMessage('That letter is already revealed!', 'error');
            // Refund the hint
            this.hintSystem.earnHint();
            this.updateCornerstoneDisplay();
            return;
        }
        
        // Reveal the letter
        wordData.revealed[letterIndex] = true;
        
        // Update pattern
        wordData.pattern = wordData.word.split('').map((letter, index) => {
            return wordData.revealed[index] ? letter : '_';
        }).join(' ');
        
        showMessage(`Letter '${wordData.word[letterIndex]}' revealed!`, 'success');
        
        // Update displays
        this.updateStats();
        this.updateCornerstoneDisplay();
        this.updateHintButtons();
        this.saveProgress();
    }

    async switchPuzzle() {
        // Get all puzzle names in order
        const puzzleNames = Object.keys(SAMPLE_PUZZLES);
        const currentIndex = puzzleNames.indexOf(this.currentPuzzle);
        const nextIndex = (currentIndex + 1) % puzzleNames.length;
        
        this.currentPuzzle = puzzleNames[nextIndex];
        this.foundWords.clear();
        this.hintSystem.reset();
        this.generatePuzzle();
        await this.findAllPossibleWords();
        this.updateFoundWords();
        this.updateStats();
        this.updateCornerstoneDisplay();
        this.updateHintButtons();
        this.clearSelection();
        this.saveProgress();
    }

    newGame() {
        this.foundWords.clear();
        this.hintSystem.reset();
        this.letterSelectionWord = null;
        this.definitionRevealMode = false;
        this.cornerstoneWords.forEach(w => {
            w.found = false;
            w.revealed = null;
            w.pattern = null;
            w.showDefinition = false;
        });
        this.updateFoundWords();
        this.updateStats();
        this.updateCornerstoneDisplay();
        this.updateHintButtons();
        this.clearSelection();
        this.saveProgress();
    }

    saveProgress() {
        const progress = {
            puzzle: this.currentPuzzle,
            foundWords: Array.from(this.foundWords),
            cornerstoneWords: this.cornerstoneWords,
            hintState: this.hintSystem.saveState(),
            sortAlphabetically: this.sortAlphabetically,
            date: new Date().toDateString()
        };
        localStorage.setItem('cornerstonesProgress', JSON.stringify(progress));
    }

    async loadProgress() {
        const saved = localStorage.getItem('cornerstonesProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            // Only load progress from the same day
            if (progress.date === new Date().toDateString()) {
                this.currentPuzzle = progress.puzzle;
                this.foundWords = new Set(progress.foundWords);
                this.generatePuzzle();
                await this.findAllPossibleWords();
                
                // Restore cornerstone word states
                if (progress.cornerstoneWords) {
                    progress.cornerstoneWords.forEach(saved => {
                        const word = this.cornerstoneWords.find(w => w.word === saved.word);
                        if (word) {
                            Object.assign(word, saved);
                        }
                    });
                }
                
                this.hintSystem.loadState(progress.hintState);
                this.sortAlphabetically = progress.sortAlphabetically || false;
                
                this.updateFoundWords();
                this.updateStats();
                this.updateCornerstoneDisplay();
                this.updateHintButtons();
            }
        }
    }
}