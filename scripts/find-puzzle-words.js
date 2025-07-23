// Script to find all possible words in each puzzle
const fs = require('fs');

// Load the word validator
const wordsDatabase = require('../src/data/words-database-compact.js');
const COMPREHENSIVE_WORD_SET = wordsDatabase.COMPREHENSIVE_WORD_SET || wordsDatabase.WORD_SET;
const cornerstoneWords = require('../src/data/cornerstone-words.js');
const CORNERSTONE_WORDS_SET = new Set(Object.keys(cornerstoneWords.CORNERSTONE_WORDS).map(w => w.toLowerCase()));

// Puzzle configuration
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

function generateGrid(seedWord, pathIndex) {
    const path = HAMILTONIAN_PATHS[pathIndex];
    const letters = seedWord.split('');
    const grid = new Array(16).fill('');
    
    path.forEach((position, index) => {
        grid[position] = letters[index];
    });
    
    return grid;
}

function findAllWords(grid) {
    const allWords = new Set();
    const cornerstoneWords = new Set();
    
    function dfsWordSearch(position, currentWord, path, visited) {
        visited[position] = true;
        const newWord = currentWord + grid[position];
        
        if (newWord.length >= 4 && COMPREHENSIVE_WORD_SET.has(newWord.toUpperCase())) {
            const upperWord = newWord.toUpperCase();
            allWords.add(upperWord);
            if (CORNERSTONE_WORDS_SET.has(newWord.toLowerCase())) {
                cornerstoneWords.add(upperWord);
            }
        }
        
        if (newWord.length <= 12) {
            const neighbors = ADJACENCY[position] || [];
            neighbors.forEach(neighbor => {
                if (!visited[neighbor] && grid[neighbor]) {
                    dfsWordSearch(neighbor, newWord, [...path, neighbor], visited.slice());
                }
            });
        }
    }
    
    // Start from each position
    [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14].forEach(startPos => {
        const visited = new Array(16).fill(false);
        dfsWordSearch(startPos, '', [startPos], visited);
    });
    
    return { allWords: Array.from(allWords), cornerstoneWords: Array.from(cornerstoneWords) };
}

// Process each puzzle
const allCornerstoneWords = new Set();

console.log('Finding all words in each puzzle...\n');

Object.entries(SAMPLE_PUZZLES).forEach(([name, puzzle]) => {
    const grid = generateGrid(puzzle.seedWord, puzzle.pathIndex);
    const { allWords, cornerstoneWords } = findAllWords(grid);
    
    console.log(`${name}:`);
    console.log(`- Total words: ${allWords.length}`);
    console.log(`- Cornerstone words: ${cornerstoneWords.length}`);
    console.log(`- Cornerstone words found: ${cornerstoneWords.sort().join(', ')}`);
    console.log('');
    
    // Add to global set
    cornerstoneWords.forEach(word => allCornerstoneWords.add(word));
});

console.log(`\nTotal unique cornerstone words across all puzzles: ${allCornerstoneWords.size}`);
console.log('\nAll cornerstone words:');
const sortedWords = Array.from(allCornerstoneWords).sort();
sortedWords.forEach(word => console.log(word));

// Save to file for next step
fs.writeFileSync('cornerstone-words-to-define.json', JSON.stringify(sortedWords, null, 2));
console.log('\nSaved to cornerstone-words-to-define.json');