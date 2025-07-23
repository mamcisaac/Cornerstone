#!/usr/bin/env node
/**
 * Comprehensive Definition Fetcher
 * 
 * Consolidates all definition fetching functionality into a single configurable script.
 * Supports multiple APIs with rate limiting, caching, and different operation modes.
 * 
 * Usage:
 *   node scripts/definition-fetcher.js [mode] [options]
 * 
 * Modes:
 *   --all-puzzles     Fetch definitions for all words in all puzzles
 *   --single-puzzle   Fetch definitions for words in a specific puzzle
 *   --missing-only    Fetch definitions only for words without definitions
 *   --validate        Validate existing definitions and find gaps
 * 
 * Options:
 *   --puzzle <name>   Specify puzzle name (for single-puzzle mode)
 *   --output <file>   Output file path (default: definitions-output.js)
 *   --dry-run         Show what would be fetched without making API calls
 *   --verbose         Show detailed progress information
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

// Configuration
const CONFIG = {
    // API configurations prioritized by effectiveness
    apis: {
        datamuse: {
            name: 'Datamuse',
            endpoint: (word) => `https://api.datamuse.com/words?sp=${word.toLowerCase()}&md=d&max=1`,
            rateLimit: { requests: 1000, per: 3600000 }, // 1000 per hour (conservative)
            parser: (data) => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && parsed[0] && parsed[0].defs && parsed[0].defs[0]) {
                        const def = parsed[0].defs[0].split('\\t')[1] || parsed[0].defs[0];
                        return def;
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
            rateLimit: { requests: 1000, per: 3600000 }, // 1000 per hour
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
    }
};

// Load game data
let WORD_SET, SAMPLE_PUZZLES, HAMILTONIAN_PATHS, ADJACENCY, EXISTING_DEFINITIONS;

function loadGameData() {
    try {
        // Try to load from src/data first, then fallback to root
        const dataDir = fs.existsSync('./src/data') ? './src/data' : '.';
        
        // Load word database
        const wordsFile = fs.existsSync(path.join(dataDir, 'words-database-compact.js')) ? 
            path.join(dataDir, 'words-database-compact.js') : 
            path.join(dataDir, 'words-database.js');
        const wordsData = require(path.resolve(wordsFile));
        WORD_SET = wordsData.WORD_SET || wordsData.COMPREHENSIVE_WORD_SET;
        
        // Load existing definitions
        const defsFile = path.join(dataDir, 'common-definitions.js');
        if (fs.existsSync(defsFile)) {
            const defsData = require(path.resolve(defsFile));
            EXISTING_DEFINITIONS = defsData.COMMON_DEFINITIONS || defsData;
        } else {
            EXISTING_DEFINITIONS = {};
        }
        
        // Game constants
        HAMILTONIAN_PATHS = [
            [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11],  // Path 0
            [4, 5, 9, 8, 13, 14, 11, 7, 6, 10, 2, 1],  // Path 1
            [1, 2, 7, 11, 14, 13, 8, 4, 5, 6, 10, 9],  // Path 2
            [5, 1, 2, 6, 10, 14, 13, 9, 8, 4, 7, 11],  // Path 3
            [11, 7, 2, 1, 5, 9, 13, 14, 10, 6, 4, 8],  // Path 4
            [8, 4, 5, 1, 6, 2, 7, 11, 14, 10, 9, 13],  // Path 5
            [9, 5, 4, 8, 13, 14, 10, 6, 1, 2, 7, 11],  // Path 6
            [14, 13, 9, 10, 11, 7, 6, 2, 1, 5, 4, 8],  // Path 7
            [2, 1, 4, 5, 9, 8, 13, 14, 11, 10, 6, 7],  // Path 8
            [7, 11, 10, 14, 9, 13, 8, 4, 5, 1, 2, 6]   // Path 9
        ];
        
        SAMPLE_PUZZLES = {
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
        
        ADJACENCY = {
            1: [2, 4, 5, 6], 2: [1, 5, 6, 7], 4: [1, 5, 8, 9],
            5: [1, 2, 4, 6, 8, 9, 10], 6: [1, 2, 5, 7, 9, 10, 11],
            7: [2, 6, 10, 11], 8: [4, 5, 9, 13], 9: [4, 5, 6, 8, 10, 13, 14],
            10: [5, 6, 7, 9, 11, 13, 14], 11: [6, 7, 10, 14],
            13: [8, 9, 10, 14], 14: [9, 10, 11, 13]
        };
        
        console.log(`✅ Loaded ${WORD_SET.size} words and ${Object.keys(EXISTING_DEFINITIONS).length} existing definitions`);
        
    } catch (error) {
        console.error('❌ Failed to load game data:', error.message);
        process.exit(1);
    }
}

// Rate limiter class
class RateLimiter {
    constructor() {
        this.usage = {};
        for (const [name, api] of Object.entries(CONFIG.apis)) {
            this.usage[name] = { requests: [], limit: api.rateLimit };
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
        return Math.max(0, (oldestRequest + limit.per) - now);
    }
}

// HTTP request with timeout
function fetchWithTimeout(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Request timeout')), timeout);
        
        https.get(url, { headers: { 'User-Agent': 'Cornerstones-DefinitionFetcher/1.0' } }, (res) => {
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

// Main definition fetcher class
class DefinitionFetcher {
    constructor(options = {}) {
        this.rateLimiter = new RateLimiter();
        this.options = {
            verbose: false,
            dryRun: false,
            output: 'definitions-output.js',
            ...options
        };
        this.stats = { total: 0, cached: 0, fetched: 0, failed: 0 };
        this.definitions = { ...EXISTING_DEFINITIONS };
    }

    log(message, level = 'info') {
        if (this.options.verbose || level === 'error') {
            const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : '📝';
            console.log(`${prefix} ${message}`);
        }
    }

    async fetchDefinition(word) {
        const upperWord = word.toUpperCase();
        this.stats.total++;
        
        // Check if we already have a good definition
        if (this.definitions[upperWord] && 
            !this.definitions[upperWord].includes('valid English word') &&
            !this.definitions[upperWord].includes('common English word')) {
            this.stats.cached++;
            return this.definitions[upperWord];
        }

        if (this.options.dryRun) {
            this.log(`Would fetch: ${word}`);
            return 'DRY RUN - definition would be fetched';
        }

        // Try each API in order
        for (const [apiName, api] of Object.entries(CONFIG.apis)) {
            if (!this.rateLimiter.canUse(apiName)) {
                const waitTime = this.rateLimiter.getWaitTime(apiName);
                this.log(`${api.name} rate limited, wait ${Math.ceil(waitTime/1000)}s`);
                continue;
            }

            try {
                this.log(`Trying ${api.name} for "${word}"`);
                const data = await fetchWithTimeout(api.endpoint(word));
                this.rateLimiter.recordUse(apiName);
                
                const definition = api.parser(data);
                if (definition) {
                    // Clean up definition
                    let cleaned = definition.trim();
                    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
                    if (!cleaned.endsWith('.')) cleaned += '.';
                    
                    this.definitions[upperWord] = cleaned;
                    this.stats.fetched++;
                    this.log(`✅ ${api.name}: ${cleaned.substring(0, 60)}...`, 'success');
                    return cleaned;
                }
            } catch (error) {
                this.log(`${api.name} failed: ${error.message}`);
            }
        }

        this.stats.failed++;
        this.log(`All APIs failed for "${word}"`, 'error');
        return null;
    }

    // Find all words in a puzzle
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

    async processMode(mode, puzzleName = null) {
        let wordsToProcess = new Set();
        
        switch (mode) {
            case 'all-puzzles':
                this.log('Processing all puzzles...');
                for (const [name, puzzle] of Object.entries(SAMPLE_PUZZLES)) {
                    this.log(`Finding words in ${name}...`);
                    const puzzleWords = this.findWordsInPuzzle(puzzle);
                    puzzleWords.forEach(word => wordsToProcess.add(word));
                }
                break;
                
            case 'single-puzzle':
                if (!puzzleName || !SAMPLE_PUZZLES[puzzleName]) {
                    console.error('❌ Invalid puzzle name. Available:', Object.keys(SAMPLE_PUZZLES).join(', '));
                    return;
                }
                this.log(`Processing puzzle: ${puzzleName}`);
                wordsToProcess = this.findWordsInPuzzle(SAMPLE_PUZZLES[puzzleName]);
                break;
                
            case 'missing-only':
                this.log('Finding words with missing definitions...');
                for (const [name, puzzle] of Object.entries(SAMPLE_PUZZLES)) {
                    const puzzleWords = this.findWordsInPuzzle(puzzle);
                    puzzleWords.forEach(word => {
                        const def = EXISTING_DEFINITIONS[word];
                        if (!def || def.includes('valid English word') || def.includes('common English word')) {
                            wordsToProcess.add(word);
                        }
                    });
                }
                break;
                
            case 'validate':
                this.log('Validating existing definitions...');
                const allPuzzleWords = new Set();
                for (const puzzle of Object.values(SAMPLE_PUZZLES)) {
                    const puzzleWords = this.findWordsInPuzzle(puzzle);
                    puzzleWords.forEach(word => allPuzzleWords.add(word));
                }
                
                const missingDefs = Array.from(allPuzzleWords).filter(word => !EXISTING_DEFINITIONS[word]);
                const placeholderDefs = Array.from(allPuzzleWords).filter(word => {
                    const def = EXISTING_DEFINITIONS[word];
                    return def && (def.includes('valid English word') || def.includes('common English word'));
                });
                
                console.log(`\\n📊 Validation Results:`);
                console.log(`   Total puzzle words: ${allPuzzleWords.size}`);
                console.log(`   Missing definitions: ${missingDefs.length}`);
                console.log(`   Placeholder definitions: ${placeholderDefs.length}`);
                console.log(`   Complete definitions: ${allPuzzleWords.size - missingDefs.length - placeholderDefs.length}`);
                
                if (missingDefs.length > 0) {
                    console.log(`\\n❌ Words missing definitions:`, missingDefs.slice(0, 10).join(', '));
                    if (missingDefs.length > 10) console.log(`   ... and ${missingDefs.length - 10} more`);
                }
                
                return;
                
            default:
                console.error('❌ Invalid mode. Use --all-puzzles, --single-puzzle, --missing-only, or --validate');
                return;
        }
        
        const wordArray = Array.from(wordsToProcess).sort();
        console.log(`\\n🚀 Processing ${wordArray.length} words...\\n`);
        
        for (let i = 0; i < wordArray.length; i++) {
            const word = wordArray[i];
            console.log(`[${i+1}/${wordArray.length}] ${word}`);
            await this.fetchDefinition(word);
            
            // Progress checkpoint and rate limiting
            if ((i + 1) % 25 === 0) {
                await this.saveProgress();
                console.log(`\\n--- Progress: ${i+1}/${wordArray.length} ---`);
                console.log(`Cached: ${this.stats.cached}, Fetched: ${this.stats.fetched}, Failed: ${this.stats.failed}`);
                
                // Small delay to be nice to APIs
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        await this.saveProgress();
        this.printSummary();
    }

    async saveProgress() {
        const output = `// Enhanced definitions for puzzle words
// Generated on ${new Date().toISOString()}
// Stats: ${this.stats.fetched} fetched, ${this.stats.cached} cached, ${this.stats.failed} failed

const ENHANCED_DEFINITIONS = ${JSON.stringify(this.definitions, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ENHANCED_DEFINITIONS };
}

if (typeof window !== 'undefined') {
    window.ENHANCED_DEFINITIONS = ENHANCED_DEFINITIONS;
}`;

        fs.writeFileSync(this.options.output, output);
        this.log(`Progress saved to ${this.options.output}`);
    }

    printSummary() {
        console.log('\\n\\n✅ COMPLETE!');
        console.log(`📊 Summary:`);
        console.log(`   Total words processed: ${this.stats.total}`);
        console.log(`   Used cached definitions: ${this.stats.cached}`);
        console.log(`   Fetched new definitions: ${this.stats.fetched}`);
        console.log(`   Failed to fetch: ${this.stats.failed}`);
        console.log(`   Success rate: ${Math.round((this.stats.fetched / (this.stats.fetched + this.stats.failed)) * 100)}%`);
        console.log(`\\n📁 Output saved to: ${this.options.output}`);
    }
}

// Command line interface
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        mode: null,
        puzzleName: null,
        output: 'definitions-output.js',
        verbose: false,
        dryRun: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--all-puzzles':
                options.mode = 'all-puzzles';
                break;
            case '--single-puzzle':
                options.mode = 'single-puzzle';
                break;
            case '--missing-only':
                options.mode = 'missing-only';
                break;
            case '--validate':
                options.mode = 'validate';
                break;
            case '--puzzle':
                options.puzzleName = args[++i];
                break;
            case '--output':
                options.output = args[++i];
                break;
            case '--verbose':
                options.verbose = true;
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--help':
                console.log(`
Comprehensive Definition Fetcher

Usage: node scripts/definition-fetcher.js [mode] [options]

Modes:
  --all-puzzles     Fetch definitions for all words in all puzzles
  --single-puzzle   Fetch definitions for words in a specific puzzle
  --missing-only    Fetch definitions only for words without definitions
  --validate        Validate existing definitions and find gaps

Options:
  --puzzle <name>   Specify puzzle name (for single-puzzle mode)
  --output <file>   Output file path (default: definitions-output.js)
  --dry-run         Show what would be fetched without making API calls
  --verbose         Show detailed progress information
  --help            Show this help message

Examples:
  node scripts/definition-fetcher.js --all-puzzles --verbose
  node scripts/definition-fetcher.js --single-puzzle --puzzle CORNERSTONES
  node scripts/definition-fetcher.js --missing-only --output missing-defs.js
  node scripts/definition-fetcher.js --validate
                `);
                process.exit(0);
                break;
        }
    }
    
    return options;
}

// Main execution
async function main() {
    const options = parseArgs();
    
    if (!options.mode) {
        console.error('❌ No mode specified. Use --help for usage information.');
        process.exit(1);
    }
    
    console.log('🚀 Comprehensive Definition Fetcher\\n');
    
    loadGameData();
    
    const fetcher = new DefinitionFetcher(options);
    await fetcher.processMode(options.mode, options.puzzleName);
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { DefinitionFetcher, loadGameData };