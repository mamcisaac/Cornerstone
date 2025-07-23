// Script to fetch definitions for all words across all puzzles
// This creates a universal dictionary that works for any puzzle

const fs = require('fs');
const https = require('https');

// Load the word database and seed words
const WORDS_DB = require('./words-database.js');
const SEED_WORDS = require('./seed-words.js');
const WORD_SET = new Set(WORDS_DB.WORD_LIST);

// Function to fetch definition from Dictionary API
function fetchDefinitionFromAPI(word) {
    return new Promise((resolve, reject) => {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    
                    if (jsonData && Array.isArray(jsonData) && jsonData.length > 0) {
                        const entry = jsonData[0];
                        if (entry.meanings && entry.meanings.length > 0) {
                            const firstMeaning = entry.meanings[0];
                            if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
                                let definition = firstMeaning.definitions[0].definition;
                                
                                // Clean up the definition
                                definition = definition.charAt(0).toUpperCase() + definition.slice(1);
                                if (!definition.endsWith('.')) {
                                    definition += '.';
                                }
                                
                                resolve(definition);
                                return;
                            }
                        }
                    }
                    
                    resolve(null);
                } catch (error) {
                    console.warn(`Failed to parse API response for "${word}":`, error.message);
                    resolve(null);
                }
            });
        }).on('error', (error) => {
            console.warn(`API request failed for "${word}":`, error.message);
            resolve(null);
        });
    });
}

// Function to find all words in a given puzzle
function findAllWordsInPuzzle(seedWord) {
    const grid = seedWord.split('').concat(new Array(16 - seedWord.length).fill(''));
    
    // Adjacency matrix for 4x4 grid
    const ADJACENCY = {
        0: [1, 4, 5],
        1: [0, 2, 4, 5, 6],
        2: [1, 3, 5, 6, 7],
        3: [2, 6, 7],
        4: [0, 1, 5, 8, 9],
        5: [0, 1, 2, 4, 6, 8, 9, 10],
        6: [1, 2, 3, 5, 7, 9, 10, 11],
        7: [2, 3, 6, 10, 11],
        8: [4, 5, 9, 12, 13],
        9: [4, 5, 6, 8, 10, 12, 13, 14],
        10: [5, 6, 7, 9, 11, 13, 14, 15],
        11: [6, 7, 10, 14, 15],
        12: [8, 9, 13],
        13: [8, 9, 10, 12, 14],
        14: [9, 10, 11, 13, 15],
        15: [10, 11, 14]
    };
    
    const allPossibleWords = new Set();
    
    // DFS function to find words
    function dfsWordSearch(position, currentWord, visited) {
        visited[position] = true;
        const newWord = currentWord + grid[position];
        
        if (newWord.length >= 4 && WORD_SET.has(newWord.toUpperCase())) {
            allPossibleWords.add(newWord.toUpperCase());
        }
        
        // Continue searching up to 12 letters
        if (newWord.length <= 12) {
            const neighbors = ADJACENCY[position] || [];
            neighbors.forEach(neighbor => {
                if (!visited[neighbor] && grid[neighbor]) {
                    dfsWordSearch(neighbor, newWord, visited.slice());
                }
            });
        }
    }
    
    // Start DFS from each position
    for (let i = 0; i < 16; i++) {
        if (grid[i]) {
            dfsWordSearch(i, '', new Array(16).fill(false));
        }
    }
    
    return Array.from(allPossibleWords);
}

// Main function to fetch definitions for words needed across all puzzles
async function fetchUniversalDefinitions() {
    console.log('Finding all words across all puzzles...');
    
    // Get all seed words - limit to first 3 for testing
    const allSeedWords = Object.keys(SEED_WORDS);
    const seedWords = allSeedWords.slice(0, 3); // Test with first 3 puzzles
    console.log(`Processing ${seedWords.length} puzzles (testing):`, seedWords);
    console.log(`(Full list has ${allSeedWords.length} puzzles)`);
    
    // Collect all unique words across all puzzles
    const allUniqueWords = new Set();
    
    for (const seedWord of seedWords) {
        console.log(`Finding words in ${seedWord} puzzle...`);
        const wordsInPuzzle = findAllWordsInPuzzle(seedWord);
        console.log(`  Found ${wordsInPuzzle.length} words`);
        
        wordsInPuzzle.forEach(word => allUniqueWords.add(word));
    }
    
    const wordList = Array.from(allUniqueWords).sort();
    console.log(`\nTotal unique words across all puzzles: ${wordList.length}`);
    
    // Fetch definitions with rate limiting
    const definitions = {};
    const failed = [];
    let successCount = 0;
    
    for (let i = 0; i < wordList.length; i++) {
        const word = wordList[i];
        console.log(`Fetching definition ${i + 1}/${wordList.length}: ${word}`);
        
        try {
            const definition = await fetchDefinitionFromAPI(word);
            
            if (definition) {
                definitions[word] = definition;
                successCount++;
                console.log(`✓ ${word}: ${definition.substring(0, 60)}${definition.length > 60 ? '...' : ''}`);
            } else {
                failed.push(word);
                console.log(`✗ ${word}: No definition found`);
            }
        } catch (error) {
            failed.push(word);
            console.log(`✗ ${word}: Error - ${error.message}`);
        }
        
        // Rate limiting - wait 200ms between requests to avoid hitting limits
        if (i < wordList.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Progress checkpoint every 50 words
        if ((i + 1) % 50 === 0) {
            console.log(`\n--- Progress: ${i + 1}/${wordList.length} (${successCount} successful) ---\n`);
        }
    }
    
    console.log(`\n🎉 Completed! Successfully fetched ${successCount} definitions`);
    console.log(`📝 Failed to fetch ${failed.length} definitions`);
    
    // Save the universal definitions
    const output = `// Universal word definitions for all Cornerstones puzzles
// Generated automatically from Dictionary API
// Contains ${successCount} definitions across all puzzle words

const UNIVERSAL_DEFINITIONS = ${JSON.stringify(definitions, null, 2)};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UNIVERSAL_DEFINITIONS };
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.UNIVERSAL_DEFINITIONS = UNIVERSAL_DEFINITIONS;
}
`;
    
    fs.writeFileSync('universal-definitions.js', output);
    console.log(`\n📁 Universal definitions saved to universal-definitions.js`);
    
    // Save failed words for manual review or retry
    if (failed.length > 0) {
        const failedOutput = `// Words that failed to fetch definitions across all puzzles
// Total: ${failed.length} words
// These may need manual definition entry or alternative lookup

const FAILED_UNIVERSAL_DEFINITIONS = ${JSON.stringify(failed, null, 2)};

module.exports = { FAILED_UNIVERSAL_DEFINITIONS };
`;
        fs.writeFileSync('failed-universal-definitions.js', failedOutput);
        console.log(`📁 Failed words saved to failed-universal-definitions.js`);
    }
    
    // Create summary report
    const summary = {
        totalPuzzles: seedWords.length,
        puzzles: seedWords,
        totalUniqueWords: wordList.length,
        definitionsFetched: successCount,
        definitionsFailed: failed.length,
        successRate: `${Math.round((successCount / wordList.length) * 100)}%`,
        generatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync('definition-fetch-summary.json', JSON.stringify(summary, null, 2));
    console.log(`📊 Summary report saved to definition-fetch-summary.json`);
    
    return definitions;
}

// Run the script
if (require.main === module) {
    fetchUniversalDefinitions().catch(console.error);
}

module.exports = { fetchUniversalDefinitions, findAllWordsInPuzzle };