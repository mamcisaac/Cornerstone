// Simple script to extract cornerstone words from all puzzles
const fs = require('fs');

// Load common words
const { COMMON_WORDS_LIST } = require('./common-words.js');
const COMMON_WORDS_SET = new Set(COMMON_WORDS_LIST.map(w => w.toLowerCase()));

// Load all valid words
const WORDS_4PLUS = fs.readFileSync('./words_4plus.txt', 'utf8')
    .split('\n')
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length >= 4);
const VALID_WORDS_SET = new Set(WORDS_4PLUS);

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

function findCornerstoneWords(grid, maxWords = 100) {
    const cornerstoneWords = new Set();
    let wordsChecked = 0;
    
    function dfsWordSearch(position, currentWord, visited) {
        if (wordsChecked >= maxWords) return;
        
        visited[position] = true;
        const newWord = currentWord + grid[position];
        
        if (newWord.length >= 4 && newWord.length <= 12) {
            wordsChecked++;
            const lowerWord = newWord.toLowerCase();
            if (VALID_WORDS_SET.has(lowerWord) && COMMON_WORDS_SET.has(lowerWord)) {
                cornerstoneWords.add(newWord.toUpperCase());
            }
        }
        
        if (newWord.length < 12) {
            const neighbors = ADJACENCY[position] || [];
            neighbors.forEach(neighbor => {
                if (!visited[neighbor] && grid[neighbor] && wordsChecked < maxWords) {
                    dfsWordSearch(neighbor, newWord, visited.slice());
                }
            });
        }
    }
    
    // Start from each position
    [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14].forEach(startPos => {
        if (wordsChecked < maxWords) {
            const visited = new Array(16).fill(false);
            dfsWordSearch(startPos, '', visited);
        }
    });
    
    return Array.from(cornerstoneWords);
}

// Process each puzzle and collect all unique cornerstone words
const allCornerstoneWords = new Set();

console.log('Finding cornerstone words in each puzzle (sampling first 100 word patterns per puzzle)...\n');

Object.entries(SAMPLE_PUZZLES).forEach(([name, puzzle]) => {
    const grid = generateGrid(puzzle.seedWord, puzzle.pathIndex);
    const cornerstoneWords = findCornerstoneWords(grid);
    
    console.log(`${name}: Found ${cornerstoneWords.length} cornerstone words (sample)`);
    cornerstoneWords.forEach(word => allCornerstoneWords.add(word));
});

console.log('\n=== UNIQUE CORNERSTONE WORDS FOUND ===');
console.log(`Total unique cornerstone words found: ${allCornerstoneWords.size}`);
console.log('\nAll cornerstone words (alphabetically):');
const sortedWords = Array.from(allCornerstoneWords).sort();
sortedWords.forEach(word => console.log(word));