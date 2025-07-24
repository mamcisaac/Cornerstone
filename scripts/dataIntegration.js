// Data Integration - Utilities to integrate puzzle builder with existing game data structures
import { SAMPLE_PUZZLES } from '../src/js/constants.js';

export class DataIntegration {
    constructor() {
        this.gameDataFormats = {
            keystoneWords: 'keystone-words.js',
            cornerstoneWords: 'cornerstone-words.js', 
            wordDefinitions: 'word-definitions.js',
            wordsDatabase: 'words-database-compact.js',
            samplePuzzles: 'constants.js'
        };
    }

    /**
     * Convert puzzle builder output to game data format
     * @param {Object} puzzle - Puzzle from PuzzleBuilder
     * @returns {Object} Game-compatible puzzle data
     */
    convertPuzzleToGameFormat(puzzle) {
        return {
            seedWord: puzzle.keystoneWord,
            pathIndex: puzzle.pathIndex,
            grid: puzzle.grid,
            words: {
                all: puzzle.allWords,
                cornerstone: puzzle.cornerstoneWords,
                total: puzzle.totalWords || puzzle.allWords.length,
                cornerstoneCount: puzzle.cornerstoneCount || puzzle.cornerstoneWords.length
            },
            metadata: {
                difficulty: this.calculateDifficulty(puzzle),
                generatedAt: new Date().toISOString(),
                wordCount: puzzle.allWords.length,
                cornerstoneRatio: puzzle.cornerstoneWords.length / puzzle.allWords.length
            }
        };
    }

    /**
     * Generate keystone words data file content
     * @param {Array} puzzles - Array of validated puzzles
     * @param {Object} existingDefinitions - Existing definitions to merge
     * @returns {string} JavaScript file content for keystone-words.js
     */
    generateKeystoneWordsFile(puzzles, existingDefinitions = {}) {
        const keystoneWords = {};
        
        for (const puzzle of puzzles) {
            const word = puzzle.keystoneWord;
            const definition = existingDefinitions[word] || 
                            this.generateKeystoneDefinition(word) ||
                            `A ${word.length}-letter word used as the foundation for this puzzle`;
            
            keystoneWords[word] = {
                word: word,
                definition: definition
            };
        }

        return this.formatKeystoneWordsFile(keystoneWords);
    }

    /**
     * Format keystone words as JavaScript file content
     * @param {Object} keystoneWords - Keystone words object
     * @returns {string} Formatted JavaScript content
     */
    formatKeystoneWordsFile(keystoneWords) {
        const header = `// Keystone words for puzzle generation - all must be exactly 12 letters
// These words will be treated as cornerstone words in their respective puzzles

const KEYSTONE_WORDS = {`;

        const entries = Object.entries(keystoneWords)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([word, data]) => {
                const definition = data.definition.replace(/"/g, '\\"');
                return `    "${word}": {
        word: "${word}",
        definition: "${definition}"
    }`;
            });

        const footer = `};

// Export for use in the game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KEYSTONE_WORDS;
}

// Also make it available globally for browser use
if (typeof window !== 'undefined') {
    window.KEYSTONE_WORDS = KEYSTONE_WORDS;
}`;

        return `${header}\n${entries.join(',\n')}\n${footer}`;
    }

    /**
     * Generate sample puzzles data for constants.js
     * @param {Array} puzzles - Array of validated puzzles
     * @returns {string} JavaScript object content for SAMPLE_PUZZLES
     */
    generateSamplePuzzlesData(puzzles) {
        const samplePuzzles = {};
        
        for (const puzzle of puzzles) {
            samplePuzzles[puzzle.keystoneWord] = {
                seedWord: puzzle.keystoneWord,
                pathIndex: puzzle.pathIndex
            };
        }

        const entries = Object.entries(samplePuzzles)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([word, data]) => `    "${word}": { seedWord: "${data.seedWord}", pathIndex: ${data.pathIndex} }`)
            .join(',\n');

        return `export const SAMPLE_PUZZLES = {\n${entries}\n};`;
    }

    /**
     * Generate word definitions file content
     * @param {Object} definitions - Object mapping words to definition data
     * @returns {string} JavaScript file content for word-definitions.js
     */
    generateWordDefinitionsFile(definitions) {
        const header = `// Real word definitions fetched from Dictionary API
// Auto-generated on ${new Date().toISOString()}
// Contains ${Object.keys(definitions).length} definitions

const COMMON_DEFINITIONS = {`;

        const entries = Object.entries(definitions)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([word, defData]) => {
                const definition = typeof defData === 'string' ? defData : 
                                 (defData.definition || defData.text || 'No definition available');
                const cleanDef = definition.replace(/"/g, '\\"').replace(/\n/g, ' ');
                return `    "${word}": "${cleanDef}"`;
            });

        const footer = `};

// Export for use in the game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = COMMON_DEFINITIONS;
}

// Also make it available globally for browser use
if (typeof window !== 'undefined') {
    window.COMMON_DEFINITIONS = COMMON_DEFINITIONS;
}`;

        return `${header}\n${entries.join(',\n')}\n${footer}`;
    }

    /**
     * Generate words database file content
     * @param {Set} allWords - Set of all valid words from puzzles
     * @returns {string} JavaScript file content for words-database-compact.js
     */
    generateWordsDatabase(allWords) {
        const wordsArray = [...allWords].sort();
        
        const header = `// Compact word database for Cornerstones game
// Auto-generated on ${new Date().toISOString()}
// Contains ${wordsArray.length} words

const WORDS_DATABASE = [`;

        // Format words in groups of 10 per line for readability
        const wordGroups = [];
        for (let i = 0; i < wordsArray.length; i += 10) {
            const group = wordsArray.slice(i, i + 10)
                .map(word => `"${word}"`)
                .join(', ');
            wordGroups.push(`    ${group}`);
        }

        const footer = `];

// Export for use in the game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WORDS_DATABASE;
}

// Also make it available globally for browser use
if (typeof window !== 'undefined') {
    window.WORDS_DATABASE = WORDS_DATABASE;
}`;

        return `${header}\n${wordGroups.join(',\n')}\n${footer}`;
    }

    /**
     * Update existing constants.js with new sample puzzles
     * @param {string} constantsContent - Current constants.js content
     * @param {Array} puzzles - New puzzles to add
     * @returns {string} Updated constants.js content
     */
    updateConstantsFile(constantsContent, puzzles) {
        const newSamplePuzzles = this.generateSamplePuzzlesData(puzzles);
        
        // Replace the SAMPLE_PUZZLES section
        const updatedContent = constantsContent.replace(
            /export const SAMPLE_PUZZLES = \{[\s\S]*?\};/,
            newSamplePuzzles
        );

        return updatedContent;
    }

    /**
     * Merge new definitions with existing definitions
     * @param {Object} existingDefinitions - Current definitions object
     * @param {Object} newDefinitions - New definitions to merge
     * @returns {Object} Merged definitions object
     */
    mergeDefinitions(existingDefinitions, newDefinitions) {
        const merged = { ...existingDefinitions };
        
        for (const [word, newDef] of Object.entries(newDefinitions)) {
            const upperWord = word.toUpperCase();
            
            if (!merged[upperWord] || this.isDefinitionBetter(newDef, merged[upperWord])) {
                merged[upperWord] = newDef;
            }
        }
        
        return merged;
    }

    /**
     * Determine if a new definition is better than an existing one
     * @param {Object|string} newDef - New definition
     * @param {Object|string} existingDef - Existing definition
     * @returns {boolean} True if new definition is better
     */
    isDefinitionBetter(newDef, existingDef) {
        // Simple heuristics for definition quality
        const newText = typeof newDef === 'string' ? newDef : (newDef.definition || newDef.text || '');
        const existingText = typeof existingDef === 'string' ? existingDef : (existingDef.definition || existingDef.text || '');
        
        // Prefer definitions with validation results
        if (typeof newDef === 'object' && newDef.validationResult && newDef.validationResult.valid) {
            if (typeof existingDef !== 'object' || !existingDef.validationResult || !existingDef.validationResult.valid) {
                return true;
            }
        }
        
        // Prefer longer, more descriptive definitions
        if (newText.length > existingText.length * 1.2) {
            return true;
        }
        
        // Prefer definitions without obvious quality issues
        if (newText.length >= 20 && !newText.toLowerCase().includes('alternative') && 
            !newText.toLowerCase().includes('variant') && !newText.toLowerCase().includes('see ')) {
            return true;
        }
        
        return false;
    }

    /**
     * Generate a basic definition for a keystone word
     * @param {string} word - Keystone word
     * @returns {string} Generated definition
     */
    generateKeystoneDefinition(word) {
        // This is a fallback - in practice, definitions should come from APIs
        const wordLower = word.toLowerCase();
        
        // Some basic patterns for common word types
        if (wordLower.endsWith('tion') || wordLower.endsWith('sion')) {
            return `The process or result of ${wordLower.slice(0, -4)}ing`;
        }
        if (wordLower.endsWith('ing')) {
            return `The action of ${wordLower.slice(0, -3)}`;
        }
        if (wordLower.endsWith('ness')) {
            return `The quality or state of being ${wordLower.slice(0, -4)}`;
        }
        if (wordLower.endsWith('ment')) {
            return `The result or process of ${wordLower.slice(0, -4)}ing`;
        }
        
        return null; // Let the definition fetcher handle it
    }

    /**
     * Calculate difficulty level for a puzzle
     * @param {Object} puzzle - Puzzle object
     * @returns {string} Difficulty level
     */
    calculateDifficulty(puzzle) {
        if (!puzzle.allWords || !puzzle.cornerstoneWords) {
            return 'Unknown';
        }
        
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

    /**
     * Extract words from existing game data files
     * @param {Object} gameData - Object containing loaded game data
     * @returns {Object} Extracted word sets and definitions
     */
    extractExistingGameData(gameData) {
        const extracted = {
            keystoneWords: new Set(),
            commonWords: new Set(),
            allWords: new Set(),
            definitions: {},
            samplePuzzles: {}
        };

        // Extract keystone words
        if (gameData.KEYSTONE_WORDS) {
            for (const [word, data] of Object.entries(gameData.KEYSTONE_WORDS)) {
                extracted.keystoneWords.add(word);
                if (data.definition) {
                    extracted.definitions[word] = data.definition;
                }
            }
        }

        // Extract common words
        if (gameData.COMMON_WORDS_LIST) {
            gameData.COMMON_WORDS_LIST.forEach(word => {
                if (word.length >= 4) {
                    extracted.commonWords.add(word.toUpperCase());
                }
            });
        }

        // Extract words database
        if (gameData.WORDS_DATABASE) {
            gameData.WORDS_DATABASE.forEach(word => {
                extracted.allWords.add(word.toUpperCase());
            });
        }

        // Extract definitions
        if (gameData.COMMON_DEFINITIONS) {
            Object.assign(extracted.definitions, gameData.COMMON_DEFINITIONS);
        }

        // Extract sample puzzles
        if (gameData.SAMPLE_PUZZLES) {
            extracted.samplePuzzles = { ...gameData.SAMPLE_PUZZLES };
        }

        return extracted;
    }

    /**
     * Validate data compatibility with existing game format
     * @param {Object} newData - New data to validate
     * @param {Object} existingData - Existing game data
     * @returns {Object} Validation result with compatibility issues
     */
    validateDataCompatibility(newData, existingData) {
        const issues = {
            errors: [],
            warnings: [],
            compatible: true
        };

        // Check keystone word format
        if (newData.keystoneWords) {
            for (const word of newData.keystoneWords) {
                if (typeof word !== 'string' || word.length !== 12 || !/^[A-Z]+$/.test(word)) {
                    issues.errors.push(`Invalid keystone word format: ${word}`);
                    issues.compatible = false;
                }
            }
        }

        // Check for word conflicts
        if (existingData.keystoneWords && newData.keystoneWords) {
            const conflicts = [...newData.keystoneWords].filter(word => 
                existingData.keystoneWords.has(word)
            );
            if (conflicts.length > 0) {
                issues.warnings.push(`Keystone word conflicts: ${conflicts.slice(0, 3).join(', ')}${conflicts.length > 3 ? '...' : ''}`);
            }
        }

        // Check definition format consistency
        if (newData.definitions) {
            for (const [word, def] of Object.entries(newData.definitions)) {
                if (typeof def !== 'string' && typeof def !== 'object') {
                    issues.errors.push(`Invalid definition format for ${word}`);
                    issues.compatible = false;
                }
            }
        }

        return issues;
    }

    /**
     * Generate complete data package for game integration
     * @param {Array} puzzles - Validated puzzles
     * @param {Object} definitions - Word definitions
     * @param {Object} existingData - Existing game data to merge with
     * @returns {Object} Complete data package
     */
    generateCompleteDataPackage(puzzles, definitions, existingData = {}) {
        console.log(`Generating complete data package for ${puzzles.length} puzzles...`);
        
        // Extract existing data
        const existing = this.extractExistingGameData(existingData);
        
        // Collect all words from puzzles
        const allPuzzleWords = new Set();
        const keystoneWords = new Set();
        
        puzzles.forEach(puzzle => {
            keystoneWords.add(puzzle.keystoneWord);
            puzzle.allWords.forEach(word => allPuzzleWords.add(word.toUpperCase()));
        });

        // Merge with existing data
        const mergedDefinitions = this.mergeDefinitions(existing.definitions, definitions);
        const allWords = new Set([...existing.allWords, ...allPuzzleWords]);
        const allKeystoneWords = new Set([...existing.keystoneWords, ...keystoneWords]);

        // Generate file contents
        const dataPackage = {
            files: {
                'keystone-words.js': this.generateKeystoneWordsFile(
                    puzzles.filter(p => keystoneWords.has(p.keystoneWord)), 
                    mergedDefinitions
                ),
                'word-definitions.js': this.generateWordDefinitionsFile(mergedDefinitions),
                'words-database-compact.js': this.generateWordsDatabase(allWords),
                'constants-sample-puzzles.js': this.generateSamplePuzzlesData(puzzles)
            },
            statistics: {
                totalPuzzles: puzzles.length,
                newKeystoneWords: keystoneWords.size,
                totalKeystoneWords: allKeystoneWords.size,
                newWords: allPuzzleWords.size,
                totalWords: allWords.size,
                newDefinitions: Object.keys(definitions).length,
                totalDefinitions: Object.keys(mergedDefinitions).length
            },
            generatedAt: new Date().toISOString()
        };

        console.log(`Data package generated:`);
        console.log(`  - ${dataPackage.statistics.totalPuzzles} puzzles`);
        console.log(`  - ${dataPackage.statistics.totalWords} total words`);
        console.log(`  - ${dataPackage.statistics.totalDefinitions} definitions`);

        return dataPackage;
    }

    /**
     * Export data package as downloadable files
     * @param {Object} dataPackage - Complete data package
     * @returns {Object} Export information
     */
    exportDataPackage(dataPackage) {
        const exports = {
            files: [],
            manifest: {
                ...dataPackage.statistics,
                exportedAt: new Date().toISOString(),
                fileCount: Object.keys(dataPackage.files).length
            }
        };

        // Prepare each file for export
        for (const [filename, content] of Object.entries(dataPackage.files)) {
            exports.files.push({
                filename: filename,
                content: content,
                size: content.length,
                type: 'application/javascript'
            });
        }

        // Add manifest file
        exports.files.push({
            filename: 'manifest.json',
            content: JSON.stringify(exports.manifest, null, 2),
            size: JSON.stringify(exports.manifest, null, 2).length,
            type: 'application/json'
        });

        return exports;
    }
}