// Main Cornerstones Game Class
import { CROSS_POSITIONS, HAMILTONIAN_PATHS, SAMPLE_PUZZLES, ADJACENCY } from './constants.js';
import { HintSystem } from './hints.js';
import { updateStats, showMessage, updateCurrentWord, updateFoundWordsList, updateCornerstoneProgress, showDefinition } from './ui.js';
import { WordFinder } from './wordFinder.js';

export class CornerstonesGame {
    constructor() {
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
        this.cancelHandler = null;
        this.isDragging = false;
        this.touchStartTime = 0;
        this.wordFinder = new WordFinder();
        
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
        this.createGrid();
        this.generatePuzzle();
        await this.findAllPossibleWords();
        this.updateStats();
        this.updateCornerstoneDisplay();
        this.updateHintButtons();
        await this.loadProgress();
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
            console.error('Word database not loaded!');
            return;
        }
        console.log(`Word database loaded with ${window.COMPREHENSIVE_WORD_SET.size} words`);
        
        // Use WordFinder to get all words
        this.wordFinder.wordSet = window.COMPREHENSIVE_WORD_SET;
        this.allPossibleWords = this.wordFinder.findAllWords(this.grid);
        
        // Get the current puzzle's seed word
        const currentSeedWord = SAMPLE_PUZZLES[this.currentPuzzle].seedWord;
        
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
            if (window.COMMON_WORDS_SET && window.COMMON_WORDS_SET.has(word.toLowerCase())) {
                this.cornerstoneWords.push(wordData);
            } else {
                this.validWords.push(word);
            }
        });
        
        console.log(`Found ${this.cornerstoneWords.length} cornerstone words and ${this.validWords.length} other valid words`);
        
        // Fetch definitions asynchronously
        this.fetchAllDefinitions();
    }

    async fetchAllDefinitions() {
        console.log('Fetching definitions for all words...');
        
        // Fetch definitions for cornerstone words (with LLM enhancement)
        const cornerstonePromises = this.cornerstoneWords.map(async (wordData) => {
            try {
                // Check if it's a seed word first
                if (window.SEED_WORDS && window.SEED_WORDS[wordData.word]) {
                    wordData.definition = window.SEED_WORDS[wordData.word].definition;
                } else if (window.getDefinition) {
                    wordData.definition = await window.getDefinition(wordData.word, true); // true = isCornerstone
                } else if (window.getDefinitionSync) {
                    wordData.definition = window.getDefinitionSync(wordData.word);
                } else {
                    wordData.definition = "A common English word";
                }
            } catch (error) {
                console.warn(`Failed to fetch definition for cornerstone word "${wordData.word}":`, error);
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
                    definition = window.getDefinitionSync(word);
                }
                
                // Store in a map for quick lookup when showing definitions
                if (!this.wordDefinitions) {
                    this.wordDefinitions = new Map();
                }
                this.wordDefinitions.set(word.toUpperCase(), definition);
            } catch (error) {
                console.warn(`Failed to fetch definition for word "${word}":`, error);
                if (!this.wordDefinitions) {
                    this.wordDefinitions = new Map();
                }
                this.wordDefinitions.set(word.toUpperCase(), "A common English word");
            }
        });

        // Wait for all definitions to be fetched
        await Promise.all([...cornerstonePromises, ...validWordPromises]);
        
        // Update the display once all definitions are loaded
        this.updateCornerstoneDisplay();
        console.log('All definitions loaded successfully');
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

    endSelection(e) {
        if (!this.isSelecting) return;
        this.isSelecting = false;
        this.submitCurrentWord();
    }
    
    submitCurrentWord() {
        const word = this.getSelectedWord();
        
        // Clear selection first, before showing messages
        this.clearSelection();
        
        if (word.length >= 4) {
            this.checkWord(word);
        } else if (word.length > 0) {
            showMessage('Words must be at least 4 letters', 'error');
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
        const upperWord = word.toUpperCase();
        
        if (this.foundWords.has(upperWord)) {
            showMessage(`"${upperWord}" already found!`, 'error');
            return;
        }
        
        // Check if it's a cornerstone word
        const cornerstoneWord = this.cornerstoneWords.find(w => w.word === upperWord);
        if (cornerstoneWord) {
            // Animate grid cells
            this.animateWordAcceptance();
            
            cornerstoneWord.found = true;
            this.foundWords.add(upperWord);
            showMessage(`Cornerstone word found: "${upperWord}"!`, 'cornerstone');
            this.updateFoundWords();
            this.updateStats();
            this.updateCornerstoneDisplay();
            this.saveProgress();
        } else if (this.validWords.includes(upperWord)) {
            // Animate grid cells
            this.animateWordAcceptance();
            
            // Valid word but not cornerstone - earn a hint
            this.foundWords.add(upperWord);
            
            this.hintSystem.earnHint();
            showMessage(`"${upperWord}" found! +1 hint earned`, 'success');
            this.updateFoundWords();
            this.updateStats();
            this.updateHintButtons();
            this.updateCornerstoneDisplay(); // Update to make words clickable now that we have hints
            this.saveProgress();
        } else {
            showMessage('Not a valid word', 'error');
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

    showDefinition(word, isCornerstone) {
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
        
        updateStats(totalFound, cornerstoneFound, totalPossible, this.hintSystem.availableHints);
        updateCornerstoneProgress(cornerstoneFound, totalCornerstone);
    }

    updateCornerstoneDisplay() {
        const listEl = document.getElementById('cornerstone-words');
        if (!listEl) return;
        
        listEl.innerHTML = '';
        
        let displayWords = [...this.cornerstoneWords];
        // Always sort alphabetically
        displayWords.sort((a, b) => a.word.localeCompare(b.word));
        
        displayWords.forEach((wordData, index) => {
            const wordEl = document.createElement('div');
            wordEl.className = `cornerstone-word ${wordData.found ? 'found' : 'hidden'}`;
            
            let content = '<div>';
            if (wordData.found) {
                content += `<span class="cornerstone-word-text">${wordData.word}</span>`;
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
                wordEl.onclick = () => this.showDefinition(wordData.word, true);
            }
            
            listEl.appendChild(wordEl);
        });
    }

    updateHintButtons() {
        const hints = this.hintSystem.availableHints;
        
        // Enable/disable buttons
        const revealWordBtn = document.getElementById('reveal-word-btn');
        const revealLetterBtn = document.getElementById('reveal-letter-btn');
        const showDefinitionBtn = document.getElementById('show-definition-btn');
        
        if (revealWordBtn) {
            revealWordBtn.disabled = hints < 1 || this.cornerstoneWords.every(w => w.found);
        }
        if (revealLetterBtn) {
            revealLetterBtn.disabled = hints < 1 || this.cornerstoneWords.every(w => w.found);
        }
        if (showDefinitionBtn) {
            showDefinitionBtn.disabled = false; // Show definition is always free
        }
    }

    // Hint methods
    revealWord() {
        const result = this.hintSystem.revealWord(this.cornerstoneWords);
        if (result) {
            showMessage(`Revealed: ${result.word}`, 'success');
            this.updateStats();
            this.updateCornerstoneDisplay();
            this.updateHintButtons();
            this.saveProgress();
        } else {
            showMessage('No hints available or all words found!', 'error');
        }
    }

    revealLetter() {
        const result = this.hintSystem.revealLetter(this.cornerstoneWords);
        if (result) {
            showMessage(`Letter revealed in: ${result.word}`, 'success');
            this.updateStats();
            this.updateCornerstoneDisplay();
            this.updateHintButtons();
            this.saveProgress();
        } else {
            showMessage('No hints available or all words found!', 'error');
        }
    }

    showDefinition() {
        // Free hint - just enable definition mode
        const unfoundWords = this.cornerstoneWords.filter(w => !w.found);
        if (unfoundWords.length === 0) {
            showMessage('All cornerstone words found!', 'error');
            return;
        }
        
        // Pick a random unfound word and show its definition
        const randomWord = unfoundWords[Math.floor(Math.random() * unfoundWords.length)];
        randomWord.showDefinition = true;
        
        showMessage(`Definition revealed for a cornerstone word!`, 'success');
        this.updateCornerstoneDisplay();
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