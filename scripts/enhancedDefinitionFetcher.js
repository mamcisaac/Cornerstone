// Enhanced Definition Fetcher - API-optimized definition management with comprehensive quality controls
import { WordDatabaseCurator } from './wordDatabaseCurator.js';
import { DefinitionManager } from './definitionManager.js';
import { DefinitionQualityChecker, DEFINITION_QUALITY_CONFIG } from './definitionQualityConfig.js';

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
        
        // Word database curation
        this.curator = new WordDatabaseCurator();
        
        // Definition management with quality controls
        this.definitionManager = new DefinitionManager({
            enableLLMValidation: options.enableLLMValidation !== false,
            qualityThreshold: options.qualityThreshold || DEFINITION_QUALITY_CONFIG.scoring.minimumAcceptableScore
        });
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
                
                if (definition && this.passesQualityChecks(word, definition)) {
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
                
                if (definition && this.passesQualityChecks(word, definition)) {
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
     * Comprehensive quality check using the new quality control system
     * @param {string} word - The word being defined
     * @param {string} definition - The definition text
     * @returns {boolean} True if definition passes quality checks
     */
    passesQualityChecks(word, definition) {
        try {
            // Use the comprehensive quality checker
            const qualityCheck = DefinitionQualityChecker.checkAutoReject(word, definition);
            
            if (qualityCheck.shouldReject) {
                console.log(`🚫 Rejected ${word}: ${qualityCheck.issues.join(', ')}`);
                
                // Mark word as invalid for database curation if it has serious issues
                const seriousIssues = ['rejected_personalNames', 'rejected_inappropriate', 'circular_definition'];
                if (qualityCheck.issues.some(issue => seriousIssues.includes(issue))) {
                    this.curator.markWordAsInvalid(word);
                }
                
                return false;
            }
            
            // Additional API-specific checks
            if (definition.length < DEFINITION_QUALITY_CONFIG.length.minimum) {
                console.log(`🚫 Rejected ${word}: definition too short (${definition.length} chars)`);
                return false;
            }
            
            if (definition.length > DEFINITION_QUALITY_CONFIG.length.maximum) {
                console.log(`🚫 Rejected ${word}: definition too long (${definition.length} chars)`);
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.warn(`⚠️ Error checking quality for ${word}: ${error.message}`);
            return false; // Err on the side of caution
        }
    }

    /**
     * Legacy method maintained for compatibility - now uses comprehensive quality checks
     * @deprecated Use passesQualityChecks instead
     */
    containsRootWord(word, definition) {
        const qualityCheck = DefinitionQualityChecker.checkAutoReject(word, definition);
        return qualityCheck.issues.includes('circular_definition');
    }

    /**
     * Legacy method maintained for compatibility - now uses comprehensive quality checks
     * @deprecated Use passesQualityChecks instead
     */
    containsOffensiveContent(word, definition) {
        const qualityCheck = DefinitionQualityChecker.checkAutoReject(word, definition);
        const hasOffensiveIssues = qualityCheck.issues.some(issue => 
            issue.includes('inappropriate') || issue.includes('personalNames')
        );
        
        if (hasOffensiveIssues) {
            this.curator.markWordAsInvalid(word);
        }
        
        return hasOffensiveIssues;
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
            // Mark word as invalid for database curation
            this.curator.markWordAsInvalid(word);
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
                    this.curator.markWordAsInvalid(word);
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
        filtered.inNegativeCache.forEach(word => this.curator.markWordAsInvalid(word));
        
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
     * Curate the word database by removing invalid words
     * @returns {Promise<Object>} Curation results
     */
    async curateWordDatabase() {
        console.log('\n🧹 Curating word database...');
        return await this.curator.curateDatabase();
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

    /**
     * Process fetched definitions through the quality management system
     * @param {Map} fetchedDefinitions - Map of word -> definition data
     * @returns {Promise<Object>} Processing results with quality metrics
     */
    async processDefinitionsWithQualityControl(fetchedDefinitions) {
        console.log(`🔍 Processing ${fetchedDefinitions.size} definitions through quality control...`);
        
        const results = {
            total: fetchedDefinitions.size,
            accepted: 0,
            rejected: 0,
            errors: 0,
            acceptedDefinitions: new Map(),
            rejectedDefinitions: new Map(),
            qualityStats: {
                averageScore: 0,
                totalScore: 0,
                scoreDistribution: { low: 0, medium: 0, high: 0 }
            }
        };

        // Process each definition through the quality control system
        for (const [word, defData] of fetchedDefinitions.entries()) {
            try {
                const addResult = await this.definitionManager.addDefinition(
                    word, 
                    defData.definition, 
                    {
                        source: defData.source,
                        partOfSpeech: defData.partOfSpeech,
                        fetchedAt: defData.fetchedAt
                    }
                );

                if (addResult.success) {
                    results.accepted++;
                    results.acceptedDefinitions.set(word, addResult.data);
                    
                    // Track quality scores
                    const score = addResult.validation.score;
                    results.qualityStats.totalScore += score;
                    
                    if (score >= 85) results.qualityStats.scoreDistribution.high++;
                    else if (score >= 70) results.qualityStats.scoreDistribution.medium++;
                    else results.qualityStats.scoreDistribution.low++;
                    
                    console.log(`✅ High-quality definition added for ${word} (score: ${score})`);
                } else {
                    results.rejected++;
                    results.rejectedDefinitions.set(word, {
                        definition: defData.definition,
                        reason: addResult.reason,
                        validation: addResult.validation
                    });
                    
                    console.log(`❌ Rejected definition for ${word}: ${addResult.reason}`);
                }
                
            } catch (error) {
                results.errors++;
                console.error(`❌ Error processing definition for ${word}:`, error);
            }
        }

        // Calculate average quality score
        if (results.accepted > 0) {
            results.qualityStats.averageScore = Math.round(results.qualityStats.totalScore / results.accepted);
        }

        console.log(`📊 Quality Control Results:`);
        console.log(`   Total processed: ${results.total}`);
        console.log(`   Accepted: ${results.accepted} (${Math.round((results.accepted/results.total)*100)}%)`);
        console.log(`   Rejected: ${results.rejected} (${Math.round((results.rejected/results.total)*100)}%)`);
        console.log(`   Average quality score: ${results.qualityStats.averageScore}/100`);
        console.log(`   High quality (85+): ${results.qualityStats.scoreDistribution.high}`);
        console.log(`   Medium quality (70-84): ${results.qualityStats.scoreDistribution.medium}`);
        console.log(`   Low quality (<70): ${results.qualityStats.scoreDistribution.low}`);

        return results;
    }

    /**
     * Save processed definitions to file using DefinitionManager
     * @returns {Promise<boolean>} Success status
     */
    async saveProcessedDefinitions() {
        try {
            const success = await this.definitionManager.saveDefinitionsToFile();
            
            if (success) {
                console.log(`💾 Successfully saved definitions with quality guarantees`);
                
                // Also save quality report
                const qualityStats = this.definitionManager.getQualityStats();
                console.log(`📊 Final Quality Report:`);
                console.log(`   Total definitions: ${qualityStats.cacheSize}`);
                console.log(`   Average quality score: ${qualityStats.averageQualityScore}/100`);
                console.log(`   Rejection rate: ${qualityStats.rejectionRate}%`);
                
                return true;
            } else {
                console.error(`❌ Failed to save definitions`);
                return false;
            }
            
        } catch (error) {
            console.error(`❌ Error saving processed definitions:`, error);
            return false;
        }
    }

    /**
     * Enhanced method that combines fetching with quality control
     * @param {Array<string>} words - Words to fetch definitions for
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} Complete processing results
     */
    async fetchAndProcessWithQualityControl(words, options = {}) {
        console.log(`🚀 Starting enhanced definition fetching with quality control for ${words.length} words`);
        
        // Step 1: Fetch definitions using existing logic
        const fetchResults = await this.processWords(words);
        
        // Step 2: Process through quality control system
        const qualityResults = await this.processDefinitionsWithQualityControl(fetchResults.definitionsFound);
        
        // Step 3: Save high-quality definitions
        if (options.saveToFile !== false) {
            await this.saveProcessedDefinitions();
        }
        
        // Step 4: Update word database (remove invalid words)
        if (fetchResults.wordsToRemove.length > 0) {
            console.log(`🧹 Cleaning word database: removing ${fetchResults.wordsToRemove.length} invalid words`);
            fetchResults.wordsToRemove.forEach(word => this.curator.markWordAsInvalid(word));
            await this.curator.curateDatabase();
        }

        // Combined results
        return {
            fetching: fetchResults,
            quality: qualityResults,
            summary: {
                totalWordsProcessed: words.length,
                definitionsFetched: fetchResults.definitionsFound.size,
                highQualityDefinitionsAdded: qualityResults.accepted,
                lowQualityDefinitionsRejected: qualityResults.rejected,
                invalidWordsRemoved: fetchResults.wordsToRemove.length,
                overallSuccessRate: Math.round((qualityResults.accepted / words.length) * 100)
            }
        };
    }
}