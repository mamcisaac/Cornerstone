// Script to fetch definitions for all words in the Cornerstones puzzle
// This will create a comprehensive definitions file for the puzzle

const fs = require('fs');
const https = require('https');

// Load the word database
const WORDS_DB = require('./words-database.js');
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
                    
                    // If we get here, no valid definition was found
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

// Function to simulate the game's word finding process
function findAllPuzzleWords() {
    // Cornerstones puzzle grid
    const grid = ['C', 'O', 'R', 'N', 'E', 'R', 'S', 'T', 'O', 'N', 'E', 'S', '', '', '', ''];
    
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

// Main function to fetch all definitions
async function fetchAllDefinitions() {
    console.log('Finding all words in Cornerstones puzzle...');
    
    const allWords = findAllPuzzleWords();
    console.log(`Found ${allWords.length} total words to fetch definitions for`);
    
    const definitions = {};
    const failed = [];
    
    // Fetch definitions with rate limiting
    for (let i = 0; i < allWords.length; i++) {
        const word = allWords[i];
        console.log(`Fetching definition ${i + 1}/${allWords.length}: ${word}`);
        
        try {
            const definition = await fetchDefinitionFromAPI(word);
            
            if (definition) {
                definitions[word] = definition;
                console.log(`✓ ${word}: ${definition.substring(0, 50)}${definition.length > 50 ? '...' : ''}`);
            } else {
                failed.push(word);
                console.log(`✗ ${word}: No definition found`);
            }
        } catch (error) {
            failed.push(word);
            console.log(`✗ ${word}: Error - ${error.message}`);
        }
        
        // Rate limiting - wait 100ms between requests to be respectful to the API
        if (i < allWords.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    console.log(`\nCompleted! Successfully fetched ${Object.keys(definitions).length} definitions`);
    console.log(`Failed to fetch ${failed.length} definitions:`, failed);
    
    // Save the definitions to a file
    const output = `// Comprehensive definitions for all words in the Cornerstones puzzle
// Generated automatically from Dictionary API

const PUZZLE_DEFINITIONS = ${JSON.stringify(definitions, null, 2)};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PUZZLE_DEFINITIONS };
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.PUZZLE_DEFINITIONS = PUZZLE_DEFINITIONS;
}
`;
    
    fs.writeFileSync('cornerstones-definitions.js', output);
    console.log('\nDefinitions saved to cornerstones-definitions.js');
    
    // Also save failed words for manual review
    if (failed.length > 0) {
        const failedOutput = `// Words that failed to fetch definitions
// These may need manual definition entry or alternative lookup

const FAILED_DEFINITIONS = ${JSON.stringify(failed, null, 2)};

module.exports = { FAILED_DEFINITIONS };
`;
        fs.writeFileSync('failed-definitions.js', failedOutput);
        console.log('Failed words saved to failed-definitions.js');
    }
    
    return definitions;
}

// Run the script
if (require.main === module) {
    fetchAllDefinitions().catch(console.error);
}

module.exports = { fetchAllDefinitions, findAllPuzzleWords };