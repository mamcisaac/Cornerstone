const fs = require('fs');
const path = require('path');
const { CORNERSTONE_WORDS_SET } = require('../src/data/cornerstone-words.js');

// Load words from the compact database  
const wordDbContent = fs.readFileSync(path.join(__dirname, '../src/data/words-database-compact.js'), 'utf8');
const wordListMatch = wordDbContent.match(/const WORD_LIST_STRING = "([^"]+)"/);
const WORDS_ARRAY = wordListMatch ? wordListMatch[1].split('|') : [];
const VALID_WORDS_SET = new Set(WORDS_ARRAY.map(w => w.toLowerCase()));

// Import constants from the game
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

const MIN_CORNERSTONE_WORDS = 20;

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

function analyzePuzzle(seedWord, pathIndex) {
    const grid = getLettersFromSeedWord(seedWord, pathIndex);
    const allWords = findWordsInGrid(grid);
    
    const cornerstoneWords = [];
    const otherWords = [];
    
    allWords.forEach(word => {
        if (CORNERSTONE_WORDS_SET.has(word.toLowerCase())) {
            cornerstoneWords.push(word);
        } else {
            otherWords.push(word);
        }
    });
    
    return {
        seedWord,
        pathIndex,
        grid,
        totalWords: allWords.size,
        cornerstoneWords: cornerstoneWords.sort(),
        cornerstoneCount: cornerstoneWords.length,
        otherWords: otherWords.sort(),
        otherCount: otherWords.length,
        isValid: cornerstoneWords.length >= MIN_CORNERSTONE_WORDS
    };
}

function findBestPathForWord(seedWord) {
    let bestResult = null;
    
    for (let pathIndex = 0; pathIndex < HAMILTONIAN_PATHS.length; pathIndex++) {
        const result = analyzePuzzle(seedWord, pathIndex);
        
        if (!bestResult || result.cornerstoneCount > bestResult.cornerstoneCount) {
            bestResult = result;
        }
    }
    
    return bestResult;
}

// Real function for fetching definitions from Dictionary API
async function fetchDefinition(word) {
    const https = require('https');
    
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

async function createPuzzleWithDefinitions(seedWord, pathIndex = null) {
    console.log(`\n🔍 Analyzing puzzle: ${seedWord}`);
    
    // If no specific path provided, find the best one
    let result;
    if (pathIndex !== null) {
        result = analyzePuzzle(seedWord, pathIndex);
    } else {
        result = findBestPathForWord(seedWord);
        console.log(`📊 Best path found: ${result.pathIndex}`);
    }
    
    console.log(`📈 Statistics:`);
    console.log(`   • Total words: ${result.totalWords}`);
    console.log(`   • Cornerstone words: ${result.cornerstoneCount}`);
    console.log(`   • Other words: ${result.otherCount}`);
    console.log(`   • Valid puzzle: ${result.isValid ? '✅' : '❌'}`);
    
    if (!result.isValid) {
        console.log(`⚠️  Warning: Only ${result.cornerstoneCount} cornerstone words (need ${MIN_CORNERSTONE_WORDS}+)`);
    }
    
    // Fetch definitions for all words
    console.log(`\n📚 Fetching definitions for ${result.totalWords} words...`);
    const definitions = {};
    const allWords = [...result.cornerstoneWords, ...result.otherWords];
    
    // In batches to avoid overwhelming APIs
    const batchSize = 10;
    for (let i = 0; i < allWords.length; i += batchSize) {
        const batch = allWords.slice(i, i + batchSize);
        const batchPromises = batch.map(async word => {
            try {
                const definition = await fetchDefinition(word);
                definitions[word] = definition;
                return { word, success: true };
            } catch (error) {
                console.warn(`Failed to fetch definition for ${word}:`, error.message);
                definitions[word] = `A valid English word: ${word.toLowerCase()}`;
                return { word, success: false };
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        const successful = batchResults.filter(r => r.success).length;
        console.log(`   Batch ${Math.floor(i/batchSize) + 1}: ${successful}/${batch.length} definitions fetched`);
        
        // Small delay to be respectful to APIs
        if (i + batchSize < allWords.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    const puzzleData = {
        seedWord: result.seedWord,
        pathIndex: result.pathIndex,
        grid: result.grid,
        statistics: {
            totalWords: result.totalWords,
            cornerstoneCount: result.cornerstoneCount,
            otherCount: result.otherCount,
            isValid: result.isValid
        },
        cornerstoneWords: result.cornerstoneWords,
        otherWords: result.otherWords,
        definitions: definitions,
        createdAt: new Date().toISOString()
    };
    
    // Save puzzle data
    const filename = `puzzle-${seedWord.toLowerCase()}-${Date.now()}.json`;
    const outputPath = path.join(__dirname, '../puzzles', filename);
    
    // Ensure puzzles directory exists
    const puzzlesDir = path.dirname(outputPath);
    if (!fs.existsSync(puzzlesDir)) {
        fs.mkdirSync(puzzlesDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(puzzleData, null, 2));
    console.log(`\n💾 Puzzle data saved to: ${filename}`);
    
    return puzzleData;
}

// Command line interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node create-validated-puzzle.js <SEED_WORD> [PATH_INDEX]');
        console.log('');
        console.log('Examples:');
        console.log('  node create-validated-puzzle.js RELATIONSHIP');
        console.log('  node create-validated-puzzle.js CONVERSATION 3');
        console.log('');
        console.log('This script will:');
        console.log('• Validate the puzzle has 20+ cornerstone words');
        console.log('• Find the best Hamiltonian path if none specified');
        console.log('• Fetch definitions for all words in the puzzle');
        console.log('• Save complete puzzle data to JSON file');
        return;
    }
    
    const seedWord = args[0].toUpperCase();
    const pathIndex = args[1] ? parseInt(args[1]) : null;
    
    if (seedWord.length !== 12) {
        console.error('❌ Seed word must be exactly 12 letters');
        process.exit(1);
    }
    
    if (pathIndex !== null && (pathIndex < 0 || pathIndex >= HAMILTONIAN_PATHS.length)) {
        console.error(`❌ Path index must be between 0 and ${HAMILTONIAN_PATHS.length - 1}`);
        process.exit(1);
    }
    
    try {
        await createPuzzleWithDefinitions(seedWord, pathIndex);
        console.log('\n✅ Puzzle creation completed successfully!');
    } catch (error) {
        console.error('\n❌ Error creating puzzle:', error.message);
        process.exit(1);
    }
}

// Export functions for use by other scripts
module.exports = {
    analyzePuzzle,
    findBestPathForWord,
    createPuzzleWithDefinitions,
    MIN_CORNERSTONE_WORDS
};

// Run if called directly
if (require.main === module) {
    main();
}