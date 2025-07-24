// Datamuse API Client - Fetches word definitions with rate limiting and quality control
export class DatamuseClient {
    constructor() {
        this.baseUrl = 'https://api.datamuse.com';
        this.rateLimit = {
            requestsPerSecond: 10, // Conservative rate limit
            requestsPerMinute: 100,
            currentSecond: Math.floor(Date.now() / 1000),
            currentMinute: Math.floor(Date.now() / 60000),
            secondCount: 0,
            minuteCount: 0
        };
        this.cache = new Map();
        this.retryDelays = [1000, 2000, 5000]; // Progressive retry delays
    }

    /**
     * Check if we can make a request within rate limits
     * @returns {boolean} True if request is allowed
     */
    canMakeRequest() {
        const now = Date.now();
        const currentSecond = Math.floor(now / 1000);
        const currentMinute = Math.floor(now / 60000);

        // Reset counters if time periods have changed
        if (currentSecond !== this.rateLimit.currentSecond) {
            this.rateLimit.currentSecond = currentSecond;
            this.rateLimit.secondCount = 0;
        }
        
        if (currentMinute !== this.rateLimit.currentMinute) {
            this.rateLimit.currentMinute = currentMinute;
            this.rateLimit.minuteCount = 0;
        }

        // Check limits
        return this.rateLimit.secondCount < this.rateLimit.requestsPerSecond &&
               this.rateLimit.minuteCount < this.rateLimit.requestsPerMinute;
    }

    /**
     * Wait until we can make a request
     * @returns {Promise} Resolves when rate limit allows request
     */
    async waitForRateLimit() {
        while (!this.canMakeRequest()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.rateLimit.secondCount++;
        this.rateLimit.minuteCount++;
    }

    /**
     * Fetch definition for a single word from Datamuse API
     * @param {string} word - Word to get definition for
     * @returns {Promise<Object>} Definition data or null if not found
     */
    async fetchDefinition(word) {
        const normalizedWord = word.toUpperCase().trim();
        
        // Check cache first
        if (this.cache.has(normalizedWord)) {
            return this.cache.get(normalizedWord);
        }

        try {
            await this.waitForRateLimit();
            
            // Use Datamuse API to get definitions
            const url = `${this.baseUrl}/words?sp=${encodeURIComponent(word.toLowerCase())}&md=d&max=1`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data && data.length > 0 && data[0].defs && data[0].defs.length > 0) {
                const definitionData = this.processDefinitionData(normalizedWord, data[0]);
                this.cache.set(normalizedWord, definitionData);
                return definitionData;
            } else {
                console.log(`No definition found for: ${word}`);
                this.cache.set(normalizedWord, null);
                return null;
            }
            
        } catch (error) {
            console.error(`Error fetching definition for ${word}:`, error);
            return null;
        }
    }

    /**
     * Process raw definition data from Datamuse API
     * @param {string} word - The word being defined
     * @param {Object} rawData - Raw data from API
     * @returns {Object} Processed definition data
     */
    processDefinitionData(word, rawData) {
        const definitions = rawData.defs || [];
        
        // Filter and score definitions
        const processedDefs = definitions
            .map(def => this.parseDefinition(word, def))
            .filter(def => def && this.isValidDefinition(word, def.text))
            .sort((a, b) => b.score - a.score);

        if (processedDefs.length === 0) {
            return null;
        }

        return {
            word: word,
            definition: processedDefs[0].text,
            partOfSpeech: processedDefs[0].partOfSpeech,
            score: processedDefs[0].score,
            alternatives: processedDefs.slice(1, 3), // Keep top alternatives
            source: 'datamuse',
            fetchedAt: new Date().toISOString()
        };
    }

    /**
     * Parse a single definition from Datamuse format
     * @param {string} word - The word being defined
     * @param {string} rawDef - Raw definition string from API
     * @returns {Object} Parsed definition with part of speech and score
     */
    parseDefinition(word, rawDef) {
        try {
            // Datamuse format: "pos\tdefinition"
            const parts = rawDef.split('\t');
            if (parts.length < 2) {
                return null;
            }

            const partOfSpeech = this.normalizePartOfSpeech(parts[0]);
            const definition = parts[1].trim();

            if (!definition) {
                return null;
            }

            const score = this.scoreDefinition(word, definition);

            return {
                text: definition,
                partOfSpeech: partOfSpeech,
                score: score
            };
        } catch (error) {
            console.error(`Error parsing definition: ${rawDef}`, error);
            return null;
        }
    }

    /**
     * Normalize part of speech abbreviations
     * @param {string} pos - Part of speech abbreviation
     * @returns {string} Normalized part of speech
     */
    normalizePartOfSpeech(pos) {
        const mapping = {
            'n': 'noun',
            'v': 'verb', 
            'adj': 'adjective',
            'adv': 'adverb',
            'prep': 'preposition',
            'pron': 'pronoun',
            'conj': 'conjunction',
            'interj': 'interjection',
            'art': 'article'
        };
        
        return mapping[pos.toLowerCase()] || pos;
    }

    /**
     * Score a definition based on quality factors
     * @param {string} word - The word being defined
     * @param {string} definition - Definition text
     * @returns {number} Quality score (higher is better)
     */
    scoreDefinition(word, definition) {
        let score = 100; // Base score

        // Length scoring - prefer moderate length definitions
        const length = definition.length;
        if (length < 20) score -= 20; // Too short
        else if (length > 200) score -= 10; // Too long
        else if (length >= 40 && length <= 120) score += 10; // Good length

        // Penalize definitions that contain the word itself
        if (this.containsRootWord(word, definition)) {
            score -= 50;
        }

        // Penalize circular definitions
        if (this.isCircularDefinition(word, definition)) {
            score -= 40;
        }

        // Reward clear, descriptive definitions
        if (this.isDescriptiveDefinition(definition)) {
            score += 15;
        }

        // Penalize overly technical or obscure definitions
        if (this.isTechnicalDefinition(definition)) {
            score -= 10;
        }

        return Math.max(0, score);
    }

    /**
     * Check if definition contains the root word or close variations
     * @param {string} word - Original word
     * @param {string} definition - Definition text
     * @returns {boolean} True if contains root word
     */
    containsRootWord(word, definition) {
        const normalizedWord = word.toLowerCase();
        const normalizedDef = definition.toLowerCase();
        
        // Check exact word
        if (normalizedDef.includes(normalizedWord)) {
            return true;
        }

        // Check word stems and variations
        const wordRoot = this.getWordRoot(normalizedWord);
        if (wordRoot.length > 3 && normalizedDef.includes(wordRoot)) {
            return true;
        }

        // Check for common variations
        const variations = this.getWordVariations(normalizedWord);
        for (const variation of variations) {
            if (normalizedDef.includes(variation)) {
                return true;
            }
        }

        return false;
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
     * Get common variations of a word
     * @param {string} word - Word to get variations for
     * @returns {Array} Array of word variations
     */
    getWordVariations(word) {
        const variations = [];
        
        // Add plural/singular
        if (word.endsWith('s') && word.length > 3) {
            variations.push(word.slice(0, -1));
        } else {
            variations.push(word + 's');
        }
        
        // Add -er, -est for adjectives
        if (word.length > 4) {
            variations.push(word + 'er');
            variations.push(word + 'est');
        }
        
        // Add -ing, -ed for verbs
        variations.push(word + 'ing');
        variations.push(word + 'ed');
        
        return variations;
    }

    /**
     * Check if definition is circular (e.g., "reader: someone who reads")
     * @param {string} word - Original word
     * @param {string} definition - Definition text
     * @returns {boolean} True if circular
     */
    isCircularDefinition(word, definition) {
        const circularPatterns = [
            /someone who \w+s/i,
            /something that \w+s/i,
            /the act of \w+ing/i,
            /relating to \w+/i
        ];

        const normalizedDef = definition.toLowerCase();
        const wordRoot = this.getWordRoot(word.toLowerCase());

        for (const pattern of circularPatterns) {
            const match = normalizedDef.match(pattern);
            if (match && match[0].includes(wordRoot)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if definition is descriptive and clear
     * @param {string} definition - Definition text
     * @returns {boolean} True if descriptive
     */
    isDescriptiveDefinition(definition) {
        const descriptiveWords = [
            'characterized by', 'consisting of', 'having the quality',
            'used for', 'designed to', 'capable of', 'known for'
        ];

        const normalizedDef = definition.toLowerCase();
        return descriptiveWords.some(phrase => normalizedDef.includes(phrase));
    }

    /**
     * Check if definition is overly technical
     * @param {string} definition - Definition text
     * @returns {boolean} True if technical
     */
    isTechnicalDefinition(definition) {
        const technicalIndicators = [
            'taxonomy', 'genus', 'species', 'compound', 'molecule',
            'algorithm', 'protocol', 'methodology', 'nomenclature',
            'derived from latin', 'etymology'
        ];

        const normalizedDef = definition.toLowerCase();
        return technicalIndicators.some(term => normalizedDef.includes(term));
    }

    /**
     * Check if a definition is valid according to our criteria
     * @param {string} word - Original word
     * @param {string} definition - Definition to validate
     * @returns {boolean} True if valid
     */
    isValidDefinition(word, definition) {
        if (!definition || definition.length < 10) {
            return false;
        }

        // Reject if contains root word
        if (this.containsRootWord(word, definition)) {
            return false;
        }

        // Reject if circular
        if (this.isCircularDefinition(word, definition)) {
            return false;
        }

        // Reject overly short or long definitions
        if (definition.length < 15 || definition.length > 300) {
            return false;
        }

        return true;
    }

    /**
     * Fetch definitions for multiple words with progress tracking
     * @param {Array} words - Array of words to fetch definitions for
     * @param {Function} progressCallback - Optional callback for progress updates
     * @returns {Promise<Object>} Object mapping words to their definitions
     */
    async fetchMultipleDefinitions(words, progressCallback = null) {
        console.log(`Fetching definitions for ${words.length} words...`);
        
        const results = {};
        const total = words.length;
        let completed = 0;

        for (const word of words) {
            try {
                const definition = await this.fetchDefinition(word);
                results[word.toUpperCase()] = definition;
                completed++;

                if (progressCallback) {
                    progressCallback({
                        current: completed,
                        total: total,
                        word: word,
                        success: definition !== null,
                        percentage: Math.round((completed / total) * 100)
                    });
                }

                console.log(`✅ ${completed}/${total}: ${word} - ${definition ? 'Found' : 'Not found'}`);

            } catch (error) {
                console.error(`Error fetching definition for ${word}:`, error);
                results[word.toUpperCase()] = null;
                completed++;
            }
        }

        console.log(`Completed fetching ${completed} definitions. Success rate: ${Object.values(results).filter(d => d !== null).length}/${total}`);
        return results;
    }

    /**
     * Retry a failed request with exponential backoff
     * @param {Function} requestFunction - Function to retry
     * @param {number} maxRetries - Maximum number of retries
     * @returns {Promise} Result of successful request
     */
    async retryRequest(requestFunction, maxRetries = 3) {
        let lastError = null;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await requestFunction();
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    const delay = this.retryDelays[attempt] || 5000;
                    console.log(`Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Clear the definition cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Definition cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            hitRate: this.cache.size > 0 ? 'N/A (tracking not implemented)' : 0,
            memoryUsage: this.estimateCacheMemoryUsage()
        };
    }

    /**
     * Estimate memory usage of cache
     * @returns {string} Estimated memory usage
     */
    estimateCacheMemoryUsage() {
        let totalSize = 0;
        
        for (const [key, value] of this.cache.entries()) {
            totalSize += key.length * 2; // Approximate character size
            if (value) {
                totalSize += JSON.stringify(value).length * 2;
            }
        }
        
        if (totalSize < 1024) {
            return `${totalSize} bytes`;
        } else if (totalSize < 1024 * 1024) {
            return `${Math.round(totalSize / 1024)} KB`;
        } else {
            return `${Math.round(totalSize / (1024 * 1024))} MB`;
        }
    }

    /**
     * Export cache data for persistence
     * @returns {Object} Serializable cache data
     */
    exportCache() {
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
     * Import cache data from previous session
     * @param {Object} cacheData - Previously exported cache data
     */
    importCache(cacheData) {
        if (!cacheData || !cacheData.data) {
            console.warn('Invalid cache data provided');
            return;
        }
        
        let importedCount = 0;
        for (const [key, value] of Object.entries(cacheData.data)) {
            this.cache.set(key, value);
            importedCount++;
        }
        
        console.log(`Imported ${importedCount} definitions from cache`);
    }
}