const { CORNERSTONE_WORDS_SET } = require('../src/data/cornerstone-words.js');

// Load words from the compact database  
const fs = require('fs');
const path = require('path');
const wordDbContent = fs.readFileSync(path.join(__dirname, '../src/data/words-database-compact.js'), 'utf8');
const wordListMatch = wordDbContent.match(/const WORD_LIST_STRING = "([^"]+)"/);
const WORDS_ARRAY = wordListMatch ? wordListMatch[1].split('|') : [];

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
    const validWordsSet = new Set(WORDS_ARRAY.map(w => w.toLowerCase()));
    
    function dfs(position, visited, currentWord) {
        if (currentWord.length >= 4 && validWordsSet.has(currentWord.toLowerCase())) {
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

// Check each puzzle
console.log('Cornerstone words per puzzle:');
console.log('============================');

const puzzleList = Object.keys(SAMPLE_PUZZLES).sort();
let totalCornerstones = 0;
let minCornerstones = Infinity;
let maxCornerstones = 0;

puzzleList.forEach(seedWord => {
    const config = SAMPLE_PUZZLES[seedWord];
    const grid = getLettersFromSeedWord(config.seedWord, config.pathIndex);
    const allWords = findWordsInGrid(grid);
    
    // Count cornerstone words
    let cornerstoneCount = 0;
    const cornerstoneWords = [];
    allWords.forEach(word => {
        if (CORNERSTONE_WORDS_SET.has(word.toLowerCase())) {
            cornerstoneCount++;
            cornerstoneWords.push(word);
        }
    });
    
    totalCornerstones += cornerstoneCount;
    minCornerstones = Math.min(minCornerstones, cornerstoneCount);
    maxCornerstones = Math.max(maxCornerstones, cornerstoneCount);
    
    console.log(`${seedWord}: ${cornerstoneCount} cornerstone words (out of ${allWords.size} total)`);
});

console.log('============================');
console.log(`Total puzzles: ${puzzleList.length}`);
console.log(`Average: ${(totalCornerstones / puzzleList.length).toFixed(1)} cornerstone words per puzzle`);
console.log(`Minimum: ${minCornerstones} cornerstone words`);
console.log(`Maximum: ${maxCornerstones} cornerstone words`);