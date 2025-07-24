// Puzzle Validator - Comprehensive validation tools for puzzle quality and solvability
import { CROSS_POSITIONS, ADJACENCY, HAMILTONIAN_PATHS } from './constants.js';  
import { WordDiscoverySystem } from './wordDiscovery.js';

export class PuzzleValidator {
    constructor(options = {}) {
        this.options = {
            minCornerstoneWords: options.minCornerstoneWords || 20,
            maxCornerstoneWords: options.maxCornerstoneWords || 100,
            minTotalWords: options.minTotalWords || 50,
            maxTotalWords: options.maxTotalWords || 300,
            minWordLength: options.minWordLength || 4,
            maxWordLength: options.maxWordLength || 12,
            requireKeystoneWord: options.requireKeystoneWord !== false,
            validateDefinitions: options.validateDefinitions !== false,
            difficultyRange: options.difficultyRange || ['Easy', 'Medium', 'Hard', 'Expert'],
            ...options
        };
        
        this.wordDiscovery = new WordDiscoverySystem();
        this.validationCache = new Map();
        this.validationStats = {
            totalValidations: 0,
            passed: 0,
            failed: 0,
            cacheHits: 0
        };
    }

    /**
     * Perform comprehensive validation of a puzzle
     * @param {Object} puzzle - Puzzle object to validate
     * @param {Set} commonWords - Set of common words for cornerstone identification
     * @param {Object} definitions - Word definitions object
     * @returns {Promise<Object>} Detailed validation result
     */
    async validatePuzzle(puzzle, commonWords = new Set(), definitions = {}) {
        this.validationStats.totalValidations++;
        
        const cacheKey = this.generateValidationCacheKey(puzzle);
        if (this.validationCache.has(cacheKey)) {
            this.validationStats.cacheHits++;
            return this.validationCache.get(cacheKey);
        }

        console.log(`Validating puzzle: ${puzzle.keystoneWord || 'Unknown'}`);
        const startTime = performance.now();

        const result = {
            isValid: false,
            errors: [],
            warnings: [],
            metrics: {},
            recommendations: [],
            validationTime: 0,
            validatedAt: new Date().toISOString()
        };

        try {
            // Phase 1: Basic structure validation
            this.validateBasicStructure(puzzle, result);
            
            // Phase 2: Grid and path validation
            this.validateGridStructure(puzzle, result);
            
            // Phase 3: Word discovery validation
            await this.validateWordDiscovery(puzzle, commonWords, result);
            
            // Phase 4: Definition validation
            if (this.options.validateDefinitions) {
                this.validateDefinitions(puzzle, definitions, result);
            }
            
            // Phase 5: Difficulty and balance validation
            this.validateDifficultyBalance(puzzle, result);
            
            // Phase 6: Solvability validation
            this.validateSolvability(puzzle, result);
            
            // Calculate overall validity
            result.isValid = result.errors.length === 0;
            
            // Generate recommendations
            this.generateRecommendations(puzzle, result);
            
            // Calculate final metrics
            this.calculateValidationMetrics(puzzle, result);

        } catch (error) {
            result.errors.push(`Validation error: ${error.message}`);
            result.isValid = false;
        }

        result.validationTime = performance.now() - startTime;
        
        if (result.isValid) {
            this.validationStats.passed++;
            console.log(`✅ Puzzle validation passed (${result.validationTime.toFixed(2)}ms)`);
        } else {
            this.validationStats.failed++;
            console.log(`❌ Puzzle validation failed with ${result.errors.length} errors (${result.validationTime.toFixed(2)}ms)`);
        }

        this.validationCache.set(cacheKey, result);
        return result;
    }

    /**
     * Validate basic puzzle structure and required properties
     * @param {Object} puzzle - Puzzle to validate
     * @param {Object} result - Validation result object
     */
    validateBasicStructure(puzzle, result) {
        // Check required properties
        const requiredProps = ['keystoneWord', 'grid', 'allWords', 'cornerstoneWords'];
        for (const prop of requiredProps) {
            if (!puzzle[prop]) {
                result.errors.push(`Missing required property: ${prop}`);
            }
        }

        // Validate keystone word
        if (puzzle.keystoneWord) {
            if (typeof puzzle.keystoneWord !== 'string') {
                result.errors.push('Keystone word must be a string');
            } else if (puzzle.keystoneWord.length !== 12) {
                result.errors.push(`Keystone word must be 12 letters, got ${puzzle.keystoneWord.length}`);
            } else if (!/^[A-Z]+$/.test(puzzle.keystoneWord)) {
                result.errors.push('Keystone word must contain only uppercase letters');
            }
        }

        // Validate word arrays
        if (puzzle.allWords && !Array.isArray(puzzle.allWords)) {
            result.errors.push('allWords must be an array');
        }
        
        if (puzzle.cornerstoneWords && !Array.isArray(puzzle.cornerstoneWords)) {
            result.errors.push('cornerstoneWords must be an array');
        }

        // Check word count requirements
        if (puzzle.cornerstoneWords) {
            const cornerstoneCount = puzzle.cornerstoneWords.length;
            if (cornerstoneCount < this.options.minCornerstoneWords) {
                result.errors.push(`Insufficient cornerstone words: ${cornerstoneCount} < ${this.options.minCornerstoneWords}`);
            } else if (cornerstoneCount > this.options.maxCornerstoneWords) {
                result.warnings.push(`High cornerstone word count: ${cornerstoneCount} > ${this.options.maxCornerstoneWords}`);
            }
        }

        if (puzzle.allWords) {
            const totalWords = puzzle.allWords.length;
            if (totalWords < this.options.minTotalWords) {
                result.errors.push(`Insufficient total words: ${totalWords} < ${this.options.minTotalWords}`);
            } else if (totalWords > this.options.maxTotalWords) {
                result.warnings.push(`High total word count: ${totalWords} > ${this.options.maxTotalWords}`);
            }
        }
    }

    /**
     * Validate grid structure and Hamiltonian path
     * @param {Object} puzzle - Puzzle to validate
     * @param {Object} result - Validation result object
     */
    validateGridStructure(puzzle, result) {
        if (!puzzle.grid) return;

        // Validate grid array
        if (!Array.isArray(puzzle.grid) || puzzle.grid.length !== 16) {
            result.errors.push('Grid must be an array of length 16');
            return;
        }

        // Check cross positions are filled
        let filledPositions = 0;
        let emptyPositions = 0;
        
        for (let i = 0; i < 16; i++) {
            if (CROSS_POSITIONS.includes(i)) {
                if (puzzle.grid[i] && puzzle.grid[i].trim() !== '') {
                    filledPositions++;
                } else {
                    result.errors.push(`Cross position ${i} is empty`);
                }
            } else {
                if (puzzle.grid[i] && puzzle.grid[i].trim() !== '') {
                    result.errors.push(`Non-cross position ${i} should be empty but contains '${puzzle.grid[i]}'`);
                } else {
                    emptyPositions++;
                }
            }
        }

        if (filledPositions !== 12) {
            result.errors.push(`Expected 12 filled cross positions, found ${filledPositions}`);
        }

        // Validate Hamiltonian path if pathIndex is provided
        if (puzzle.pathIndex !== undefined) {
            this.validateHamiltonianPath(puzzle, result);
        }

        // Check grid connectivity
        this.validateGridConnectivity(puzzle.grid, result);
    }

    /**
     * Validate the Hamiltonian path for the puzzle
     * @param {Object} puzzle - Puzzle to validate
     * @param {Object} result - Validation result object
     */
    validateHamiltonianPath(puzzle, result) {
        const pathIndex = puzzle.pathIndex;
        
        if (pathIndex < 0 || pathIndex >= HAMILTONIAN_PATHS.length) {
            result.errors.push(`Invalid path index: ${pathIndex} (must be 0-${HAMILTONIAN_PATHS.length - 1})`);
            return;
        }

        const path = HAMILTONIAN_PATHS[pathIndex];
        const expectedWord = puzzle.keystoneWord;
        
        if (!expectedWord) return;

        // Verify that the path spells the keystone word
        let actualWord = '';
        for (const position of path) {
            if (puzzle.grid[position]) {
                actualWord += puzzle.grid[position];
            } else {
                result.errors.push(`Path position ${position} is empty`);
            }
        }

        if (actualWord !== expectedWord) {
            result.errors.push(`Path does not spell keystone word: expected '${expectedWord}', got '${actualWord}'`);
        }

        // Validate path adjacency
        for (let i = 0; i < path.length - 1; i++) {
            const currentPos = path[i];
            const nextPos = path[i + 1];
            const neighbors = ADJACENCY[currentPos] || [];
            
            if (!neighbors.includes(nextPos)) {
                result.errors.push(`Path positions ${currentPos} and ${nextPos} are not adjacent`);
            }
        }
    }

    /**
     * Validate grid connectivity (all positions reachable)
     * @param {Array} grid - Grid array
     * @param {Object} result - Validation result object
     */
    validateGridConnectivity(grid, result) {
        const visited = new Set();
        const stack = [];
        
        // Find first filled position to start traversal
        let startPos = -1;
        for (let i = 0; i < grid.length; i++) {
            if (grid[i] && grid[i].trim() !== '') {
                startPos = i;
                break;
            }
        }

        if (startPos === -1) {
            result.errors.push('No filled positions found in grid');
            return;
        }

        // DFS to find all reachable positions
        stack.push(startPos);
        while (stack.length > 0) {
            const current = stack.pop();
            if (visited.has(current)) continue;
            
            visited.add(current);
            const neighbors = ADJACENCY[current] || [];
            
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor) && grid[neighbor] && grid[neighbor].trim() !== '') {
                    stack.push(neighbor);
                }
            }
        }

        // Check if all filled positions are reachable
        const filledPositions = grid
            .map((cell, index) => ({ cell, index }))
            .filter(({ cell }) => cell && cell.trim() !== '')
            .map(({ index }) => index);

        const unreachable = filledPositions.filter(pos => !visited.has(pos));
        if (unreachable.length > 0) {
            result.errors.push(`Unreachable grid positions: ${unreachable.join(', ')}`);
        }
    }

    /**
     * Validate word discovery results
     * @param {Object} puzzle - Puzzle to validate
     * @param {Set} commonWords - Set of common words
     * @param {Object} result - Validation result object
     */
    async validateWordDiscovery(puzzle, commonWords, result) {
        if (!puzzle.grid || !puzzle.allWords) return;

        try {
            this.wordDiscovery.wordSet = new Set(puzzle.allWords.map(w => w.toUpperCase()));
            const discoveryResults = this.wordDiscovery.findAllWordsComprehensive(puzzle.grid, this.wordDiscovery.wordSet);

            // Compare discovered words with puzzle words
            const discoveredWords = [...discoveryResults.allWords];
            const expectedWords = puzzle.allWords.map(w => w.toUpperCase());
            
            const missingWords = expectedWords.filter(word => !discoveredWords.includes(word));
            const extraWords = discoveredWords.filter(word => !expectedWords.includes(word));

            if (missingWords.length > 0) {
                result.errors.push(`Words not findable in grid: ${missingWords.slice(0, 5).join(', ')}${missingWords.length > 5 ? ` and ${missingWords.length - 5} more` : ''}`);
            }

            if (extraWords.length > 0) {
                result.warnings.push(`Additional findable words not in puzzle: ${extraWords.slice(0, 3).join(', ')}${extraWords.length > 3 ? ` and ${extraWords.length - 3} more` : ''}`);
            }

            // Validate cornerstone words
            if (puzzle.cornerstoneWords && commonWords.size > 0) {
                const discoveredCornerstone = this.wordDiscovery.identifyCornerStoneWords(discoveryResults.allWords, commonWords);
                const expectedCornerstone = new Set(puzzle.cornerstoneWords.map(w => w.toUpperCase()));
                
                for (const word of expectedCornerstone) {
                    if (!discoveredCornerstone.has(word)) {
                        result.warnings.push(`Cornerstone word not discoverable: ${word}`);
                    }
                    if (!commonWords.has(word)) {
                        result.warnings.push(`Cornerstone word not in common words list: ${word}`);
                    }
                }
            }

            // Store discovery metrics
            result.metrics.wordDiscovery = {
                discoveredWordCount: discoveredWords.length,
                expectedWordCount: expectedWords.length,
                matchRate: expectedWords.length > 0 ? (expectedWords.length - missingWords.length) / expectedWords.length : 0,
                averageWordLength: discoveryResults.statistics.averageLength,
                searchTime: discoveryResults.statistics.searchTime
            };

        } catch (error) {
            result.errors.push(`Word discovery validation failed: ${error.message}`);
        }
    }

    /**
     * Validate that puzzle has proper definitions
     * @param {Object} puzzle - Puzzle to validate  
     * @param {Object} definitions - Definitions object
     * @param {Object} result - Validation result object
     */
    validateDefinitions(puzzle, definitions, result) {
        if (!puzzle.allWords || !definitions) return;

        const missingDefinitions = [];
        const invalidDefinitions = [];
        
        for (const word of puzzle.allWords) {
            const upperWord = word.toUpperCase();
            const definition = definitions[upperWord];
            
            if (!definition) {
                missingDefinitions.push(word);
            } else if (typeof definition === 'object' && definition.definition) {
                // Validate definition quality if it's an object with validation data
                if (definition.validationResult && !definition.validationResult.valid) {
                    invalidDefinitions.push(word);
                }
            }
        }

        if (missingDefinitions.length > 0) {
            result.errors.push(`Missing definitions for ${missingDefinitions.length} words: ${missingDefinitions.slice(0, 3).join(', ')}${missingDefinitions.length > 3 ? '...' : ''}`);
        }

        if (invalidDefinitions.length > 0) {
            result.warnings.push(`Invalid definitions for ${invalidDefinitions.length} words: ${invalidDefinitions.slice(0, 3).join(', ')}${invalidDefinitions.length > 3 ? '...' : ''}`);
        }

        result.metrics.definitions = {
            totalWords: puzzle.allWords.length,
            withDefinitions: puzzle.allWords.length - missingDefinitions.length,
            validDefinitions: puzzle.allWords.length - missingDefinitions.length - invalidDefinitions.length,
            definitionCoverage: puzzle.allWords.length > 0 ? (puzzle.allWords.length - missingDefinitions.length) / puzzle.allWords.length : 0
        };
    }

    /**
     * Validate puzzle difficulty and balance
     * @param {Object} puzzle - Puzzle to validate
     * @param {Object} result - Validation result object
     */
    validateDifficultyBalance(puzzle, result) {
        if (!puzzle.allWords || !puzzle.cornerstoneWords) return;

        const totalWords = puzzle.allWords.length;
        const cornerstoneWords = puzzle.cornerstoneWords.length;
        const cornerstoneRatio = totalWords > 0 ? cornerstoneWords / totalWords : 0;

        // Calculate average word length
        const avgWordLength = puzzle.allWords.reduce((sum, word) => sum + word.length, 0) / totalWords;

        // Determine difficulty level
        let difficulty = 'Unknown';
        if (cornerstoneRatio > 0.7 && avgWordLength < 6) {
            difficulty = 'Easy';
        } else if (cornerstoneRatio > 0.5 && avgWordLength < 7) {
            difficulty = 'Medium';
        } else if (cornerstoneRatio > 0.3) {
            difficulty = 'Hard';
        } else {
            difficulty = 'Expert';
        }

        // Validate difficulty is in acceptable range
        if (!this.options.difficultyRange.includes(difficulty)) {
            result.warnings.push(`Puzzle difficulty '${difficulty}' not in acceptable range: ${this.options.difficultyRange.join(', ')}`);
        }

        // Check for balance issues
        if (cornerstoneRatio < 0.2) {
            result.warnings.push('Very low cornerstone word ratio may make puzzle too difficult');
        } else if (cornerstoneRatio > 0.8) {
            result.warnings.push('Very high cornerstone word ratio may make puzzle too easy');
        }

        if (avgWordLength < 4.5) {
            result.warnings.push('Low average word length may indicate simple vocabulary');
        } else if (avgWordLength > 8) {
            result.warnings.push('High average word length may indicate complex vocabulary');
        }

        result.metrics.difficulty = {
            level: difficulty,
            cornerstoneRatio: cornerstoneRatio,
            averageWordLength: avgWordLength,
            wordLengthDistribution: this.calculateWordLengthDistribution(puzzle.allWords),
            balanceScore: this.calculateBalanceScore(cornerstoneRatio, avgWordLength)
        };
    }

    /**
     * Calculate word length distribution
     * @param {Array} words - Array of words
     * @returns {Object} Length distribution
     */
    calculateWordLengthDistribution(words) {
        const distribution = {};
        for (const word of words) {
            const length = word.length;
            distribution[length] = (distribution[length] || 0) + 1;
        }
        return distribution;
    }

    /**
     * Calculate balance score based on difficulty factors
     * @param {number} cornerstoneRatio - Ratio of cornerstone to total words
     * @param {number} avgWordLength - Average word length
     * @returns {number} Balance score (0-100)
     */
    calculateBalanceScore(cornerstoneRatio, avgWordLength) {
        // Ideal targets
        const idealRatio = 0.6;
        const idealLength = 6.5;
        
        // Calculate deviations
        const ratioDeviation = Math.abs(cornerstoneRatio - idealRatio) / idealRatio;
        const lengthDeviation = Math.abs(avgWordLength - idealLength) / idealLength;
        
        // Combined score (lower deviation = higher score)
        const combinedDeviation = (ratioDeviation + lengthDeviation) / 2;
        const score = Math.max(0, 100 - (combinedDeviation * 100));
        
        return Math.round(score);
    }

    /**
     * Validate puzzle solvability and user experience
     * @param {Object} puzzle - Puzzle to validate
     * @param {Object} result - Validation result object
     */
    validateSolvability(puzzle, result) {
        if (!puzzle.grid || !puzzle.cornerstoneWords) return;

        // Check for minimum word diversity
        const uniqueLetters = new Set(puzzle.keystoneWord || '').size;
        if (uniqueLetters < 8) {
            result.warnings.push(`Low letter diversity (${uniqueLetters} unique letters) may limit word variety`);
        }

        // Check for reasonable word distribution across grid
        if (puzzle.allWords) {
            const wordsByLength = {};
            puzzle.allWords.forEach(word => {
                const len = word.length;
                wordsByLength[len] = (wordsByLength[len] || 0) + 1;
            });

            // Check if there are words of various lengths
            const lengthsWithWords = Object.keys(wordsByLength).length;
            if (lengthsWithWords < 4) {
                result.warnings.push('Limited word length variety may reduce solving interest');
            }

            // Check for too many very short or very long words
            const shortWords = wordsByLength[4] || 0;
            const longWords = (wordsByLength[10] || 0) + (wordsByLength[11] || 0) + (wordsByLength[12] || 0);
            const totalWords = puzzle.allWords.length;
            
            if (shortWords / totalWords > 0.6) {
                result.warnings.push('High proportion of 4-letter words may make puzzle too easy');
            }
            
            if (longWords / totalWords > 0.3) {
                result.warnings.push('High proportion of long words may make puzzle too difficult');
            }
        }

        // Validate keystone word is findable
        if (this.options.requireKeystoneWord && puzzle.keystoneWord) {
            if (!puzzle.allWords || !puzzle.allWords.includes(puzzle.keystoneWord)) {
                result.errors.push('Keystone word is not findable in the puzzle grid');
            }
        }

        result.metrics.solvability = {
            letterDiversity: uniqueLetters,
            lengthVariety: Object.keys(this.calculateWordLengthDistribution(puzzle.allWords || [])).length,
            keystoneWordFindable: puzzle.allWords && puzzle.keystoneWord ? puzzle.allWords.includes(puzzle.keystoneWord) : false
        };
    }

    /**
     * Generate recommendations for puzzle improvement
     * @param {Object} puzzle - Puzzle to analyze
     * @param {Object} result - Validation result object
     */
    generateRecommendations(puzzle, result) {
        const recommendations = [];

        // Analyze cornerstone word ratio
        if (result.metrics.difficulty && result.metrics.difficulty.cornerstoneRatio < 0.4) {
            recommendations.push('Consider using a keystone word that generates more common English words');
        }

        // Analyze word length distribution
        if (result.metrics.difficulty && result.metrics.difficulty.averageWordLength < 5) {
            recommendations.push('Try a keystone word with more complex letter combinations for longer words');
        }

        // Check for missing definitions
        if (result.metrics.definitions && result.metrics.definitions.definitionCoverage < 0.9) {
            recommendations.push('Fetch missing word definitions before finalizing puzzle');
        }

        // Analyze balance score
        if (result.metrics.difficulty && result.metrics.difficulty.balanceScore < 70) {
            recommendations.push('Puzzle balance could be improved - consider trying different Hamiltonian paths');
        }

        // Check word discovery issues
        if (result.metrics.wordDiscovery && result.metrics.wordDiscovery.matchRate < 0.95) {
            recommendations.push('Some words may not be discoverable in the grid - verify word paths');
        }

        result.recommendations = recommendations;
    }

    /**
     * Calculate final validation metrics
     * @param {Object} puzzle - Puzzle object
     * @param {Object} result - Validation result object
     */
    calculateValidationMetrics(puzzle, result) {
        const metrics = result.metrics;
        
        // Overall quality score
        let qualityScore = 100;
        qualityScore -= result.errors.length * 20; // Major penalty for errors
        qualityScore -= result.warnings.length * 5; // Minor penalty for warnings
        
        // Bonus for good metrics
        if (metrics.difficulty && metrics.difficulty.balanceScore > 80) {
            qualityScore += 10;
        }
        if (metrics.definitions && metrics.definitions.definitionCoverage > 0.95) {
            qualityScore += 5;
        }
        if (metrics.wordDiscovery && metrics.wordDiscovery.matchRate > 0.98) {
            qualityScore += 5;
        }

        metrics.overall = {
            qualityScore: Math.max(0, Math.min(100, qualityScore)),
            errorCount: result.errors.length,
            warningCount: result.warnings.length,
            recommendationCount: result.recommendations.length,
            validationComplexity: Object.keys(metrics).length
        };
    }

    /**
     * Generate cache key for validation results
     * @param {Object} puzzle - Puzzle object
     * @returns {string} Cache key
     */
    generateValidationCacheKey(puzzle) {
        const keyParts = [
            puzzle.keystoneWord || '',
            puzzle.pathIndex || 0,
            (puzzle.allWords || []).length,
            (puzzle.cornerstoneWords || []).length
        ];
        return keyParts.join('|');
    }

    /**
     * Validate multiple puzzles in batch
     * @param {Array} puzzles - Array of puzzle objects
     * @param {Set} commonWords - Common words set
     * @param {Object} definitions - Definitions object
     * @param {Function} progressCallback - Progress callback
     * @returns {Promise<Array>} Array of validation results
     */
    async validateMultiplePuzzles(puzzles, commonWords = new Set(), definitions = {}, progressCallback = null) {
        console.log(`Starting batch validation of ${puzzles.length} puzzles...`);
        
        const results = [];
        const startTime = performance.now();

        for (let i = 0; i < puzzles.length; i++) {
            const puzzle = puzzles[i];
            
            try {
                const validationResult = await this.validatePuzzle(puzzle, commonWords, definitions);
                results.push({
                    puzzle: puzzle,
                    validation: validationResult,
                    index: i
                });

                if (progressCallback) {
                    progressCallback({
                        current: i + 1,
                        total: puzzles.length,
                        puzzle: puzzle.keystoneWord || `Puzzle ${i + 1}`,
                        isValid: validationResult.isValid,
                        percentage: Math.round(((i + 1) / puzzles.length) * 100)
                    });
                }

            } catch (error) {
                console.error(`Error validating puzzle ${i}:`, error);
                results.push({
                    puzzle: puzzle,
                    validation: {
                        isValid: false,
                        errors: [`Validation failed: ${error.message}`],
                        warnings: [],
                        metrics: {},
                        recommendations: []
                    },
                    index: i
                });
            }
        }

        const totalTime = performance.now() - startTime;
        const validCount = results.filter(r => r.validation.isValid).length;
        
        console.log(`Batch validation complete: ${validCount}/${puzzles.length} puzzles valid (${totalTime.toFixed(2)}ms)`);
        
        return results;
    }

    /**
     * Get validation system statistics
     * @returns {Object} System statistics
     */
    getValidationStats() {
        return {
            ...this.validationStats,
            cacheSize: this.validationCache.size,
            successRate: this.validationStats.totalValidations > 0 ? 
                (this.validationStats.passed / this.validationStats.totalValidations * 100).toFixed(2) + '%' : '0%'
        };
    }

    /**
     * Clear validation cache and reset stats
     */
    clearCache() {
        this.validationCache.clear();
        this.validationStats = {
            totalValidations: 0,
            passed: 0,
            failed: 0,
            cacheHits: 0
        };
        console.log('Puzzle validation cache cleared and stats reset');
    }
}