// Definition Validator - Uses LLM to validate definition quality and detect issues
export class DefinitionValidator {
    constructor(options = {}) {
        this.apiEndpoint = options.apiEndpoint || 'https://api.openai.com/v1/chat/completions';
        this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
        this.model = options.model || 'gpt-3.5-turbo';
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 1000;
        this.cache = new Map();
        this.batchSize = options.batchSize || 10;
        
        this.validationPrompt = `You are a dictionary quality checker. Evaluate word definitions for quality issues.

REJECT definitions that:
1. Contain the root word or obvious variations (e.g., "reader: someone who reads")
2. Are circular (define a word using itself)
3. Are too vague or generic
4. Are overly technical for a general audience
5. Are incomplete or fragmented
6. Contain inappropriate content

ACCEPT definitions that:
1. Are clear and descriptive
2. Don't use the word being defined
3. Are appropriate for all audiences
4. Provide meaningful understanding
5. Are grammatically correct

Respond with JSON: {"valid": true/false, "reason": "explanation", "score": 0-100, "issues": ["issue1", "issue2"]}`;
    }

    /**
     * Validate a single word definition using LLM
     * @param {string} word - The word being defined
     * @param {string} definition - The definition to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateDefinition(word, definition) {
        const cacheKey = `${word.toUpperCase()}:${definition}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const result = await this.callLLM(word, definition);
            this.cache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.error(`Error validating definition for ${word}:`, error);
            return {
                valid: false,
                reason: `Validation error: ${error.message}`,
                score: 0,
                issues: ['validation_error'],
                error: error.message
            };
        }
    }

    /**
     * Make LLM API call to validate definition
     * @param {string} word - Word being defined
     * @param {string} definition - Definition to validate
     * @returns {Promise<Object>} LLM validation response
     */
    async callLLM(word, definition) {
        const messages = [
            {
                role: 'system',
                content: this.validationPrompt
            },
            {
                role: 'user',
                content: `Word: "${word.toUpperCase()}"\nDefinition: "${definition}"\n\nEvaluate this definition for quality issues.`
            }
        ];

        const requestBody = {
            model: this.model,
            messages: messages,
            max_tokens: 200,
            temperature: 0.1, // Low temperature for consistent evaluation
            response_format: { type: "json_object" }
        };

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                    throw new Error('Invalid response format from LLM API');
                }

                const content = data.choices[0].message.content;
                const validationResult = JSON.parse(content);

                return this.processValidationResult(word, definition, validationResult);

            } catch (error) {
                console.warn(`LLM validation attempt ${attempt + 1} failed:`, error.message);
                
                if (attempt < this.maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
                } else {
                    throw error;
                }
            }
        }
    }

    /**
     * Process and standardize LLM validation result
     * @param {string} word - Original word
     * @param {string} definition - Original definition
     * @param {Object} llmResult - Raw LLM response
     * @returns {Object} Processed validation result
     */
    processValidationResult(word, definition, llmResult) {
        // Ensure required fields exist
        const result = {
            valid: Boolean(llmResult.valid),
            reason: llmResult.reason || 'No reason provided',
            score: Math.max(0, Math.min(100, parseInt(llmResult.score) || 0)),
            issues: Array.isArray(llmResult.issues) ? llmResult.issues : [],
            word: word.toUpperCase(),
            definition: definition,
            validatedAt: new Date().toISOString(),
            validationMethod: 'llm'
        };

        // Add automatic checks that LLM might miss
        result.issues = [...result.issues, ...this.performAutomaticChecks(word, definition)];
        
        // Adjust validity based on automatic checks
        if (result.issues.length > 0 && result.valid) {
            result.valid = false;
            result.reason += ' (Failed automatic checks)';
        }

        return result;
    }

    /**
     * Perform automatic rule-based checks alongside LLM validation
     * @param {string} word - Word being defined
     * @param {string} definition - Definition to check
     * @returns {Array} Array of issues found
     */
    performAutomaticChecks(word, definition) {
        const issues = [];
        const normalizedWord = word.toLowerCase();
        const normalizedDef = definition.toLowerCase();

        // Check for root word in definition
        if (normalizedDef.includes(normalizedWord)) {
            issues.push('contains_root_word');
        }

        // Check for common circular definition patterns
        const circularPatterns = [
            new RegExp(`someone who ${this.getWordRoot(normalizedWord)}`, 'i'),
            new RegExp(`something that ${this.getWordRoot(normalizedWord)}`, 'i'),
            new RegExp(`the act of ${normalizedWord.replace(/e$/, '')}ing`, 'i')
        ];

        for (const pattern of circularPatterns) {
            if (pattern.test(normalizedDef)) {
                issues.push('circular_definition');
                break;
            }
        }

        // Check definition length
        if (definition.length < 15) {
            issues.push('too_short');
        } else if (definition.length > 300) {
            issues.push('too_long');
        }

        // Check for inappropriate content markers
        const inappropriateMarkers = ['nsfw', 'vulgar', 'offensive', 'slang', 'colloquial'];
        for (const marker of inappropriateMarkers) {
            if (normalizedDef.includes(marker)) {
                issues.push('inappropriate_content');
                break;
            }
        }

        return issues;
    }

    /**
     * Get word root by removing common suffixes
     * @param {string} word - Word to get root for
     * @returns {string} Word root
     */
    getWordRoot(word) {
        const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'tion', 'sion', 'ness', 'ment', 's'];
        
        for (const suffix of suffixes) {
            if (word.endsWith(suffix) && word.length > suffix.length + 2) {
                return word.slice(0, -suffix.length);
            }
        }
        
        return word;
    }

    /**
     * Validate multiple definitions in batches
     * @param {Array} wordDefinitionPairs - Array of {word, definition} objects
     * @param {Function} progressCallback - Optional progress callback
     * @returns {Promise<Array>} Array of validation results
     */
    async validateMultipleDefinitions(wordDefinitionPairs, progressCallback = null) {
        console.log(`Validating ${wordDefinitionPairs.length} definitions using LLM...`);
        
        const results = [];
        const total = wordDefinitionPairs.length;
        let completed = 0;

        // Process in batches to avoid overwhelming the API
        for (let i = 0; i < wordDefinitionPairs.length; i += this.batchSize) {
            const batch = wordDefinitionPairs.slice(i, i + this.batchSize);
            const batchPromises = batch.map(async ({ word, definition }) => {
                try {
                    const result = await this.validateDefinition(word, definition);
                    completed++;
                    
                    if (progressCallback) {
                        progressCallback({
                            current: completed,
                            total: total,
                            word: word,
                            valid: result.valid,
                            percentage: Math.round((completed / total) * 100)
                        });
                    }
                    
                    return result;
                } catch (error) {
                    console.error(`Error validating ${word}:`, error);
                    completed++;
                    return {
                        valid: false,
                        reason: `Validation failed: ${error.message}`,
                        score: 0,
                        issues: ['validation_error'],
                        word: word.toUpperCase(),
                        definition: definition,
                        error: error.message
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Small delay between batches to be respectful to API
            if (i + this.batchSize < wordDefinitionPairs.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        const validCount = results.filter(r => r.valid).length;
        console.log(`Validation complete: ${validCount}/${total} definitions passed validation`);
        
        return results;
    }

    /**
     * Filter definitions by removing those that fail validation
     * @param {Object} definitions - Object mapping words to definition data
     * @returns {Promise<Object>} Filtered definitions object
     */
    async filterValidDefinitions(definitions) {
        console.log('Filtering definitions using LLM validation...');
        
        const wordDefinitionPairs = [];
        for (const [word, defData] of Object.entries(definitions)) {
            if (defData && defData.definition) {
                wordDefinitionPairs.push({
                    word: word,
                    definition: defData.definition
                });
            }
        }

        const validationResults = await this.validateMultipleDefinitions(wordDefinitionPairs);
        const filteredDefinitions = {};

        for (const result of validationResults) {
            const word = result.word;
            const originalDefData = definitions[word];
            
            if (result.valid && originalDefData) {
                filteredDefinitions[word] = {
                    ...originalDefData,
                    validationResult: result,
                    validatedAt: new Date().toISOString()
                };
            } else {
                console.log(`❌ Rejected definition for ${word}: ${result.reason}`);
            }
        }

        const originalCount = Object.keys(definitions).length;
        const filteredCount = Object.keys(filteredDefinitions).length;
        console.log(`Filtered definitions: ${filteredCount}/${originalCount} passed LLM validation`);

        return filteredDefinitions;
    }

    /**
     * Improve a definition by asking LLM to rewrite it
     * @param {string} word - Word to improve definition for
     * @param {string} definition - Original definition
     * @returns {Promise<Object>} Improved definition result
     */
    async improveDefinition(word, definition) {
        const improvementPrompt = `You are a dictionary editor. Improve this word definition by making it clearer, more concise, and ensuring it doesn't contain the word being defined.

Original word: "${word.toUpperCase()}"
Original definition: "${definition}"

Provide an improved definition that:
1. Does not contain the word being defined or its obvious variations
2. Is clear and understandable for a general audience
3. Is concise but complete
4. Is grammatically correct
5. Provides meaningful understanding of the word

Respond with JSON: {"improved_definition": "the improved definition text", "changes_made": ["change1", "change2"], "confidence": 0-100}`;

        try {
            const messages = [
                {
                    role: 'system',
                    content: improvementPrompt
                },
                {
                    role: 'user',
                    content: `Please improve this definition.`
                }
            ];

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    max_tokens: 300,
                    temperature: 0.3,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const content = JSON.parse(data.choices[0].message.content);

            return {
                success: true,
                originalDefinition: definition,
                improvedDefinition: content.improved_definition,
                changesMade: content.changes_made || [],
                confidence: content.confidence || 0,
                word: word.toUpperCase(),
                improvedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Error improving definition for ${word}:`, error);
            return {
                success: false,
                error: error.message,
                originalDefinition: definition,
                word: word.toUpperCase()
            };
        }
    }

    /**
     * Get statistics about validation results
     * @param {Array} validationResults - Array of validation results
     * @returns {Object} Statistics object
     */
    getValidationStats(validationResults) {
        const total = validationResults.length;
        const valid = validationResults.filter(r => r.valid).length;
        const invalid = total - valid;

        const issueCount = {};
        const scoreDistribution = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };

        for (const result of validationResults) {
            // Count issues
            for (const issue of result.issues) {
                issueCount[issue] = (issueCount[issue] || 0) + 1;
            }

            // Score distribution
            const score = result.score;
            if (score <= 20) scoreDistribution['0-20']++;
            else if (score <= 40) scoreDistribution['21-40']++;
            else if (score <= 60) scoreDistribution['41-60']++;
            else if (score <= 80) scoreDistribution['61-80']++;
            else scoreDistribution['81-100']++;
        }

        return {
            total: total,
            valid: valid,
            invalid: invalid,
            validationRate: Math.round((valid / total) * 100),
            averageScore: Math.round(validationResults.reduce((sum, r) => sum + r.score, 0) / total),
            issueCount: issueCount,
            scoreDistribution: scoreDistribution,
            mostCommonIssues: Object.entries(issueCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
        };
    }

    /**
     * Clear the validation cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Definition validation cache cleared');
    }

    /**
     * Export validation cache for persistence
     * @returns {Object} Serializable cache data
     */
    exportValidationCache() {
        const cacheData = {};
        for (const [key, value] of this.cache.entries()) {
            cacheData[key] = value;
        }
        return {
            data: cacheData,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }

    /**
     * Import validation cache from previous session
     * @param {Object} cacheData - Previously exported cache data
     */
    importValidationCache(cacheData) {
        if (!cacheData || !cacheData.data) {
            console.warn('Invalid validation cache data provided');
            return;
        }
        
        let importedCount = 0;
        for (const [key, value] of Object.entries(cacheData.data)) {
            this.cache.set(key, value);
            importedCount++;
        }
        
        console.log(`Imported ${importedCount} validation results from cache`);
    }
}