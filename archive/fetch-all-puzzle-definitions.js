// Comprehensive definition fetching for all words in all puzzles
// Uses multiple APIs with rate limiting and caching

const fs = require('fs');
const https = require('https');
const { WORD_SET } = require('./words-database.js');

// Load existing definitions to avoid re-fetching
const EXISTING_DEFINITIONS = require('./common-definitions.js');

// Puzzle configurations
const HAMILTONIAN_PATHS = [
    [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11],  // Path 0
    [4, 5, 9, 8, 13, 14, 11, 7, 6, 10, 2, 1],  // Path 1
    [1, 2, 7, 11, 14, 13, 8, 4, 5, 6, 10, 9],  // Path 2
    [8, 13, 14, 10, 9, 5, 6, 11, 7, 2, 1, 4],  // Path 3
    [11, 10, 14, 13, 9, 8, 4, 5, 1, 2, 6, 7],  // Path 4
    [1, 2, 6, 5, 4, 8, 9, 10, 14, 13, 11, 7],  // Path 5
    [14, 13, 8, 9, 4, 5, 1, 2, 7, 6, 11, 10],  // Path 6
    [14, 13, 9, 10, 11, 7, 6, 2, 1, 5, 4, 8],  // Path 7
    [2, 1, 4, 5, 9, 8, 13, 14, 11, 10, 6, 7],  // Path 8
    [7, 11, 10, 14, 9, 13, 8, 4, 5, 1, 2, 6]   // Path 9
];

const SAMPLE_PUZZLES = {
    "CORNERSTONES": { seedWord: "CORNERSTONES", pathIndex: 0 },
    "AVAILABILITY": { seedWord: "AVAILABILITY", pathIndex: 1 },
    "EXPERIMENTAL": { seedWord: "EXPERIMENTAL", pathIndex: 2 },
    "TECHNOLOGIES": { seedWord: "TECHNOLOGIES", pathIndex: 3 },
    "CHAMPIONSHIP": { seedWord: "CHAMPIONSHIP", pathIndex: 4 },
    "UNIVERSITIES": { seedWord: "UNIVERSITIES", pathIndex: 5 },
    "NEIGHBORHOOD": { seedWord: "NEIGHBORHOOD", pathIndex: 6 },
    "THANKSGIVING": { seedWord: "THANKSGIVING", pathIndex: 7 },
    "ENCYCLOPEDIA": { seedWord: "ENCYCLOPEDIA", pathIndex: 8 },
    "BREAKTHROUGH": { seedWord: "BREAKTHROUGH", pathIndex: 9 }
};

const ADJACENCY = {
    1: [2, 4, 5, 6],
    2: [1, 5, 6, 7],
    4: [1, 5, 8, 9],
    5: [1, 2, 4, 6, 8, 9, 10],
    6: [1, 2, 5, 7, 9, 10, 11],
    7: [2, 6, 10, 11],
    8: [4, 5, 9, 13],
    9: [4, 5, 6, 8, 10, 13, 14],
    10: [5, 6, 7, 9, 11, 13, 14],
    11: [6, 7, 10, 14],
    13: [8, 9, 10, 14],
    14: [9, 10, 11, 13]
};

// API configurations - Prioritized by effectiveness
const APIS = {
    datamuse: {
        name: 'Datamuse',
        endpoint: (word) => `https://api.datamuse.com/words?sp=${word.toLowerCase()}&md=d&max=1`,
        rateLimit: { requests: 100000, per: 86400000 }, // 100k per day - very generous
        parser: (data) => {
            try {
                const parsed = JSON.parse(data);
                if (parsed && parsed[0] && parsed[0].defs && parsed[0].defs[0]) {
                    // Datamuse format: "part_of_speech\tdefinition"
                    const def = parsed[0].defs[0].split('\t')[1];
                    return def || null;
                }
            } catch (e) {}
            return null;
        }
    },
    freeDictionary: {
        name: 'FreeDictionary',
        endpoint: (word) => `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`,
        rateLimit: { requests: 60, per: 60000 }, // 60 per minute
        parser: (data) => {
            try {
                const parsed = JSON.parse(data);
                if (parsed && parsed[0] && parsed[0].meanings && parsed[0].meanings[0]) {
                    const def = parsed[0].meanings[0].definitions[0];
                    return def ? def.definition : null;
                }
            } catch (e) {}
            return null;
        }
    },
    wordnik: {
        name: 'Wordnik',
        endpoint: (word) => `https://api.wordnik.com/v4/word.json/${word.toLowerCase()}/definitions?limit=1&includeRelated=false&useCanonical=false&includeTags=false&api_key=${process.env.WORDNIK_API_KEY || 'demo'}`,
        rateLimit: { requests: 5000, per: 3600000 }, // 5000 per hour
        parser: (data) => {
            try {
                const parsed = JSON.parse(data);
                if (parsed && Array.isArray(parsed) && parsed[0] && parsed[0].text) {
                    return parsed[0].text;
                }
            } catch (e) {}
            return null;
        }
    }
};

// Rate limiter
class RateLimiter {
    constructor() {
        this.usage = {};
        for (const api in APIS) {
            this.usage[api] = {
                requests: [],
                limit: APIS[api].rateLimit
            };
        }
    }

    canUse(apiName) {
        const now = Date.now();
        const apiUsage = this.usage[apiName];
        const { requests, limit } = apiUsage;
        
        // Remove old requests outside the time window
        apiUsage.requests = requests.filter(time => now - time < limit.per);
        
        return apiUsage.requests.length < limit.requests;
    }

    recordUse(apiName) {
        this.usage[apiName].requests.push(Date.now());
    }

    getWaitTime(apiName) {
        const now = Date.now();
        const apiUsage = this.usage[apiName];
        const { requests, limit } = apiUsage;
        
        if (requests.length < limit.requests) return 0;
        
        const oldestRequest = Math.min(...requests);
        const waitTime = (oldestRequest + limit.per) - now;
        return Math.max(0, waitTime);
    }
}

// Fetch with timeout
function fetchWithTimeout(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Request timeout'));
        }, timeout);

        https.get(url, { 
            headers: { 'User-Agent': 'Cornerstones-Game/1.0' }
        }, (res) => {
            clearTimeout(timer);
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', err => {
            clearTimeout(timer);
            reject(err);
        });
    });
}

// Main definition fetcher
class DefinitionFetcher {
    constructor() {
        this.rateLimiter = new RateLimiter();
        this.cache = new Map();
        this.definitions = { ...EXISTING_DEFINITIONS };
        this.stats = {
            total: 0,
            cached: 0,
            fetched: 0,
            failed: 0
        };
    }

    async fetchDefinition(word) {
        const upperWord = word.toUpperCase();
        
        // Check if we already have it
        if (this.definitions[upperWord] && 
            this.definitions[upperWord] !== "A valid English word" &&
            this.definitions[upperWord] !== "A common English word") {
            this.stats.cached++;
            return this.definitions[upperWord];
        }

        // Try each API in order
        for (const apiName in APIS) {
            const api = APIS[apiName];
            
            // Check rate limit
            if (!this.rateLimiter.canUse(apiName)) {
                const waitTime = this.rateLimiter.getWaitTime(apiName);
                console.log(`  ${api.name} rate limited, wait ${Math.ceil(waitTime/1000)}s`);
                continue;
            }

            try {
                const url = api.endpoint(word);
                console.log(`  Trying ${api.name}...`);
                
                const data = await fetchWithTimeout(url);
                this.rateLimiter.recordUse(apiName);
                
                const definition = api.parser(data);
                if (definition) {
                    // Clean up definition
                    let cleaned = definition.trim();
                    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
                    if (!cleaned.endsWith('.')) cleaned += '.';
                    
                    this.definitions[upperWord] = cleaned;
                    this.stats.fetched++;
                    console.log(`  ✓ ${api.name}: ${cleaned.substring(0, 60)}...`);
                    return cleaned;
                }
            } catch (error) {
                console.log(`  ✗ ${api.name} failed: ${error.message}`);
            }
        }

        this.stats.failed++;
        return null;
    }

    async processAllPuzzles() {
        console.log('🚀 Starting comprehensive definition fetch for all puzzles...\n');
        
        const allWords = new Set();
        
        // Find all words in all puzzles
        for (const [puzzleName, puzzle] of Object.entries(SAMPLE_PUZZLES)) {
            console.log(`\nAnalyzing puzzle: ${puzzleName}`);
            const words = this.findWordsInPuzzle(puzzle);
            console.log(`  Found ${words.size} words`);
            words.forEach(word => allWords.add(word));
        }

        console.log(`\n📊 Total unique words across all puzzles: ${allWords.size}`);
        
        // Process all words
        const wordArray = Array.from(allWords).sort();
        for (let i = 0; i < wordArray.length; i++) {
            const word = wordArray[i];
            this.stats.total++;
            
            console.log(`\n[${i+1}/${wordArray.length}] ${word}`);
            await this.fetchDefinition(word);
            
            // Progress checkpoint every 50 words
            if ((i + 1) % 50 === 0) {
                await this.saveProgress();
                console.log(`\n--- Progress: ${i+1}/${wordArray.length} ---`);
                console.log(`Cached: ${this.stats.cached}, Fetched: ${this.stats.fetched}, Failed: ${this.stats.failed}`);
                
                // Small delay to be nice to APIs
                await this.sleep(2000);
            }
        }

        await this.saveProgress();
        
        console.log('\n\n✅ COMPLETE!');
        console.log(`Total words: ${this.stats.total}`);
        console.log(`Used cache: ${this.stats.cached}`);
        console.log(`Fetched new: ${this.stats.fetched}`);
        console.log(`Failed: ${this.stats.failed}`);
    }

    findWordsInPuzzle(puzzle) {
        const words = new Set();
        const grid = new Array(16).fill('');
        const path = HAMILTONIAN_PATHS[puzzle.pathIndex];
        
        path.forEach((position, index) => {
            grid[position] = puzzle.seedWord[index];
        });

        // DFS to find all words
        for (let start = 0; start < grid.length; start++) {
            if (grid[start]) {
                this.dfs(grid, start, '', new Array(16).fill(false), words);
            }
        }
        
        return words;
    }

    dfs(grid, pos, currentWord, visited, words) {
        if (!grid[pos]) return;
        
        visited[pos] = true;
        const newWord = currentWord + grid[pos];
        
        if (newWord.length >= 4 && WORD_SET.has(newWord.toUpperCase())) {
            words.add(newWord.toUpperCase());
        }
        
        if (newWord.length < 12) {
            const neighbors = ADJACENCY[pos] || [];
            for (const neighbor of neighbors) {
                if (!visited[neighbor] && grid[neighbor]) {
                    this.dfs(grid, neighbor, newWord, [...visited], words);
                }
            }
        }
    }

    async saveProgress() {
        const output = `// Enhanced definitions for all puzzle words
// Generated on ${new Date().toISOString()}

const ALL_PUZZLE_DEFINITIONS = ${JSON.stringify(this.definitions, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ALL_PUZZLE_DEFINITIONS;
}`;

        fs.writeFileSync('all-puzzle-definitions.js', output);
        console.log('💾 Progress saved to all-puzzle-definitions.js');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run if called directly
if (require.main === module) {
    const fetcher = new DefinitionFetcher();
    fetcher.processAllPuzzles().catch(console.error);
}

module.exports = { DefinitionFetcher };