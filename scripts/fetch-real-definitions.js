const fs = require('fs');
const path = require('path');
const https = require('https');
const { CORNERSTONE_WORDS_SET } = require('../src/data/cornerstone-words.js');

// Load words from the compact database  
const wordDbContent = fs.readFileSync(path.join(__dirname, '../src/data/words-database-compact.js'), 'utf8');
const wordListMatch = wordDbContent.match(/const WORD_LIST_STRING = "([^"]+)"/);
const WORDS_ARRAY = wordListMatch ? wordListMatch[1].split('|') : [];
const VALID_WORDS_SET = new Set(WORDS_ARRAY.map(w => w.toLowerCase()));

// Game constants
const ADJACENCY = {
    1: [2, 4, 5, 6], 2: [1, 5, 6, 7], 4: [1, 5, 8, 9], 5: [1, 2, 4, 6, 8, 9, 10],
    6: [1, 2, 5, 7, 9, 10, 11], 7: [2, 6, 10, 11], 8: [4, 5, 9, 13], 9: [4, 5, 6, 8, 10, 13, 14],
    10: [5, 6, 7, 9, 11, 13, 14], 11: [6, 7, 10, 14], 13: [8, 9, 10, 14], 14: [9, 10, 11, 13]
};

const HAMILTONIAN_PATHS = [
    [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11], [4, 5, 9, 8, 13, 14, 11, 7, 6, 10, 2, 1],
    [1, 2, 7, 11, 14, 13, 8, 4, 5, 6, 10, 9], [5, 1, 2, 6, 10, 14, 13, 9, 8, 4, 7, 11],
    [11, 7, 2, 1, 5, 9, 13, 14, 10, 6, 4, 8], [8, 4, 5, 1, 6, 2, 7, 11, 14, 10, 9, 13],
    [9, 5, 4, 8, 13, 14, 10, 6, 1, 2, 7, 11], [14, 13, 9, 10, 11, 7, 6, 2, 1, 5, 4, 8],
    [2, 1, 4, 5, 9, 8, 13, 14, 11, 10, 6, 7], [7, 11, 10, 14, 9, 13, 8, 4, 5, 1, 2, 6]
];

const SAMPLE_PUZZLES = {
    "CORNERSTONES": { seedWord: "CORNERSTONES", pathIndex: 0 },
    "EXPERIMENTAL": { seedWord: "EXPERIMENTAL", pathIndex: 2 },
    "TECHNOLOGIES": { seedWord: "TECHNOLOGIES", pathIndex: 3 },
    "BREAKTHROUGH": { seedWord: "BREAKTHROUGH", pathIndex: 9 },
    "THANKSGIVING": { seedWord: "THANKSGIVING", pathIndex: 7 },
    "ENCYCLOPEDIA": { seedWord: "ENCYCLOPEDIA", pathIndex: 2 },
    "UNIVERSITIES": { seedWord: "UNIVERSITIES", pathIndex: 9 },
    "DEVELOPMENTS": { seedWord: "DEVELOPMENTS", pathIndex: 2 },
    "RELATIONSHIP": { seedWord: "RELATIONSHIP", pathIndex: 0 },
    "CONVERSATION": { seedWord: "CONVERSATION", pathIndex: 3 }
};

function getLettersFromSeedWord(seedWord, pathIndex) {
    const path = HAMILTONIAN_PATHS[pathIndex];
    const letters = {};
    for (let i = 0; i < seedWord.length; i++) {
        letters[path[i]] = seedWord[i];
    }
    return letters;
}

function findWordsInGrid(grid) {
    const words = new Set();
    
    function dfs(position, visited, currentWord) {
        if (currentWord.length >= 4 && VALID_WORDS_SET.has(currentWord.toLowerCase())) {
            words.add(currentWord.toUpperCase());
        }
        
        if (currentWord.length < 12) {
            const neighbors = ADJACENCY[position] || [];
            for (const next of neighbors) {
                if (!visited.has(next) && grid[next]) {
                    visited.add(next);
                    dfs(next, visited, currentWord + grid[next]);
                    visited.delete(next);
                }
            }
        }
    }
    
    for (const pos of Object.keys(grid)) {
        const visited = new Set([parseInt(pos)]);
        dfs(parseInt(pos), visited, grid[pos]);
    }
    
    return words;
}

// Datamuse API fetching function - more reliable than dictionaryapi.dev
async function fetchDefinitionFromAPI(word) {
    return new Promise((resolve, reject) => {
        const url = `https://api.datamuse.com/words?sp=${encodeURIComponent(word.toLowerCase())}&md=d&max=1`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const parsed = JSON.parse(data);
                        if (parsed && parsed.length > 0 && parsed[0].defs && parsed[0].defs.length > 0) {
                            // Datamuse returns definitions with part of speech prefix like "n\tdefinition"
                            const fullDef = parsed[0].defs[0];
                            const definition = fullDef.includes('\t') ? fullDef.split('\t')[1] : fullDef;
                            if (definition && definition.length > 5) {
                                resolve(definition);
                                return;
                            }
                        }
                    }
                    reject(new Error(`No definition found for ${word}`));
                } catch (error) {
                    reject(new Error(`Parse error for ${word}: ${error.message}`));
                }
            });
        }).on('error', (error) => {
            reject(new Error(`Network error for ${word}: ${error.message}`));
        });
    });
}

async function fetchRealDefinitions() {
    console.log('🔍 Collecting all puzzle words...\n');
    
    const allWords = new Set();
    
    // Collect all words from all puzzles
    for (const [puzzleName, config] of Object.entries(SAMPLE_PUZZLES)) {
        const grid = getLettersFromSeedWord(config.seedWord, config.pathIndex);
        const words = findWordsInGrid(grid);
        words.forEach(word => allWords.add(word));
        console.log(`${puzzleName}: ${words.size} words`);
    }
    
    console.log(`\n📊 Total unique words: ${allWords.size}\n`);
    
    const sortedWords = Array.from(allWords).sort();
    const definitions = {};
    const failed = [];
    
    console.log('📚 Fetching REAL definitions from Dictionary API...\n');
    
    let completed = 0;
    const batchSize = 3; // Small batch size to be respectful
    
    for (let i = 0; i < sortedWords.length; i += batchSize) {
        const batch = sortedWords.slice(i, i + batchSize);
        
        // Process batch sequentially to avoid overwhelming the API
        for (const word of batch) {
            try {
                const definition = await fetchDefinitionFromAPI(word);
                definitions[word] = definition;
                console.log(`✅ ${word}: ${definition.substring(0, 60)}...`);
            } catch (error) {
                failed.push(word);
                definitions[word] = `A valid English word: ${word.toLowerCase()}`;
                console.log(`❌ ${word}: ${error.message}`);
            }
            
            completed++;
            
            // Rate limiting - be very respectful
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const percentage = Math.round((completed / sortedWords.length) * 100);
        console.log(`\nProgress: ${completed}/${sortedWords.length} (${percentage}%) - Success: ${completed - failed.length}, Failed: ${failed.length}\n`);
    }
    
    console.log(`\n🎉 Definition fetching complete!`);
    console.log(`   • Successfully fetched: ${completed - failed.length}`);
    console.log(`   • Failed/fallbacks: ${failed.length}`);
    
    // Load existing definitions to merge
    const existingDefs = loadExistingDefinitions();
    const mergedDefinitions = { ...existingDefs, ...definitions };
    
    // Sort definitions alphabetically
    const sortedDefs = {};
    Object.keys(mergedDefinitions).sort().forEach(key => {
        sortedDefs[key] = mergedDefinitions[key];
    });
    
    // Generate the new file content
    const newContent = generateDefinitionsFile(sortedDefs);
    
    // Backup and write
    const defPath = path.join(__dirname, '../src/data/word-definitions.js');
    const backupPath = path.join(__dirname, '../src/data/word-definitions.js.backup.' + Date.now());
    
    if (fs.existsSync(defPath)) {
        fs.copyFileSync(defPath, backupPath);
        console.log(`📋 Backed up existing definitions to: ${path.basename(backupPath)}`);
    }
    
    fs.writeFileSync(defPath, newContent);
    console.log(`✅ Updated word-definitions.js with ${Object.keys(sortedDefs).length} definitions`);
    
    return {
        totalWords: allWords.size,
        successfulFetches: completed - failed.length,
        failed: failed.length,
        definitions: Object.keys(sortedDefs).length
    };
}

function loadExistingDefinitions() {
    try {
        const defPath = path.join(__dirname, '../src/data/word-definitions.js');
        const content = fs.readFileSync(defPath, 'utf8');
        
        // Simple extraction of existing definitions
        const match = content.match(/const COMMON_DEFINITIONS = \{([\s\S]*?)\};/);
        if (match) {
            const defsText = match[1];
            const definitions = {};
            
            // Extract key-value pairs using regex
            const regex = /"([^"]+)":\s*"([^"]*(?:\\.[^"]*)*)"/g;
            let regexMatch;
            
            while ((regexMatch = regex.exec(defsText)) !== null) {
                const key = regexMatch[1];
                const value = regexMatch[2].replace(/\\"/g, '"'); // Unescape quotes
                definitions[key] = value;
            }
            
            return definitions;
        }
    } catch (error) {
        console.warn('Could not load existing definitions:', error.message);
    }
    
    return {};
}

function generateDefinitionsFile(definitions) {
    return `// Real word definitions fetched from Dictionary API
// Auto-generated on ${new Date().toISOString()}
// Contains ${Object.keys(definitions).length} definitions

const COMMON_DEFINITIONS = {
${Object.entries(definitions).map(([word, def]) => 
    `    "${word}": "${def.replace(/"/g, '\\"')}"`
).join(',\n')}
};

// Async function to get definitions with API fallback
async function fetchDefinitionFromAPI(word) {
    try {
        const response = await fetch(\`https://api.dictionaryapi.dev/api/v2/entries/en/\${encodeURIComponent(word.toLowerCase())}\`);
        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0 && data[0].meanings && data[0].meanings.length > 0) {
                return data[0].meanings[0].definitions[0]?.definition || null;
            }
        }
    } catch (error) {
        console.warn('API fetch failed for', word, error);
    }
    return null;
}

async function getDefinition(word) {
    const upperWord = word.toUpperCase();
    
    // Check local definitions first
    if (COMMON_DEFINITIONS[upperWord]) {
        return COMMON_DEFINITIONS[upperWord];
    }
    
    // Try API as fallback
    const apiDef = await fetchDefinitionFromAPI(word);
    if (apiDef) {
        return apiDef;
    }
    
    // Ultimate fallback
    return \`A valid English word: \${word.toLowerCase()}\`;
}

function getDefinitionSync(word) {
    const upperWord = word.toUpperCase();
    return COMMON_DEFINITIONS[upperWord] || \`A valid English word: \${word.toLowerCase()}\`;
}

// Enhanced definition with context-aware responses
function enhanceDefinitionWithLLM(word, basicDef) {
    if (basicDef.includes('A valid English word:')) {
        const length = word.length;
        if (length <= 4) {
            return "A short English word";
        } else if (length <= 6) {
            return "A common English word";
        } else {
            return "A longer English word";
        }
    }
    return basicDef;
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.getDefinition = getDefinition;
    window.getDefinitionSync = getDefinitionSync;
    window.fetchDefinitionFromAPI = fetchDefinitionFromAPI;
    window.enhanceDefinitionWithLLM = enhanceDefinitionWithLLM;
    window.WORD_DEFINITIONS = COMMON_DEFINITIONS; // For backward compatibility
    window.COMMON_DEFINITIONS = COMMON_DEFINITIONS;
}

// Export for use in the game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { COMMON_DEFINITIONS, getDefinition, getDefinitionSync, fetchDefinitionFromAPI, enhanceDefinitionWithLLM };
}`;
}

// Run the script
if (require.main === module) {
    fetchRealDefinitions().catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}

module.exports = { fetchRealDefinitions };