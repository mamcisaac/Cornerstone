// Word Discovery System - Enhanced word finding with path optimization and comprehensive search
import { ADJACENCY } from './constants.js';
import { WordFinder } from './wordFinder.js';

export class WordDiscoverySystem extends WordFinder {
    constructor(options = {}) {
        super();
        this.options = {
            minWordLength: options.minWordLength || 4,
            maxWordLength: options.maxWordLength || 12,
            includeDiagonals: options.includeDiagonals !== false, // Default true
            findAllPaths: options.findAllPaths || false,
            optimizeSearch: options.optimizeSearch !== false, // Default true
            cacheResults: options.cacheResults !== false, // Default true
            ...options
        };
        
        this.pathCache = new Map();
        this.wordPathMap = new Map(); // Maps words to their valid paths
        this.searchStats = {
            totalSearches: 0,
            cacheHits: 0,
            pathsExplored: 0,
            wordsFound: 0
        };
        
        // Dynamic word set management
        this.wordSetVersion = 0; // Track word set changes for cache invalidation
    }

    /**
     * Find all words in a grid with comprehensive path discovery
     * @param {Array} grid - 16-element grid array
     * @param {Set} wordSet - Set of valid words to search for
     * @returns {Object} Complete word discovery results
     */
    findAllWordsComprehensive(grid, wordSet = null) {
        this.wordSet = wordSet || this.wordSet;
        this.searchStats.totalSearches++;
        
        const cacheKey = this.generateGridCacheKey(grid);
        if (this.options.cacheResults && this.pathCache.has(cacheKey)) {
            this.searchStats.cacheHits++;
            return this.pathCache.get(cacheKey);
        }

        console.log('Starting comprehensive word discovery...');
        const startTime = performance.now();
        
        const results = {
            allWords: new Set(),
            wordPaths: new Map(), // Maps word to array of paths
            wordsByLength: new Map(),
            cornerStoneWords: new Set(),
            statistics: {
                totalWords: 0,
                averageLength: 0,
                lengthDistribution: {},
                searchTime: 0,
                pathsExplored: 0
            }
        };

        // Find words starting from each valid grid position
        for (let position = 0; position < grid.length; position++) {
            if (grid[position]) {
                this.searchFromPosition(grid, position, '', new Set(), [], results);
            }
        }

        // Calculate statistics
        this.calculateWordStatistics(results);
        results.statistics.searchTime = performance.now() - startTime;
        results.statistics.pathsExplored = this.searchStats.pathsExplored;

        console.log(`Word discovery complete: ${results.allWords.size} words found in ${results.statistics.searchTime.toFixed(2)}ms`);

        if (this.options.cacheResults) {
            this.pathCache.set(cacheKey, results);
        }

        return results;
    }

    /**
     * Recursively search for words starting from a specific position
     * @param {Array} grid - Game grid
     * @param {number} position - Current position
     * @param {string} currentWord - Word built so far
     * @param {Set} visitedPositions - Set of visited positions
     * @param {Array} currentPath - Path taken so far
     * @param {Object} results - Results object to populate
     */
    searchFromPosition(grid, position, currentWord, visitedPositions, currentPath, results) {
        this.searchStats.pathsExplored++;
        
        const newWord = currentWord + grid[position];
        const newPath = [...currentPath, position];
        const newVisited = new Set([...visitedPositions, position]);

        // Check if current word is valid and meets length requirements
        if (newWord.length >= this.options.minWordLength && 
            newWord.length <= this.options.maxWordLength &&
            this.wordSet.has(newWord.toUpperCase())) {
            
            const upperWord = newWord.toUpperCase();
            results.allWords.add(upperWord);
            
            // Store path information
            if (!results.wordPaths.has(upperWord)) {
                results.wordPaths.set(upperWord, []);
            }
            results.wordPaths.get(upperWord).push([...newPath]);
            
            // Store by length
            if (!results.wordsByLength.has(newWord.length)) {
                results.wordsByLength.set(newWord.length, new Set());
            }
            results.wordsByLength.get(newWord.length).add(upperWord);
        }

        // Continue searching if word isn't too long
        if (newWord.length < this.options.maxWordLength) {
            const neighbors = this.getValidNeighbors(position, newVisited, grid);
            
            for (const neighbor of neighbors) {
                this.searchFromPosition(grid, neighbor, newWord, newVisited, newPath, results);
            }
        }
    }

    /**
     * Get valid neighboring positions that haven't been visited
     * @param {number} position - Current position
     * @param {Set} visitedPositions - Already visited positions
     * @param {Array} grid - Game grid
     * @returns {Array} Array of valid neighbor positions
     */
    getValidNeighbors(position, visitedPositions, grid) {
        const neighbors = ADJACENCY[position] || [];
        return neighbors.filter(neighbor => 
            !visitedPositions.has(neighbor) && 
            grid[neighbor] && 
            grid[neighbor] !== ''
        );
    }

    /**
     * Find all possible paths for a specific word in the grid
     * @param {string} word - Word to find paths for
     * @param {Array} grid - Game grid
     * @returns {Array} Array of all valid paths for the word
     */
    findAllPathsForWord(word, grid) {
        const upperWord = word.toUpperCase();
        const allPaths = [];
        
        if (upperWord.length > this.options.maxWordLength) {
            return allPaths;
        }

        // Try starting from each position that has the first letter
        for (let startPos = 0; startPos < grid.length; startPos++) {
            if (grid[startPos] && grid[startPos].toUpperCase() === upperWord[0]) {
                const pathsFromHere = this.findPathsRecursive(
                    grid, startPos, upperWord, 0, new Set(), [startPos]
                );
                allPaths.push(...pathsFromHere);
            }
        }

        return allPaths;
    }

    /**
     * Recursively find paths for a specific word
     * @param {Array} grid - Game grid
     * @param {number} position - Current position
     * @param {string} targetWord - Word we're trying to spell
     * @param {number} letterIndex - Current letter index in target word
     * @param {Set} visited - Visited positions
     * @param {Array} currentPath - Current path
     * @returns {Array} Array of complete paths
     */
    findPathsRecursive(grid, position, targetWord, letterIndex, visited, currentPath) {
        // If we've found the complete word, return this path
        if (letterIndex === targetWord.length) {
            return [currentPath];
        }

        const allPaths = [];
        const nextLetter = targetWord[letterIndex];
        const neighbors = ADJACENCY[position] || [];

        for (const neighbor of neighbors) {
            if (!visited.has(neighbor) && 
                grid[neighbor] && 
                grid[neighbor].toUpperCase() === nextLetter) {
                
                const newVisited = new Set([...visited, neighbor]);
                const newPath = [...currentPath, neighbor];
                
                const pathsFromNeighbor = this.findPathsRecursive(
                    grid, neighbor, targetWord, letterIndex + 1, newVisited, newPath
                );
                
                allPaths.push(...pathsFromNeighbor);
            }
        }

        return allPaths;
    }

    /**
     * Validate that a specific path spells a word correctly
     * @param {Array} grid - Game grid
     * @param {Array} path - Array of positions
     * @param {string} expectedWord - Word the path should spell
     * @returns {boolean} True if path is valid for the word
     */
    validateWordPath(grid, path, expectedWord) {
        if (!path || path.length === 0) return false;
        if (path.length !== expectedWord.length) return false;

        // Check that each position in path has the correct letter
        for (let i = 0; i < path.length; i++) {
            const position = path[i];
            const expectedLetter = expectedWord[i].toUpperCase();
            
            if (!grid[position] || grid[position].toUpperCase() !== expectedLetter) {
                return false;
            }
        }

        // Check that consecutive positions are adjacent
        for (let i = 0; i < path.length - 1; i++) {
            const currentPos = path[i];
            const nextPos = path[i + 1];
            const neighbors = ADJACENCY[currentPos] || [];
            
            if (!neighbors.includes(nextPos)) {
                return false;
            }
        }

        // Check that no position is repeated
        const uniquePositions = new Set(path);
        if (uniquePositions.size !== path.length) {
            return false;
        }

        return true;
    }

    /**
     * Find the shortest path for a word (fewest grid positions)
     * @param {string} word - Word to find shortest path for
     * @param {Array} grid - Game grid
     * @returns {Array|null} Shortest path or null if not found
     */
    findShortestPath(word, grid) {
        const allPaths = this.findAllPathsForWord(word, grid);
        
        if (allPaths.length === 0) return null;
        
        return allPaths.reduce((shortest, current) => 
            current.length < shortest.length ? current : shortest
        );
    }

    /**
     * Find the longest path for a word (most grid positions used)
     * @param {string} word - Word to find longest path for
     * @param {Array} grid - Game grid
     * @returns {Array|null} Longest path or null if not found
     */
    findLongestPath(word, grid) {
        const allPaths = this.findAllPathsForWord(word, grid);
        
        if (allPaths.length === 0) return null;
        
        return allPaths.reduce((longest, current) => 
            current.length > longest.length ? current : longest
        );
    }

    /**
     * Calculate comprehensive statistics about discovered words
     * @param {Object} results - Word discovery results object
     */
    calculateWordStatistics(results) {
        const words = [...results.allWords];
        results.statistics.totalWords = words.length;
        
        if (words.length === 0) {
            results.statistics.averageLength = 0;
            return;
        }

        // Calculate average length
        const totalLength = words.reduce((sum, word) => sum + word.length, 0);
        results.statistics.averageLength = totalLength / words.length;

        // Calculate length distribution
        const lengthDist = {};
        words.forEach(word => {
            const len = word.length;
            lengthDist[len] = (lengthDist[len] || 0) + 1;
        });
        results.statistics.lengthDistribution = lengthDist;

        // Calculate additional metrics
        results.statistics.shortestWord = Math.min(...words.map(w => w.length));
        results.statistics.longestWord = Math.max(...words.map(w => w.length));
        results.statistics.uniqueLetters = new Set(words.join('').split('')).size;
    }

    /**
     * Identify cornerstone words from discovered words
     * @param {Set} discoveredWords - All discovered words
     * @param {Set} commonWords - Set of common English words
     * @returns {Set} Set of cornerstone words
     */
    identifyCornerStoneWords(discoveredWords, commonWords) {
        const cornerStoneWords = new Set();
        
        for (const word of discoveredWords) {
            if (commonWords.has(word)) {
                cornerStoneWords.add(word);
            }
        }
        
        return cornerStoneWords;
    }

    /**
     * Generate a cache key for a grid configuration
     * @param {Array} grid - Game grid
     * @returns {string} Cache key
     */
    generateGridCacheKey(grid) {
        return grid.map(cell => cell || '').join('|');
    }

    /**
     * Analyze word coverage in the grid (how many letters each word uses)
     * @param {Object} wordDiscoveryResults - Results from findAllWordsComprehensive
     * @returns {Object} Coverage analysis
     */
    analyzeWordCoverage(wordDiscoveryResults) {
        const coverage = {
            positionUsage: new Array(16).fill(0), // How often each position is used
            letterUsage: {}, // How often each letter is used
            pathComplexity: [], // Length of path for each word
            wordEfficiency: [] // Word length vs path length ratio
        };

        for (const [word, paths] of wordDiscoveryResults.wordPaths.entries()) {
            // Use the first (shortest) path for analysis
            const path = paths[0];
            if (!path) continue;

            // Count position usage
            for (const position of path) {
                coverage.positionUsage[position]++;
            }

            // Count letter usage
            for (const letter of word) {
                coverage.letterUsage[letter] = (coverage.letterUsage[letter] || 0) + 1;
            }

            // Calculate complexity and efficiency
            coverage.pathComplexity.push(path.length);
            coverage.wordEfficiency.push(word.length / path.length);
        }

        // Calculate averages
        coverage.averagePathLength = coverage.pathComplexity.reduce((a, b) => a + b, 0) / coverage.pathComplexity.length || 0;
        coverage.averageEfficiency = coverage.wordEfficiency.reduce((a, b) => a + b, 0) / coverage.wordEfficiency.length || 0;

        return coverage;
    }

    /**
     * Find words that share common letter sequences or paths
     * @param {Object} wordDiscoveryResults - Results from word discovery
     * @returns {Object} Analysis of word relationships
     */
    analyzeWordRelationships(wordDiscoveryResults) {
        const relationships = {
            sharedPrefixes: {},
            sharedSuffixes: {},
            overlappingPaths: {},
            letterSequences: {}
        };

        const words = [...wordDiscoveryResults.allWords];

        // Find shared prefixes and suffixes
        for (let i = 0; i < words.length; i++) {
            for (let j = i + 1; j < words.length; j++) {
                const word1 = words[i];
                const word2 = words[j];

                // Check prefixes
                const commonPrefix = this.findCommonPrefix(word1, word2);
                if (commonPrefix.length >= 3) {
                    if (!relationships.sharedPrefixes[commonPrefix]) {
                        relationships.sharedPrefixes[commonPrefix] = [];
                    }
                    relationships.sharedPrefixes[commonPrefix].push([word1, word2]);
                }

                // Check suffixes  
                const commonSuffix = this.findCommonSuffix(word1, word2);
                if (commonSuffix.length >= 3) {
                    if (!relationships.sharedSuffixes[commonSuffix]) {
                        relationships.sharedSuffixes[commonSuffix] = [];
                    }
                    relationships.sharedSuffixes[commonSuffix].push([word1, word2]);
                }
            }
        }

        return relationships;
    }

    /**
     * Find common prefix between two words
     * @param {string} word1 - First word
     * @param {string} word2 - Second word
     * @returns {string} Common prefix
     */
    findCommonPrefix(word1, word2) {
        let commonPrefix = '';
        const minLength = Math.min(word1.length, word2.length);
        
        for (let i = 0; i < minLength; i++) {
            if (word1[i] === word2[i]) {
                commonPrefix += word1[i];
            } else {
                break;
            }
        }
        
        return commonPrefix;
    }

    /**
     * Find common suffix between two words
     * @param {string} word1 - First word
     * @param {string} word2 - Second word
     * @returns {string} Common suffix
     */
    findCommonSuffix(word1, word2) {
        let commonSuffix = '';
        const minLength = Math.min(word1.length, word2.length);
        
        for (let i = 1; i <= minLength; i++) {
            if (word1[word1.length - i] === word2[word2.length - i]) {
                commonSuffix = word1[word1.length - i] + commonSuffix;
            } else {
                break;
            }
        }
        
        return commonSuffix;
    }

    /**
     * Get comprehensive statistics about the word discovery system
     * @returns {Object} System statistics
     */
    getSystemStats() {
        return {
            ...this.searchStats,
            cacheSize: this.pathCache.size,
            cacheHitRate: this.searchStats.totalSearches > 0 ? 
                (this.searchStats.cacheHits / this.searchStats.totalSearches * 100).toFixed(2) + '%' : '0%'
        };
    }

    /**
     * Clear all caches and reset statistics
     */
    clearCache() {
        this.pathCache.clear();
        this.wordPathMap.clear();
        this.searchStats = {
            totalSearches: 0,
            cacheHits: 0,
            pathsExplored: 0,
            wordsFound: 0
        };
        console.log('Word discovery cache cleared and stats reset');
    }

    /**
     * Export word discovery results for external analysis
     * @param {Object} results - Word discovery results
     * @returns {Object} Exportable data structure
     */
    exportResults(results) {
        return {
            words: [...results.allWords],
            wordPaths: Object.fromEntries(
                [...results.wordPaths.entries()].map(([word, paths]) => [word, paths])
            ),
            wordsByLength: Object.fromEntries(
                [...results.wordsByLength.entries()].map(([length, words]) => [length, [...words]])
            ),
            statistics: results.statistics,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Update the word set and invalidate caches
     * @param {Set} newWordSet - New set of valid words
     */
    updateWordSet(newWordSet) {
        this.wordSet = newWordSet;
        this.wordSetVersion++;
        
        // Clear caches since word set changed
        this.clearCaches();
        
        console.log(`📝 Updated word set: ${newWordSet.size} words (version ${this.wordSetVersion})`);
    }

    /**
     * Remove specific words from the word set
     * @param {Array} wordsToRemove - Words to remove
     */
    removeWords(wordsToRemove) {
        if (!this.wordSet) return;
        
        const removeSet = new Set(wordsToRemove.map(w => w.toUpperCase()));
        const originalSize = this.wordSet.size;
        
        // Remove words from word set
        for (const word of removeSet) {
            this.wordSet.delete(word);
        }
        
        this.wordSetVersion++;
        this.clearCaches();
        
        console.log(`🗑️  Removed ${removeSet.size} words from discovery set (${originalSize} → ${this.wordSet.size})`);
    }

    /**
     * Clear all caches
     */
    clearCaches() {
        this.pathCache.clear();
        this.wordPathMap.clear();
        console.log(`🧹 Cleared word discovery caches (version ${this.wordSetVersion})`);
    }

    /**
     * Get word set statistics
     * @returns {Object} Word set statistics
     */
    getWordSetStats() {
        return {
            wordCount: this.wordSet ? this.wordSet.size : 0,
            version: this.wordSetVersion,
            cacheSize: this.pathCache.size,
            wordPathMappings: this.wordPathMap.size,
            searchStats: { ...this.searchStats }
        };
    }
}