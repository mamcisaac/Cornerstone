// Multi-API dictionary system that cycles through free APIs respecting rate limits
const fs = require('fs');
const https = require('https');
const { ALL_CORNERSTONES_WORDS } = require('./all-cornerstones-words.js');

// API Configuration with rate limits and endpoints
const DICTIONARY_APIS = [
    {
        name: 'FreeDictionary',
        endpoint: (word) => `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`,
        rateLimit: { requests: 100, per: 'minute' }, // Conservative estimate
        parser: (data) => {
            const parsed = JSON.parse(data);
            if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                const entry = parsed[0];
                if (entry.meanings && entry.meanings.length > 0) {
                    const firstMeaning = entry.meanings[0];
                    if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
                        return firstMeaning.definitions[0].definition;
                    }
                }
            }
            return null;
        }
    },
    {
        name: 'WordsAPI',
        endpoint: (word) => `https://wordsapiv1.p.rapidapi.com/words/${word.toLowerCase()}`,
        headers: {
            'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY_HERE', // Need to get this
            'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
        },
        rateLimit: { requests: 2500, per: 'month' }, // Free tier
        parser: (data) => {
            const parsed = JSON.parse(data);
            if (parsed && parsed.results && parsed.results.length > 0) {
                return parsed.results[0].definition;
            }
            return null;
        }
    },
    {
        name: 'Wordnik',
        endpoint: (word) => `https://api.wordnik.com/v4/word.json/${word.toLowerCase()}/definitions?limit=1&includeRelated=false&useCanonical=false&includeTags=false&api_key=YOUR_WORDNIK_KEY`,
        rateLimit: { requests: 1000, per: 'hour' }, // Free tier
        parser: (data) => {
            const parsed = JSON.parse(data);
            if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                return parsed[0].text;
            }
            return null;
        }
    },
    {
        name: 'DictionaryAPI',
        endpoint: (word) => `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word.toLowerCase()}?key=YOUR_MERRIAM_WEBSTER_KEY`,
        rateLimit: { requests: 1000, per: 'day' }, // Free tier
        parser: (data) => {
            const parsed = JSON.parse(data);
            if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                const entry = parsed[0];
                if (entry.shortdef && entry.shortdef.length > 0) {
                    return entry.shortdef[0];
                }
            }
            return null;
        }
    }
];

// Rate limiting tracker
class RateLimiter {
    constructor() {
        this.apiUsage = {};
        DICTIONARY_APIS.forEach(api => {
            this.apiUsage[api.name] = {
                requests: 0,
                resetTime: Date.now() + this.getResetInterval(api.rateLimit.per)
            };
        });
    }

    getResetInterval(period) {
        switch (period) {
            case 'minute': return 60 * 1000;
            case 'hour': return 60 * 60 * 1000;
            case 'day': return 24 * 60 * 60 * 1000;
            case 'month': return 30 * 24 * 60 * 60 * 1000;
            default: return 60 * 1000;
        }
    }

    canUseAPI(apiName) {
        const usage = this.apiUsage[apiName];
        const api = DICTIONARY_APIS.find(a => a.name === apiName);
        
        // Reset counter if time period has passed
        if (Date.now() > usage.resetTime) {
            usage.requests = 0;
            usage.resetTime = Date.now() + this.getResetInterval(api.rateLimit.per);
        }

        return usage.requests < api.rateLimit.requests;
    }

    recordUsage(apiName) {
        this.apiUsage[apiName].requests++;
    }

    getNextAvailableAPI() {
        for (const api of DICTIONARY_APIS) {
            if (this.canUseAPI(api.name)) {
                return api;
            }
        }
        return null; // All APIs at limit
    }

    getWaitTime() {
        const waitTimes = Object.values(this.apiUsage).map(usage => usage.resetTime - Date.now());
        return Math.min(...waitTimes.filter(time => time > 0));
    }
}

// Enhanced definition fetcher
class MultiAPIDefinitionFetcher {
    constructor() {
        this.rateLimiter = new RateLimiter();
        this.cache = new Map();
        this.fallbackDelay = 1000; // 1 second between requests as fallback
    }

    async fetchDefinition(word) {
        // Check cache first
        if (this.cache.has(word.toUpperCase())) {
            return this.cache.get(word.toUpperCase());
        }

        let definition = null;
        let attempts = 0;
        const maxAttempts = DICTIONARY_APIS.length;

        while (!definition && attempts < maxAttempts) {
            const api = this.rateLimiter.getNextAvailableAPI();
            
            if (!api) {
                const waitTime = this.rateLimiter.getWaitTime();
                console.log(`All APIs at limit. Waiting ${Math.ceil(waitTime / 1000)}s...`);
                await this.sleep(Math.min(waitTime, 60000)); // Wait max 1 minute
                continue;
            }

            try {
                console.log(`Trying ${api.name} for "${word}"`);
                definition = await this.callAPI(api, word);
                this.rateLimiter.recordUsage(api.name);

                if (definition) {
                    // Clean up definition
                    definition = this.cleanDefinition(definition);
                    this.cache.set(word.toUpperCase(), definition);
                    console.log(`✓ ${api.name}: ${definition.substring(0, 60)}${definition.length > 60 ? '...' : ''}`);
                    return definition;
                }
            } catch (error) {
                console.log(`✗ ${api.name} failed for "${word}": ${error.message}`);
            }

            attempts++;
            
            // Small delay between API calls
            await this.sleep(this.fallbackDelay);
        }

        console.log(`✗ All APIs failed for "${word}"`);
        return null;
    }

    async callAPI(api, word) {
        return new Promise((resolve, reject) => {
            const url = api.endpoint(word);
            const options = {
                headers: {
                    'User-Agent': 'Cornerstones-Game/1.0',
                    ...api.headers
                }
            };

            https.get(url, options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            const definition = api.parser(data);
                            resolve(definition);
                        } else if (res.statusCode === 404) {
                            resolve(null); // Word not found, not an error
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}`));
                        }
                    } catch (error) {
                        reject(new Error(`Parse error: ${error.message}`));
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    cleanDefinition(definition) {
        if (!definition) return definition;
        
        // Clean up common issues
        definition = definition.trim();
        definition = definition.charAt(0).toUpperCase() + definition.slice(1);
        if (!definition.endsWith('.')) {
            definition += '.';
        }
        
        // Remove HTML tags if present
        definition = definition.replace(/<[^>]*>/g, '');
        
        return definition;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main function to enhance definitions in batches
async function enhanceDefinitions(startIndex = 0, batchSize = 50) {
    console.log('🚀 Starting multi-API definition enhancement...');
    
    const fetcher = new MultiAPIDefinitionFetcher();
    const wordsToEnhance = ALL_CORNERSTONES_WORDS.slice(startIndex, startIndex + batchSize);

    console.log(`📝 Enhancing definitions for words ${startIndex + 1}-${startIndex + wordsToEnhance.length} of ${ALL_CORNERSTONES_WORDS.length}`);

    const enhancedDefinitions = {};
    const failed = [];

    for (let i = 0; i < wordsToEnhance.length; i++) {
        const word = wordsToEnhance[i];
        const globalIndex = startIndex + i + 1;
        console.log(`\n[${globalIndex}/${ALL_CORNERSTONES_WORDS.length}] Processing: ${word}`);

        try {
            const definition = await fetcher.fetchDefinition(word);
            
            if (definition) {
                enhancedDefinitions[word] = definition;
            } else {
                failed.push(word);
            }
        } catch (error) {
            console.log(`Error processing ${word}: ${error.message}`);
            failed.push(word);
        }

        // Progress checkpoint every 10 words
        if ((i + 1) % 10 === 0) {
            console.log(`\n--- Batch Progress: ${i + 1}/${wordsToEnhance.length} ---`);
            console.log(`Enhanced: ${Object.keys(enhancedDefinitions).length}`);
            console.log(`Failed: ${failed.length}`);
        }
    }

    // Save results
    const results = {
        batch: {
            startIndex,
            endIndex: startIndex + wordsToEnhance.length - 1,
            size: wordsToEnhance.length
        },
        enhanced: enhancedDefinitions,
        failed: failed,
        summary: {
            processed: wordsToEnhance.length,
            enhanced: Object.keys(enhancedDefinitions).length,
            failed: failed.length,
            successRate: `${Math.round((Object.keys(enhancedDefinitions).length / wordsToEnhance.length) * 100)}%`
        }
    };

    const filename = `enhanced-definitions-batch-${startIndex}-${startIndex + wordsToEnhance.length - 1}.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`\n✅ Results saved to ${filename}`);
    console.log(`📊 Batch Summary: ${results.summary.enhanced}/${results.summary.processed} enhanced (${results.summary.successRate})`);

    return results;
}

// Command line interface
if (require.main === module) {
    enhanceDefinitions().catch(console.error);
}

module.exports = { MultiAPIDefinitionFetcher, enhanceDefinitions };