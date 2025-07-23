// Analyze all existing puzzles to see which ones work

const HAMILTONIAN_PATHS = [
    [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11],  // Path 0
    [4, 5, 9, 8, 13, 14, 11, 7, 6, 10, 2, 1],  // Path 1
    [1, 2, 7, 11, 14, 13, 8, 4, 5, 6, 10, 9],  // Path 2
    [8, 13, 14, 10, 9, 5, 6, 11, 7, 2, 1, 4],  // Path 3
    [11, 10, 14, 13, 9, 8, 4, 5, 1, 2, 6, 7],  // Path 4
    [1, 2, 6, 5, 4, 8, 9, 10, 14, 13, 11, 7],  // Path 5
    [14, 13, 8, 9, 4, 5, 1, 2, 7, 6, 11, 10],  // Path 6
    [14, 13, 9, 10, 11, 7, 6, 2, 1, 5, 4, 8],  // Path 7
    [2, 1, 4, 5, 9, 8, 13, 14, 11, 10, 6, 7],  // Path 8
    [7, 11, 10, 14, 9, 13, 8, 4, 5, 1, 2, 6]   // Path 9
];

const SAMPLE_PUZZLES = {
    "CORNERSTONES": { seedWord: "CORNERSTONES", pathIndex: 0 },
    "ARCHITECTURE": { seedWord: "ARCHITECTURE", pathIndex: 1 },
    "EXPERIMENTAL": { seedWord: "EXPERIMENTAL", pathIndex: 2 },
    "TECHNOLOGIES": { seedWord: "TECHNOLOGIES", pathIndex: 3 },
    "CHAMPIONSHIP": { seedWord: "CHAMPIONSHIP", pathIndex: 4 },
    "INTELLIGENCE": { seedWord: "INTELLIGENCE", pathIndex: 5 },
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

function canFindWord(grid, adjacency, targetWord) {
    const firstLetter = targetWord[0];
    const startPositions = [];
    
    for (let i = 0; i < grid.length; i++) {
        if (grid[i] === firstLetter) {
            startPositions.push(i);
        }
    }
    
    for (const start of startPositions) {
        const visited = new Array(16).fill(false);
        const path = [];
        
        if (dfs(start, 0, visited, path)) {
            return { found: true, path };
        }
    }
    
    function dfs(pos, letterIndex, visited, path) {
        if (grid[pos] !== targetWord[letterIndex]) {
            return false;
        }
        
        visited[pos] = true;
        path.push(pos);
        
        if (letterIndex === targetWord.length - 1) {
            return true;
        }
        
        const neighbors = adjacency[pos] || [];
        for (const neighbor of neighbors) {
            if (!visited[neighbor]) {
                if (dfs(neighbor, letterIndex + 1, visited, path)) {
                    return true;
                }
            }
        }
        
        visited[pos] = false;
        path.pop();
        return false;
    }
    
    return { found: false, path: [] };
}

console.log('ANALYZING ALL PUZZLES:\n');

Object.entries(SAMPLE_PUZZLES).forEach(([name, puzzle]) => {
    const path = HAMILTONIAN_PATHS[puzzle.pathIndex];
    const grid = new Array(16).fill('');
    
    path.forEach((position, index) => {
        grid[position] = puzzle.seedWord[index];
    });
    
    const result = canFindWord(grid, ADJACENCY, puzzle.seedWord);
    
    console.log(`${name} (${puzzle.seedWord}):`);
    console.log(`  Path Index: ${puzzle.pathIndex}`);
    console.log(`  Can Find: ${result.found ? 'YES' : 'NO'}`);
    if (result.found) {
        console.log(`  Found Path: ${result.path.join(' -> ')}`);
    }
    console.log('');
});

// Now let's look for 12-letter words that WOULD work
console.log('\n\nFINDING VALID 12-LETTER SEED WORDS:\n');

const { SEED_WORDS } = require('./seed-words.js');
const twelveLetterWords = Object.keys(SEED_WORDS).filter(word => word.length === 12);

console.log(`Total 12-letter words available: ${twelveLetterWords.length}`);

// Test a few promising words on different paths
const testWords = twelveLetterWords.slice(0, 20); // Test first 20

let workingPuzzles = [];

testWords.forEach(word => {
    for (let pathIndex = 0; pathIndex < HAMILTONIAN_PATHS.length; pathIndex++) {
        const path = HAMILTONIAN_PATHS[pathIndex];
        const grid = new Array(16).fill('');
        
        path.forEach((position, index) => {
            grid[position] = word[index];
        });
        
        const result = canFindWord(grid, ADJACENCY, word);
        
        if (result.found) {
            workingPuzzles.push({
                word,
                pathIndex,
                path: result.path
            });
            console.log(`✓ ${word} works on path ${pathIndex}`);
            break; // Found a working path for this word
        }
    }
});

console.log(`\n\nFound ${workingPuzzles.length} working puzzles from ${testWords.length} tested words.`);