// Enhanced Definition Fetcher - API-optimized definition management with word database cleaning
export class EnhancedDefinitionFetcher {
    constructor(options = {}) {
        this.options = {
            dataumusBaseUrl: 'https://api.datamuse.com',
            freeDictBaseUrl: 'https://api.dictionaryapi.dev/api/v2/entries/en',
            rateLimitPerSecond: 8, // Conservative rate limiting
            retryAttempts: 2,
            batchSize: 20,
            cacheResults: true,
            ...options
        };
        
        // Caching system
        this.existingDefinitions = new Map(); // Pre-loaded existing definitions
        this.positiveCache = new Map(); // Successfully fetched definitions
        this.negativeCache = new Set(); // Words with no definitions available
        this.errorCache = new Map(); // Words that had API errors (retry later)
        
        // API usage tracking
        this.stats = {
            apiCallsSaved: 0,
            dataumusCalls: 0,
            freeDictCalls: 0,
            cacheHits: 0,
            definitionsFound: 0,
            wordsRemoved: 0,
            startTime: Date.now()
        };
        
        // Rate limiting
        this.lastRequestTime = 0;
        this.requestQueue = [];
    }

    /**
     * Load existing definitions to avoid redundant API calls
     * @param {Object} existingDefs - Existing definitions object
     */
    async loadExistingDefinitions(existingDefs) {
        console.log('📚 Loading existing definitions for API optimization...');
        
        Object.entries(existingDefs).forEach(([word, definition]) => {
            this.existingDefinitions.set(word.toUpperCase(), {
                definition,
                source: 'existing',
                loadedAt: new Date().toISOString()
            });
        });
        
        console.log(`   ✅ Loaded ${this.existingDefinitions.size} existing definitions`);
        console.log(`   💰 These words will not require API calls`);
    }

    /**
     * Pre-filter words to remove those already defined
     * @param {Array} words - Array of words to check
     * @returns {Object} Filtered results with statistics
     */
    preFilterWords(words) {
        const alreadyDefined = [];
        const needDefinitions = [];
        const inNegativeCache = [];
        
        words.forEach(word => {
            const upperWord = word.toUpperCase();
            
            if (this.existingDefinitions.has(upperWord)) {
                alreadyDefined.push(word);
                this.stats.apiCallsSaved++;
            } else if (this.negativeCache.has(upperWord)) {
                inNegativeCache.push(word);
                this.stats.apiCallsSaved++;
            } else {
                needDefinitions.push(word);
            }
        });
        
        console.log(`🔍 Pre-filter results for ${words.length} words:`);
        console.log(`   ✅ Already defined: ${alreadyDefined.length}`);
        console.log(`   ❌ Known undefined: ${inNegativeCache.length}`);
        console.log(`   ❓ Need to check: ${needDefinitions.length}`);
        console.log(`   💰 API calls saved: ${this.stats.apiCallsSaved}`);
        
        return {
            alreadyDefined,
            needDefinitions,
            inNegativeCache,
            totalApiCallsSaved: this.stats.apiCallsSaved
        };
    }

    /**
     * Fetch definition from Datamuse API
     * @param {string} word - Word to define
     * @returns {Promise<Object|null>} Definition data or null
     */
    async fetchFromDatamuse(word) {
        await this.respectRateLimit();
        
        try {
            const url = `${this.options.dataumusBaseUrl}/words?sp=${encodeURIComponent(word.toLowerCase())}&md=d&max=1`;
            const response = await fetch(url);
            this.stats.dataumusCalls++;
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data && data.length > 0 && data[0].defs && data[0].defs.length > 0) {
                // Process Datamuse definition format: "pos\tdefinition"
                const rawDef = data[0].defs[0];
                const parts = rawDef.split('\t');
                const definition = parts.length > 1 ? parts[1].trim() : rawDef.trim();
                
                if (definition && 
                    !this.containsRootWord(word, definition) && 
                    !this.containsOffensiveContent(word, definition)) {
                    return {
                        word: word.toUpperCase(),
                        definition,
                        partOfSpeech: parts.length > 1 ? parts[0] : 'unknown',
                        source: 'datamuse',
                        fetchedAt: new Date().toISOString()
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.warn(`Datamuse API error for ${word}: ${error.message}`);
            return null;
        }
    }

    /**
     * Fetch definition from Free Dictionary API
     * @param {string} word - Word to define
     * @returns {Promise<Object|null>} Definition data or null
     */
    async fetchFromFreeDictionary(word) {
        await this.respectRateLimit();
        
        try {
            const url = `${this.options.freeDictBaseUrl}/${word.toLowerCase()}`;
            const response = await fetch(url);
            this.stats.freeDictCalls++;
            
            if (!response.ok) {
                return null; // Free Dictionary returns 404 for unknown words
            }
            
            const data = await response.json();
            
            if (data && data[0] && data[0].meanings && data[0].meanings[0] && 
                data[0].meanings[0].definitions && data[0].meanings[0].definitions[0]) {
                
                const meaningData = data[0].meanings[0];
                const definition = meaningData.definitions[0].definition;
                
                if (definition && 
                    !this.containsRootWord(word, definition) && 
                    !this.containsOffensiveContent(word, definition)) {
                    return {
                        word: word.toUpperCase(),
                        definition,
                        partOfSpeech: meaningData.partOfSpeech || 'unknown',
                        source: 'free-dictionary',
                        fetchedAt: new Date().toISOString()
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.warn(`Free Dictionary API error for ${word}: ${error.message}`);
            return null;
        }
    }

    /**
     * Check if definition contains the root word (circular definition)
     * @param {string} word - The word being defined
     * @param {string} definition - The definition text
     * @returns {boolean} True if definition contains root word
     */
    containsRootWord(word, definition) {
        const normalizedWord = word.toLowerCase();
        const normalizedDef = definition.toLowerCase();
        
        // Check for exact word match
        if (normalizedDef.includes(normalizedWord)) {
            return true;
        }
        
        // Check for common word variations
        const wordVariations = [
            normalizedWord + 's',    // plural
            normalizedWord + 'ed',   // past tense
            normalizedWord + 'ing',  // present participle
            normalizedWord + 'er',   // comparative
            normalizedWord + 'est'   // superlative
        ];
        
        return wordVariations.some(variation => normalizedDef.includes(variation));
    }

    /**
     * Check if definition contains offensive content
     * @param {string} word - The word being defined
     * @param {string} definition - The definition text
     * @returns {boolean} True if definition contains offensive content
     */
    containsOffensiveContent(word, definition) {
        const normalizedDef = definition.toLowerCase();
        
        // Offensive content markers to reject
        const offensiveMarkers = [
            'slur',
            'offensive',
            'derogatory',
            'ethnic slur',
            'racial slur',
            'pejorative',
            'disparaging',
            'insulting',
            'vulgar',
            'profanity'
        ];
        
        // Check for offensive markers
        const hasOffensiveMarkers = offensiveMarkers.some(marker => 
            normalizedDef.includes(marker)
        );
        
        if (hasOffensiveMarkers) {
            console.log(`🚫 Rejected ${word}: contains offensive content markers`);
            return true;
        }
        
        return false;
    }

    /**
     * Fetch definition with fallback sources
     * @param {string} word - Word to define
     * @returns {Promise<Object|null>} Definition data or null
     */
    async fetchDefinitionWithFallback(word) {
        const upperWord = word.toUpperCase();
        
        // Check caches first - this should never happen if pre-filtering worked
        if (this.existingDefinitions.has(upperWord)) {
            this.stats.cacheHits++;
            return this.existingDefinitions.get(upperWord);
        }
        
        if (this.positiveCache.has(upperWord)) {
            this.stats.cacheHits++;
            return this.positiveCache.get(upperWord);
        }
        
        if (this.negativeCache.has(upperWord)) {
            this.stats.cacheHits++;
            return null;
        }
        
        // Try Datamuse first
        let result = await this.fetchFromDatamuse(word);
        
        // Fallback to Free Dictionary
        if (!result) {
            result = await this.fetchFromFreeDictionary(word);
        }
        
        // Cache the result
        if (result) {
            this.positiveCache.set(upperWord, result);
            this.stats.definitionsFound++;
        } else {
            this.negativeCache.add(upperWord);
        }
        
        return result;
    }

    /**
     * Process words for definitions with intelligent batching and filtering
     * @param {Array} words - Words to process
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<Object>} Processing results
     */
    async processWordsForDefinitions(words, progressCallback = null) {
        console.log(`📖 Processing ${words.length} words for definitions...`);
        
        // Pre-filter to avoid unnecessary API calls
        const filtered = this.preFilterWords(words);
        
        const results = {
            definitionsFound: new Map(),
            wordsToRemove: [],
            alreadyDefined: filtered.alreadyDefined,
            apiCallsSaved: filtered.totalApiCallsSaved,
            processedCount: 0
        };
        
        // Add existing definitions to results
        filtered.alreadyDefined.forEach(word => {
            const upperWord = word.toUpperCase();
            if (this.existingDefinitions.has(upperWord)) {
                results.definitionsFound.set(upperWord, this.existingDefinitions.get(upperWord));
            }
        });
        
        // Process words that need API calls in batches
        const wordsToCheck = filtered.needDefinitions;
        console.log(`🔍 Making API calls for ${wordsToCheck.length} undefined words...`);
        
        for (let i = 0; i < wordsToCheck.length; i += this.options.batchSize) {
            const batch = wordsToCheck.slice(i, i + this.options.batchSize);
            const batchNum = Math.floor(i / this.options.batchSize) + 1;
            const totalBatches = Math.ceil(wordsToCheck.length / this.options.batchSize);
            
            console.log(`   📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} words)...`);
            
            // Process batch
            for (const word of batch) {
                const definition = await this.fetchDefinitionWithFallback(word);
                results.processedCount++;
                
                if (definition) {
                    results.definitionsFound.set(word.toUpperCase(), definition);
                } else {
                    results.wordsToRemove.push(word);
                    this.stats.wordsRemoved++;
                }
                
                // Progress callback
                if (progressCallback && results.processedCount % 10 === 0) {
                    progressCallback({
                        current: results.processedCount,
                        total: wordsToCheck.length,
                        found: results.definitionsFound.size - filtered.alreadyDefined.length,
                        removed: results.wordsToRemove.length
                    });
                }
            }
            
            console.log(`     ✅ Batch ${batchNum} complete: ${batch.filter(w => results.definitionsFound.has(w.toUpperCase())).length}/${batch.length} definitions found`);
        }
        
        // Add words that were already known to be undefined
        results.wordsToRemove.push(...filtered.inNegativeCache);
        
        return results;
    }

    /**
     * Rate limiting helper
     */
    async respectRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minInterval = 1000 / this.options.rateLimitPerSecond;
        
        if (timeSinceLastRequest < minInterval) {
            const waitTime = minInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }

    /**
     * Get comprehensive statistics
     * @returns {Object} Usage statistics
     */
    getStatistics() {
        const runtime = Date.now() - this.stats.startTime;
        
        return {
            ...this.stats,
            runtime,
            efficiency: {
                apiCallsSaved: this.stats.apiCallsSaved,
                totalApiCalls: this.stats.dataumusCalls + this.stats.freeDictCalls,
                cacheHitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.dataumusCalls + this.stats.freeDictCalls) * 100,
                definitionSuccessRate: this.stats.definitionsFound / (this.stats.definitionsFound + this.stats.wordsRemoved) * 100
            },
            cacheStats: {
                existingDefinitions: this.existingDefinitions.size,
                positiveCache: this.positiveCache.size,
                negativeCache: this.negativeCache.size
            }
        };
    }

    /**
     * Clean word database by removing words without definitions
     * @param {Array} originalWords - Original word list
     * @param {Array} wordsToRemove - Words to remove from database
     * @returns {Array} Cleaned word list
     */
    cleanWordDatabase(originalWords, wordsToRemove) {
        const removeSet = new Set(wordsToRemove.map(w => w.toUpperCase()));
        const cleanedWords = originalWords.filter(word => !removeSet.has(word.toUpperCase()));
        
        console.log(`🧹 Word database cleaning:`);
        console.log(`   📊 Original words: ${originalWords.length}`);
        console.log(`   ❌ Words removed: ${wordsToRemove.length}`);
        console.log(`   ✅ Words remaining: ${cleanedWords.length}`);
        console.log(`   📈 Reduction: ${Math.round((wordsToRemove.length / originalWords.length) * 100)}%`);
        
        return cleanedWords;
    }
}