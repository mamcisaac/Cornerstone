const fs = require('fs');
const path = require('path');
const https = require('https');
const { CORNERSTONE_WORDS_SET } = require('../src/data/cornerstone-words.js');

// Load words from the compact database  
const wordDbContent = fs.readFileSync(path.join(__dirname, '../src/data/words-database-compact.js'), 'utf8');
const wordListMatch = wordDbContent.match(/const WORD_LIST_STRING = "([^"]+)"/);
const WORDS_ARRAY = wordListMatch ? wordListMatch[1].split('|') : [];
const VALID_WORDS_SET = new Set(WORDS_ARRAY.map(w => w.toLowerCase()));

// Import constants
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

const HAMILTONIAN_PATHS = [
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

// Free Dictionary API - no API key required
async function fetchDefinitionFromAPI(word) {
    return new Promise((resolve, reject) => {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const parsed = JSON.parse(data);
                        if (parsed && parsed.length > 0 && parsed[0].meanings && parsed[0].meanings.length > 0) {
                            const firstMeaning = parsed[0].meanings[0];
                            const definition = firstMeaning.definitions[0]?.definition || 'No definition available';
                            resolve(definition);
                        } else {
                            reject(new Error('No definition found'));
                        }
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}`));
                    }
                } catch (error) {
                    reject(new Error('Failed to parse response'));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Alternative fallback using WordsAPI (if you have a key)
async function fetchFromWordsAPI(word) {
    // You would need to sign up for RapidAPI and get a key
    // const options = {
    //     method: 'GET',
    //     hostname: 'wordsapiv1.p.rapidapi.com',
    //     port: null,
    //     path: `/words/${encodeURIComponent(word.toLowerCase())}`,
    //     headers: {
    //         'X-RapidAPI-Key': 'YOUR_API_KEY_HERE',
    //         'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
    //     }
    // };
    
    throw new Error('WordsAPI not configured');
}

async function fetchDefinitionWithFallbacks(word) {
    const fallbacks = [
        () => fetchDefinitionFromAPI(word),
        // () => fetchFromWordsAPI(word), // Uncomment if you have API key
    ];
    
    for (const fetchFn of fallbacks) {
        try {
            const definition = await fetchFn();
            if (definition && definition.length > 10) { // Basic quality check
                return definition;
            }
        } catch (error) {
            // Continue to next fallback
        }
    }
    
    // Ultimate fallback - check if it's in our existing definitions
    const existingDefs = loadExistingDefinitions();
    if (existingDefs[word.toUpperCase()]) {
        return existingDefs[word.toUpperCase()];
    }
    
    return `A valid English word: ${word.toLowerCase()}`;
}

function loadExistingDefinitions() {
    try {
        const defPath = path.join(__dirname, '../src/data/word-definitions.js');
        const content = fs.readFileSync(defPath, 'utf8');
        
        // Extract the COMMON_DEFINITIONS object
        const match = content.match(/const COMMON_DEFINITIONS = \{([\s\S]*?)\};/);
        if (match) {
            // This is a simplified parser - in production you'd want something more robust
            const defsText = match[1];
            const definitions = {};
            
            // Parse key-value pairs (simplified)
            const lines = defsText.split('\n');
            let currentKey = null;
            let currentValue = '';
            
            for (const line of lines) {
                const keyMatch = line.match(/^\s*"([^"]+)":\s*"(.*)$/);
                if (keyMatch) {
                    if (currentKey) {
                        definitions[currentKey] = currentValue.replace(/",?\s*$/, '');
                    }
                    currentKey = keyMatch[1];
                    currentValue = keyMatch[2];
                } else if (currentKey && line.includes('"')) {
                    currentValue += ' ' + line.trim().replace(/^"|",?\s*$/g, '');
                }
            }
            
            if (currentKey) {
                definitions[currentKey] = currentValue.replace(/",?\s*$/, '');
            }
            
            return definitions;
        }
    } catch (error) {
        console.warn('Could not load existing definitions:', error.message);
    }
    
    return {};
}

async function fetchAllPuzzleDefinitions() {
    console.log('🔍 Analyzing all puzzles and collecting words...\n');
    
    const allWords = new Set();
    const puzzleStats = [];
    
    // Collect all words from all puzzles
    for (const [puzzleName, config] of Object.entries(SAMPLE_PUZZLES)) {
        const grid = getLettersFromSeedWord(config.seedWord, config.pathIndex);
        const words = findWordsInGrid(grid);
        
        words.forEach(word => allWords.add(word));
        puzzleStats.push({
            name: puzzleName,
            totalWords: words.size,
            words: Array.from(words).sort()
        });
        
        console.log(`${puzzleName}: ${words.size} words`);
    }
    
    console.log(`\n📊 Total unique words across all puzzles: ${allWords.size}\n`);
    
    // Fetch definitions for all unique words
    console.log('📚 Fetching definitions from Dictionary API...\n');
    
    const definitions = {};
    const failed = [];
    const sortedWords = Array.from(allWords).sort();
    
    let completed = 0;
    const batchSize = 5; // Small batch to be respectful to the API
    
    for (let i = 0; i < sortedWords.length; i += batchSize) {
        const batch = sortedWords.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (word) => {
            try {
                const definition = await fetchDefinitionWithFallbacks(word);
                definitions[word] = definition;
                return { word, success: true };
            } catch (error) {
                failed.push(word);
                definitions[word] = `A valid English word: ${word.toLowerCase()}`;
                return { word, success: false };
            }
        });
        
        await Promise.all(batchPromises);
        completed += batch.length;
        
        const percentage = Math.round((completed / sortedWords.length) * 100);
        process.stdout.write(`Progress: ${completed}/${sortedWords.length} (${percentage}%) - Success: ${Object.keys(definitions).length - failed.length}, Failed: ${failed.length}\r`);
        
        // Rate limiting - be respectful to the API
        if (i + batchSize < sortedWords.length) {
            await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
        }
    }
    
    console.log(`\n\n✅ Definition fetching complete!`);
    console.log(`   • Successfully fetched: ${Object.keys(definitions).length - failed.length}`);
    console.log(`   • Failed/fallbacks: ${failed.length}`);
    
    // Update the word-definitions.js file
    console.log('\n💾 Updating word-definitions.js...\n');
    
    const existingDefs = loadExistingDefinitions();
    const mergedDefinitions = { ...existingDefs, ...definitions };
    
    // Sort definitions alphabetically
    const sortedDefs = {};
    Object.keys(mergedDefinitions).sort().forEach(key => {
        sortedDefs[key] = mergedDefinitions[key];
    });
    
    // Generate the new file content
    const newContent = `// Enhanced word definitions for all puzzle words
// Auto-generated on ${new Date().toISOString()}
// Contains ${Object.keys(sortedDefs).length} definitions

const COMMON_DEFINITIONS = {
${Object.entries(sortedDefs).map(([word, def]) => 
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

// Enhanced definition with AI-like responses
function enhanceDefinitionWithLLM(word, basicDef) {
    // This could be enhanced with actual LLM calls
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

    // Backup the existing file
    const defPath = path.join(__dirname, '../src/data/word-definitions.js');
    const backupPath = path.join(__dirname, '../src/data/word-definitions.js.backup.' + Date.now());
    
    if (fs.existsSync(defPath)) {
        fs.copyFileSync(defPath, backupPath);
        console.log(`📋 Backed up existing definitions to: ${path.basename(backupPath)}`);
    }
    
    // Write the new file
    fs.writeFileSync(defPath, newContent);
    console.log(`✅ Updated word-definitions.js with ${Object.keys(sortedDefs).length} definitions`);
    
    // Generate summary report
    const report = {
        timestamp: new Date().toISOString(),
        totalWords: allWords.size,
        totalDefinitions: Object.keys(sortedDefs).length,
        successfulFetches: Object.keys(definitions).length - failed.length,
        fallbacks: failed.length,
        puzzleStats,
        failedWords: failed.slice(0, 20), // First 20 failed words
        sampleDefinitions: Object.entries(sortedDefs).slice(0, 10).reduce((obj, [k, v]) => {
            obj[k] = v;
            return obj;
        }, {})
    };
    
    const reportPath = path.join(__dirname, '../puzzle-definitions-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Generated report: ${path.basename(reportPath)}`);
    
    console.log('\n🎉 All puzzle definitions updated successfully!');
    
    return report;
}

// Command line interface
if (require.main === module) {
    fetchAllPuzzleDefinitions().catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}

module.exports = { fetchAllPuzzleDefinitions, fetchDefinitionWithFallbacks };