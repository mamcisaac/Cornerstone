// Puzzle Builder - Generates valid Cornerstones puzzles from keystone words with word cleaning
import { HAMILTONIAN_PATHS, ADJACENCY, CROSS_POSITIONS } from './constants.js';
import { WordFinder } from './wordFinder.js';
import { EnhancedDefinitionFetcher } from './enhancedDefinitionFetcher.js';

export class PuzzleBuilder {
    constructor(options = {}) {
        this.wordFinder = new WordFinder();
        this.commonWords = new Set();
        this.allWords = new Set();
        this.minCornerstoneWords = 20;
        this.maxAttempts = 100;
        
        // Enhanced definition fetching and word cleaning
        this.definitionFetcher = new EnhancedDefinitionFetcher(options.definitionFetcher);
        this.existingDefinitions = new Map();
        this.cleanWords = options.cleanWords !== false; // Default true
        this.wordCleaningStats = {
            originalWordCount: 0,
            cleanedWordCount: 0,
            wordsRemoved: 0,
            puzzlesWithCleaning: 0
        };
        
        this.loadWordSets();
    }

    async loadWordSets() {
        try {
            // Load common words (cornerstone candidates)
            if (typeof COMMON_WORDS_LIST !== 'undefined') {
                COMMON_WORDS_LIST.forEach(word => {
                    if (word.length >= 4) {
                        this.commonWords.add(word.toUpperCase());
                    }
                });
            }

            // Load all valid words from the word database
            if (typeof WORDS_DATABASE !== 'undefined') {
                WORDS_DATABASE.forEach(word => {
                    this.allWords.add(word.toUpperCase());
                });
                this.wordFinder.wordSet = this.allWords;
                this.wordCleaningStats.originalWordCount = this.allWords.size;
            }

            // Load existing definitions for API optimization
            if (typeof COMMON_DEFINITIONS !== 'undefined') {
                await this.loadExistingDefinitions(COMMON_DEFINITIONS);
            }

            console.log(`Loaded ${this.commonWords.size} common words and ${this.allWords.size} total words`);
        } catch (error) {
            console.error('Error loading word sets:', error);
        }
    }

    /**
     * Load existing definitions to optimize API usage
     * @param {Object} existingDefs - Existing definitions object
     */
    async loadExistingDefinitions(existingDefs) {
        // Load into our local map
        Object.entries(existingDefs).forEach(([word, definition]) => {
            this.existingDefinitions.set(word.toUpperCase(), definition);
        });

        // Load into definition fetcher for API optimization
        await this.definitionFetcher.loadExistingDefinitions(existingDefs);
    }

    /**
     * Validate that a word can serve as a keystone word
     * @param {string} keystoneWord - The 12-letter word to validate
     * @returns {boolean} True if valid keystone word
     */
    isValidKeystoneWord(keystoneWord) {
        if (!keystoneWord || typeof keystoneWord !== 'string') {
            return false;
        }

        const word = keystoneWord.toUpperCase().trim();
        
        // Must be exactly 12 letters
        if (word.length !== 12) {
            console.log(`Invalid keystone word length: ${word} (${word.length} letters)`);
            return false;
        }

        // Must contain only letters
        if (!/^[A-Z]+$/.test(word)) {
            console.log(`Invalid keystone word characters: ${word}`);
            return false;
        }

        // Must be a valid word
        if (!this.allWords.has(word)) {
            console.log(`Keystone word not in dictionary: ${word}`);
            return false;
        }

        return true;
    }

    /**
     * Generate a puzzle from a keystone word by finding the best Hamiltonian path
     * @param {string} keystoneWord - The 12-letter keystone word  
     * @returns {Object|null} Puzzle data or null if no valid puzzle found
     */
    async generatePuzzle(keystoneWord) {
        if (!this.isValidKeystoneWord(keystoneWord)) {
            return null;
        }

        const word = keystoneWord.toUpperCase();
        console.log(`Generating puzzle for keystone word: ${word}`);

        let bestPuzzle = null;
        let maxCornerstoneWords = 0;

        // Try each Hamiltonian path
        for (let pathIndex = 0; pathIndex < HAMILTONIAN_PATHS.length; pathIndex++) {
            const path = HAMILTONIAN_PATHS[pathIndex];
            const grid = this.createGridFromPath(word, path);
            
            if (!grid) continue;

            // Find all valid words in this grid
            const allValidWords = this.wordFinder.findAllWords(grid);
            
            // Count cornerstone words (common words)
            const cornerstoneWords = [...allValidWords].filter(w => this.commonWords.has(w));
            
            console.log(`Path ${pathIndex}: Found ${allValidWords.size} total words, ${cornerstoneWords.length} cornerstone words`);

            // Check if this path meets our minimum requirements
            if (cornerstoneWords.length >= this.minCornerstoneWords) {
                if (cornerstoneWords.length > maxCornerstoneWords) {
                    maxCornerstoneWords = cornerstoneWords.length;
                    bestPuzzle = {
                        keystoneWord: word,
                        pathIndex: pathIndex,
                        grid: grid,
                        allWords: [...allValidWords].sort(),
                        cornerstoneWords: cornerstoneWords.sort(),
                        totalWords: allValidWords.size,
                        cornerstoneCount: cornerstoneWords.length
                    };
                }
            }
        }

        if (bestPuzzle) {
            console.log(`✅ Successfully generated puzzle for ${word}`);
            console.log(`   Path: ${bestPuzzle.pathIndex}`);
            console.log(`   Total words: ${bestPuzzle.totalWords}`);
            console.log(`   Cornerstone words: ${bestPuzzle.cornerstoneCount}`);
            
            // Clean words if enabled
            if (this.cleanWords) {
                bestPuzzle = await this.cleanPuzzleWords(bestPuzzle);
                
                // Re-validate after cleaning
                if (bestPuzzle && bestPuzzle.cornerstoneWords.length < this.minCornerstoneWords) {
                    console.log(`❌ Puzzle ${word} failed after word cleaning (${bestPuzzle.cornerstoneWords.length} cornerstone words remaining)`);
                    return null;
                }
            }
            
            return bestPuzzle;
        } else {
            console.log(`❌ Failed to generate puzzle for ${word} (insufficient cornerstone words)`);
            return null;
        }
    }

    /**
     * Create a cross-shaped grid from a keystone word and Hamiltonian path
     * @param {string} keystoneWord - The 12-letter word
     * @param {Array} path - Hamiltonian path array of positions
     * @returns {Array} Grid array with letters at cross positions
     */
    createGridFromPath(keystoneWord, path) {
        if (keystoneWord.length !== 12 || path.length !== 12) {
            return null;
        }

        // Create empty grid (16 positions, only cross positions used)
        const grid = new Array(16).fill('');
        
        // Place letters according to the Hamiltonian path
        for (let i = 0; i < 12; i++) {
            const position = path[i];
            const letter = keystoneWord[i];
            
            // Verify position is valid in cross shape
            if (!CROSS_POSITIONS.includes(position)) {
                console.error(`Invalid position ${position} in path`);
                return null;
            }
            
            grid[position] = letter;
        }

        return grid;
    }

    /**
     * Clean puzzle words by removing those without definitions
     * @param {Object} puzzle - Puzzle to clean
     * @returns {Object} Cleaned puzzle with updated word lists
     */
    async cleanPuzzleWords(puzzle) {
        console.log(`🧹 Cleaning words for puzzle ${puzzle.keystoneWord}...`);
        
        // Process all words for definitions
        const progressCallback = (progress) => {
            if (progress.current % 20 === 0) {
                console.log(`     📖 Processed ${progress.current}/${progress.total} words (${progress.found} found, ${progress.removed} removed)`);
            }
        };
        
        const results = await this.definitionFetcher.processWordsForDefinitions(
            puzzle.allWords, 
            progressCallback
        );
        
        // Update puzzle with cleaned words
        const cleanedAllWords = puzzle.allWords.filter(word => 
            !results.wordsToRemove.includes(word)
        );
        
        const cleanedCornerstoneWords = puzzle.cornerstoneWords.filter(word => 
            !results.wordsToRemove.includes(word)
        );
        
        // Update word database if words were removed
        if (results.wordsToRemove.length > 0) {
            console.log(`     ❌ Removing ${results.wordsToRemove.length} words without definitions`);
            this.removeWordsFromDatabase(results.wordsToRemove);
            this.wordCleaningStats.puzzlesWithCleaning++;
        }
        
        // Create cleaned puzzle
        const cleanedPuzzle = {
            ...puzzle,
            allWords: cleanedAllWords,
            cornerstoneWords: cleanedCornerstoneWords,
            totalWords: cleanedAllWords.length,
            cornerstoneCount: cleanedCornerstoneWords.length,
            definitions: Object.fromEntries(results.definitionsFound),
            cleaningStats: {
                originalWords: puzzle.allWords.length,
                cleanedWords: cleanedAllWords.length,
                wordsRemoved: results.wordsToRemove.length,
                definitionsFound: results.definitionsFound.size,
                apiCallsSaved: results.apiCallsSaved
            }
        };
        
        console.log(`     ✅ Cleaned puzzle: ${cleanedPuzzle.allWords.length} words (${cleanedPuzzle.cornerstoneWords.length} cornerstone)`);
        console.log(`     📊 API calls saved: ${results.apiCallsSaved}`);
        
        return cleanedPuzzle;
    }

    /**
     * Remove words from the word database
     * @param {Array} wordsToRemove - Words to remove
     */
    removeWordsFromDatabase(wordsToRemove) {
        const removeSet = new Set(wordsToRemove.map(w => w.toUpperCase()));
        
        // Remove from our internal sets
        for (const word of removeSet) {
            this.allWords.delete(word);
            this.commonWords.delete(word);
        }
        
        // Update word finder
        this.wordFinder.wordSet = this.allWords;
        
        // Update stats
        this.wordCleaningStats.wordsRemoved += wordsToRemove.length;
        this.wordCleaningStats.cleanedWordCount = this.allWords.size;
        
        console.log(`🗑️  Removed ${wordsToRemove.length} words from database (${this.allWords.size} remaining)`);
    }

    /**
     * Get word cleaning statistics
     * @returns {Object} Cleaning statistics
     */
    getWordCleaningStats() {
        return {
            ...this.wordCleaningStats,
            reductionPercentage: Math.round(
                (this.wordCleaningStats.wordsRemoved / this.wordCleaningStats.originalWordCount) * 100
            ),
            definitionFetcherStats: this.definitionFetcher.getStatistics()
        };
    }

    /**
     * Validate a complete puzzle for correctness and solvability
     * @param {Object} puzzle - Puzzle object to validate
     * @returns {Object} Validation result with success flag and details
     */
    validatePuzzle(puzzle) {
        const result = {
            success: false,
            errors: [],
            warnings: [],
            stats: {}
        };

        try {
            // Check required properties
            if (!puzzle.keystoneWord || !puzzle.grid || !puzzle.allWords || !puzzle.cornerstoneWords) {
                result.errors.push('Missing required puzzle properties');
                return result;
            }

            // Validate keystone word
            if (!this.isValidKeystoneWord(puzzle.keystoneWord)) {
                result.errors.push('Invalid keystone word');
            }

            // Validate grid structure
            if (puzzle.grid.length !== 16) {
                result.errors.push('Invalid grid length');
            }

            // Check cross positions are filled
            let filledPositions = 0;
            for (const pos of CROSS_POSITIONS) {
                if (puzzle.grid[pos]) {
                    filledPositions++;
                }
            }
            if (filledPositions !== 12) {
                result.errors.push(`Expected 12 filled positions, found ${filledPositions}`);
            }

            // Validate minimum cornerstone words
            if (puzzle.cornerstoneWords.length < this.minCornerstoneWords) {
                result.errors.push(`Insufficient cornerstone words: ${puzzle.cornerstoneWords.length} < ${this.minCornerstoneWords}`);
            }

            // Verify word finding consistency
            const verifyWords = this.wordFinder.findAllWords(puzzle.grid);
            if (verifyWords.size !== puzzle.allWords.length) {
                result.warnings.push(`Word count mismatch: expected ${puzzle.allWords.length}, found ${verifyWords.size}`);
            }

            // Check if keystone word is findable in grid
            const keystoneFound = [...verifyWords].includes(puzzle.keystoneWord);
            if (keystoneFound) {
                result.stats.keystoneWordFound = true;
            } else {
                result.warnings.push('Keystone word not findable in grid');
            }

            // Calculate statistics
            result.stats = {
                ...result.stats,
                totalWords: puzzle.allWords.length,
                cornerstoneWords: puzzle.cornerstoneWords.length,
                cornerstonePercentage: Math.round((puzzle.cornerstoneWords.length / puzzle.allWords.length) * 100),
                averageWordLength: Math.round(puzzle.allWords.reduce((sum, word) => sum + word.length, 0) / puzzle.allWords.length * 10) / 10
            };

            // Success if no errors
            result.success = result.errors.length === 0;

        } catch (error) {
            result.errors.push(`Validation error: ${error.message}`);
        }

        return result;
    }

    /**
     * Generate puzzles for multiple keystone words
     * @param {Array} keystoneWords - Array of keystone words to process
     * @param {Function} progressCallback - Optional callback for progress updates
     * @returns {Array} Array of successfully generated puzzles
     */
    async generateMultiplePuzzles(keystoneWords, progressCallback = null) {
        const results = [];
        const total = keystoneWords.length;

        console.log(`Starting batch puzzle generation for ${total} keystone words`);

        for (let i = 0; i < keystoneWords.length; i++) {
            const word = keystoneWords[i];
            
            if (progressCallback) {
                progressCallback({
                    current: i + 1,
                    total: total,
                    word: word,
                    completed: results.length
                });
            }

            try {
                const puzzle = await this.generatePuzzle(word);
                if (puzzle) {
                    const validation = this.validatePuzzle(puzzle);
                    if (validation.success) {
                        results.push(puzzle);
                        console.log(`✅ ${i + 1}/${total}: Generated puzzle for ${word}`);
                    } else {
                        console.log(`❌ ${i + 1}/${total}: Validation failed for ${word}:`, validation.errors);
                    }
                } else {
                    console.log(`❌ ${i + 1}/${total}: Could not generate puzzle for ${word}`);
                }
            } catch (error) {
                console.error(`Error generating puzzle for ${word}:`, error);
            }
        }

        console.log(`Completed batch generation: ${results.length}/${total} puzzles created`);
        return results;
    }

    /**
     * Export puzzle data in the format expected by the game
     * @param {Object} puzzle - Puzzle object to export
     * @returns {Object} Exported puzzle data
     */
    exportPuzzleData(puzzle) {
        return {
            seedWord: puzzle.keystoneWord,
            pathIndex: puzzle.pathIndex,
            grid: puzzle.grid,
            words: {
                all: puzzle.allWords,
                cornerstone: puzzle.cornerstoneWords,
                total: puzzle.totalWords,
                cornerstoneCount: puzzle.cornerstoneCount
            },
            stats: {
                difficulty: this.calculateDifficulty(puzzle),
                averageWordLength: Math.round(puzzle.allWords.reduce((sum, word) => sum + word.length, 0) / puzzle.allWords.length * 10) / 10,
                longestWord: Math.max(...puzzle.allWords.map(w => w.length)),
                shortestWord: Math.min(...puzzle.allWords.map(w => w.length))
            }
        };
    }

    /**
     * Calculate puzzle difficulty based on various factors
     * @param {Object} puzzle - Puzzle object
     * @returns {string} Difficulty rating (Easy, Medium, Hard, Expert)
     */
    calculateDifficulty(puzzle) {
        const cornerstoneRatio = puzzle.cornerstoneWords.length / puzzle.allWords.length;
        const avgWordLength = puzzle.allWords.reduce((sum, word) => sum + word.length, 0) / puzzle.allWords.length;
        
        if (cornerstoneRatio > 0.7 && avgWordLength < 6) {
            return 'Easy';
        } else if (cornerstoneRatio > 0.5 && avgWordLength < 7) {
            return 'Medium';
        } else if (cornerstoneRatio > 0.3) {
            return 'Hard';
        } else {
            return 'Expert';
        }
    }
}