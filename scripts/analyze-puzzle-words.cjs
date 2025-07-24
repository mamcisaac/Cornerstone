// Analyze all puzzle words to identify missing definitions
// This script generates grids for all 12 puzzles and finds all possible words
const fs = require('fs');
const path = require('path');

// Import the game data
const SAMPLE_PUZZLES = {
    "ARCHITECTURE": { seedWord: "ARCHITECTURE", pathIndex: 6 },
    "BREAKTHROUGH": { seedWord: "BREAKTHROUGH", pathIndex: 9 },
    "CORNERSTONES": { seedWord: "CORNERSTONES", pathIndex: 0 },
    "DEVELOPMENTS": { seedWord: "DEVELOPMENTS", pathIndex: 2 },
    "ENCYCLOPEDIA": { seedWord: "ENCYCLOPEDIA", pathIndex: 2 },
    "EXPERIMENTAL": { seedWord: "EXPERIMENTAL", pathIndex: 2 },
    "PRESENTATION": { seedWord: "PRESENTATION", pathIndex: 0 },
    "PROFESSIONAL": { seedWord: "PROFESSIONAL", pathIndex: 5 },
    "REGISTRATION": { seedWord: "REGISTRATION", pathIndex: 0 },
    "RELATIONSHIP": { seedWord: "RELATIONSHIP", pathIndex: 0 },
    "THANKSGIVING": { seedWord: "THANKSGIVING", pathIndex: 7 },
    "UNIVERSITIES": { seedWord: "UNIVERSITIES", pathIndex: 9 }
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

// WordFinder class (adapted from the game)
class WordFinder {
    constructor(wordSet) {
        this.wordSet = wordSet || new Set();
    }

    // Find all possible words in a grid using DFS
    findAllWords(grid) {
        const validWords = new Set();
        
        // Try starting from each non-empty position
        for (let i = 0; i < grid.length; i++) {
            if (grid[i]) {
                this.dfs(grid, i, '', new Array(grid.length).fill(false), validWords);
            }
        }
        
        return validWords;
    }

    // Depth-first search to find words
    dfs(grid, position, currentWord, visited, validWords) {
        if (!grid[position]) return;
        
        visited[position] = true;
        const newWord = currentWord + grid[position];
        
        // Check if this forms a valid word (4+ letters)
        if (newWord.length >= 4 && this.wordSet.has(newWord.toUpperCase())) {
            validWords.add(newWord.toUpperCase());
        }
        
        // Continue searching if word isn't too long
        if (newWord.length < 12) {
            const neighbors = ADJACENCY[position] || [];
            for (const neighbor of neighbors) {
                if (!visited[neighbor] && grid[neighbor]) {
                    this.dfs(grid, neighbor, newWord, [...visited], validWords);
                }
            }
        }
    }
}

// Function to generate grid from seed word and path
function generateGrid(seedWord, pathIndex) {
    const grid = new Array(16).fill('');
    const path = HAMILTONIAN_PATHS[pathIndex];
    
    for (let i = 0; i < seedWord.length; i++) {
        grid[path[i]] = seedWord[i];
    }
    
    return grid;
}

// Load word databases
function loadWordDatabases() {
    console.log('Loading word databases...');
    
    // Load comprehensive word set
    const comprehensiveWordsPath = path.join(__dirname, 'src/data/words-database-compact.js');
    const comprehensiveWordsContent = fs.readFileSync(comprehensiveWordsPath, 'utf8');
    
    // Extract the word list string from the file - it's in WORD_LIST_STRING format
    const wordListMatch = comprehensiveWordsContent.match(/WORD_LIST_STRING\s*=\s*"([^"]+)"/);
    if (!wordListMatch) {
        throw new Error('Could not find WORD_LIST_STRING in the file');
    }
    
    // Parse the pipe-separated words
    const wordsString = wordListMatch[1];
    const words = wordsString.split('|');
    const comprehensiveWordSet = new Set(words);
    
    console.log(`Loaded ${comprehensiveWordSet.size} words from comprehensive database`);
    
    // Load cornerstone words - we can actually just require the module since it exports
    const cornerstoneWordsPath = path.join(__dirname, 'src/data/cornerstone-words.js');
    
    // Since this is a CommonJS file and we're in Node.js, we need to manually extract the array
    const cornerstoneWordsContent = fs.readFileSync(cornerstoneWordsPath, 'utf8');
    
    // Extract the words array
    const cornerstoneMatch = cornerstoneWordsContent.match(/COMMON_WORDS_LIST\s*=\s*\[(.*?)\]/s);
    if (!cornerstoneMatch) {
        throw new Error('Could not find COMMON_WORDS_LIST in the file');
    }
    
    const cornerstoneWordsString = cornerstoneMatch[1];
    const cornerstoneWords = cornerstoneWordsString.match(/"([^"]+)"/g).map(word => word.slice(1, -1));
    const cornerstoneWordSet = new Set(cornerstoneWords.map(word => word.toLowerCase()));
    
    console.log(`Loaded ${cornerstoneWordSet.size} cornerstone words`);
    
    return { comprehensiveWordSet, cornerstoneWordSet };
}

// Load existing definitions
function loadExistingDefinitions() {
    console.log('Loading existing definitions...');
    
    const definitionsPath = path.join(__dirname, 'src/data/word-definitions.js');
    const definitionsContent = fs.readFileSync(definitionsPath, 'utf8');
    
    // Extract the definitions object
    const definitionsMatch = definitionsContent.match(/COMMON_DEFINITIONS\s*=\s*\{(.*?)\}/s);
    if (!definitionsMatch) {
        throw new Error('Could not find COMMON_DEFINITIONS in the file');
    }
    
    // Parse the definitions to get just the keys (words)
    const definitionsString = definitionsMatch[1];
    const existingWords = new Set();
    
    // Match all quoted keys
    const keyMatches = definitionsString.match(/"([^"]+)":/g);
    if (keyMatches) {
        keyMatches.forEach(match => {
            const word = match.slice(1, -2); // Remove quotes and colon
            existingWords.add(word);
        });
    }
    
    console.log(`Found ${existingWords.size} existing definitions`);
    return existingWords;
}

// Main analysis function
async function analyzePuzzleWords() {
    console.log('Starting puzzle word analysis...');
    
    try {
        // Load word databases
        const { comprehensiveWordSet, cornerstoneWordSet } = loadWordDatabases();
        const existingDefinitions = loadExistingDefinitions();
        
        // Initialize word finder
        const wordFinder = new WordFinder(comprehensiveWordSet);
        
        const allPuzzleWords = new Set();
        const puzzleAnalysis = {};
        
        // Analyze each puzzle
        console.log('\nAnalyzing each puzzle...');
        for (const [puzzleName, puzzleData] of Object.entries(SAMPLE_PUZZLES)) {
            console.log(`\nAnalyzing puzzle: ${puzzleName}`);
            
            // Generate grid
            const grid = generateGrid(puzzleData.seedWord, puzzleData.pathIndex);
            console.log(`Grid: ${grid.filter(cell => cell).join('')}`);
            
            // Find all words in this puzzle
            const puzzleWords = wordFinder.findAllWords(grid);
            console.log(`Found ${puzzleWords.size} words in ${puzzleName}`);
            
            // Categorize words
            const cornerstoneWords = [];
            const otherWords = [];
            
            puzzleWords.forEach(word => {
                allPuzzleWords.add(word);
                if (cornerstoneWordSet.has(word.toLowerCase())) {
                    cornerstoneWords.push(word);
                } else {
                    otherWords.push(word);
                }
            });
            
            puzzleAnalysis[puzzleName] = {
                seedWord: puzzleData.seedWord,
                pathIndex: puzzleData.pathIndex,
                totalWords: puzzleWords.size,
                cornerstoneWords: cornerstoneWords.sort(),
                otherWords: otherWords.sort(),
                allWords: Array.from(puzzleWords).sort()
            };
            
            console.log(`  - Cornerstone words: ${cornerstoneWords.length}`);
            console.log(`  - Other words: ${otherWords.length}`);
        }
        
        // Find missing definitions
        console.log(`\nTotal unique words across all puzzles: ${allPuzzleWords.size}`);
        
        const wordsNeedingDefinitions = [];
        const wordsWithDefinitions = [];
        
        allPuzzleWords.forEach(word => {
            if (existingDefinitions.has(word)) {
                wordsWithDefinitions.push(word);
            } else {
                wordsNeedingDefinitions.push(word);
            }
        });
        
        console.log(`Words with existing definitions: ${wordsWithDefinitions.length}`);
        console.log(`Words needing definitions: ${wordsNeedingDefinitions.length}`);
        
        // Sort the words needing definitions
        wordsNeedingDefinitions.sort();
        
        // Generate summary report
        const summary = {
            timestamp: new Date().toISOString(),
            totalPuzzles: Object.keys(SAMPLE_PUZZLES).length,
            totalUniqueWords: allPuzzleWords.size,
            wordsWithDefinitions: wordsWithDefinitions.length,
            wordsNeedingDefinitions: wordsNeedingDefinitions.length,
            missingDefinitionWords: wordsNeedingDefinitions,
            puzzleAnalysis: puzzleAnalysis
        };
        
        // Save results
        const outputPath = path.join(__dirname, 'puzzle-words-analysis.json');
        fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
        console.log(`\nAnalysis saved to: ${outputPath}`);
        
        // Also save just the missing words list for easy use
        const missingWordsPath = path.join(__dirname, 'words-needing-definitions.json');
        fs.writeFileSync(missingWordsPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            count: wordsNeedingDefinitions.length,
            words: wordsNeedingDefinitions
        }, null, 2));
        console.log(`Missing words list saved to: ${missingWordsPath}`);
        
        // Print summary
        console.log('\n=== ANALYSIS SUMMARY ===');
        console.log(`Total puzzles analyzed: ${Object.keys(SAMPLE_PUZZLES).length}`);
        console.log(`Total unique words found: ${allPuzzleWords.size}`);
        console.log(`Words with existing definitions: ${wordsWithDefinitions.length}`);
        console.log(`Words needing definitions: ${wordsNeedingDefinitions.length}`);
        
        if (wordsNeedingDefinitions.length > 0) {
            console.log('\nWords that need definitions:');
            wordsNeedingDefinitions.forEach((word, index) => {
                console.log(`${index + 1}. ${word}`);
            });
        } else {
            console.log('\n✅ All puzzle words have definitions!');
        }
        
        return summary;
        
    } catch (error) {
        console.error('Error during analysis:', error);
        throw error;
    }
}

// Run the analysis
if (require.main === module) {
    analyzePuzzleWords()
        .then(summary => {
            console.log('\n✅ Analysis completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Analysis failed:', error);
            process.exit(1);
        });
}

module.exports = { analyzePuzzleWords, SAMPLE_PUZZLES, HAMILTONIAN_PATHS };