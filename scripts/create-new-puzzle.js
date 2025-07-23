// Create a new puzzle to replace the broken ARCHITECTURE puzzle

const fs = require('fs');
const { WORD_SET: COMPREHENSIVE_WORD_SET } = require('./words-database.js');

// Grid configuration
const HAMILTONIAN_PATHS = [
    [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11],  // Path 0
    [4, 5, 9, 8, 13, 14, 11, 7, 6, 10, 2, 1],  // Path 1 - ARCHITECTURE's path
    [1, 2, 7, 11, 14, 13, 8, 4, 5, 6, 10, 9],  // Path 2
    [8, 13, 14, 10, 9, 5, 6, 11, 7, 2, 1, 4],  // Path 3
    [11, 10, 14, 13, 9, 8, 4, 5, 1, 2, 6, 7],  // Path 4
    [1, 2, 6, 5, 4, 8, 9, 10, 14, 13, 11, 7],  // Path 5
    [14, 13, 8, 9, 4, 5, 1, 2, 7, 6, 11, 10],  // Path 6
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

// New puzzle configuration
const NEW_PUZZLE = {
    name: "AVAILABILITY",
    seedWord: "AVAILABILITY",
    pathIndex: 1,
    definition: "The quality of being able to be used or obtained; accessibility"
};

// Create grid
const path = HAMILTONIAN_PATHS[NEW_PUZZLE.pathIndex];
const grid = new Array(16).fill('');
path.forEach((position, index) => {
    grid[position] = NEW_PUZZLE.seedWord[index];
});

console.log(`Creating puzzle: ${NEW_PUZZLE.name}`);
console.log(`Definition: ${NEW_PUZZLE.definition}`);
console.log('\nGrid Layout:');
for (let row = 0; row < 4; row++) {
    const rowStr = [];
    for (let col = 0; col < 4; col++) {
        const index = row * 4 + col;
        const letter = grid[index] || ' ';
        rowStr.push(letter);
    }
    console.log('  ' + rowStr.join(' '));
}

// Find all possible words
function findAllWords(grid, adjacency) {
    const words = new Set();
    
    // DFS from each position
    for (let start = 0; start < grid.length; start++) {
        if (grid[start]) {
            const visited = new Array(16).fill(false);
            dfs(start, '', visited);
        }
    }
    
    function dfs(pos, currentWord, visited) {
        if (!grid[pos]) return;
        
        visited[pos] = true;
        const newWord = currentWord + grid[pos];
        
        if (newWord.length >= 4 && COMPREHENSIVE_WORD_SET.has(newWord.toUpperCase())) {
            words.add(newWord.toUpperCase());
        }
        
        if (newWord.length < 12) {
            const neighbors = adjacency[pos] || [];
            for (const neighbor of neighbors) {
                if (!visited[neighbor] && grid[neighbor]) {
                    dfs(neighbor, newWord, [...visited]);
                }
            }
        }
    }
    
    return words;
}

console.log('\nFinding all possible words...');
const allWords = findAllWords(grid, ADJACENCY);
const wordArray = Array.from(allWords).sort((a, b) => b.length - a.length || a.localeCompare(b));

// Categorize words
const cornerstoneWords = wordArray.filter(w => w.length >= 7);
const validWords = wordArray.filter(w => w.length >= 4 && w.length < 7);

console.log(`\nTotal words found: ${wordArray.length}`);
console.log(`Cornerstone words (7+ letters): ${cornerstoneWords.length}`);
console.log(`Valid words (4-6 letters): ${validWords.length}`);

console.log('\nSample cornerstone words:');
cornerstoneWords.slice(0, 10).forEach(word => {
    console.log(`  - ${word} (${word.length} letters)`);
});

// Generate update for index.html
console.log('\n\nUPDATE FOR index.html:');
console.log('Replace this line:');
console.log('  "ARCHITECTURE": { seedWord: "ARCHITECTURE", pathIndex: 1 },');
console.log('With:');
console.log('  "AVAILABILITY": { seedWord: "AVAILABILITY", pathIndex: 1 },');

// Also check the second broken puzzle
console.log('\n\nFor INTELLIGENCE replacement, use:');
console.log('  "UNIVERSITIES": { seedWord: "UNIVERSITIES", pathIndex: 5 },');