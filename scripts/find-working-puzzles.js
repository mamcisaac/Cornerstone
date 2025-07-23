// Find working 12-letter seed words for creating new puzzles

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

// Get seed words from the file
const SEED_WORDS = require('./seed-words.js');
const seedWordList = Object.keys(SEED_WORDS);

console.log(`Testing ${seedWordList.length} seed words...\n`);

// Find working puzzles for each path
const workingPuzzles = {};
for (let pathIndex = 0; pathIndex < HAMILTONIAN_PATHS.length; pathIndex++) {
    workingPuzzles[pathIndex] = [];
}

// Test each word on each path
seedWordList.forEach(word => {
    for (let pathIndex = 0; pathIndex < HAMILTONIAN_PATHS.length; pathIndex++) {
        const path = HAMILTONIAN_PATHS[pathIndex];
        const grid = new Array(16).fill('');
        
        path.forEach((position, index) => {
            grid[position] = word[index];
        });
        
        const result = canFindWord(grid, ADJACENCY, word);
        
        if (result.found) {
            workingPuzzles[pathIndex].push({
                word,
                definition: SEED_WORDS[word].definition,
                path: result.path
            });
        }
    }
});

// Report results
console.log('WORKING PUZZLES BY PATH:\n');
for (let pathIndex = 0; pathIndex < HAMILTONIAN_PATHS.length; pathIndex++) {
    const puzzles = workingPuzzles[pathIndex];
    console.log(`Path ${pathIndex}: ${puzzles.length} working puzzles`);
    if (puzzles.length > 0) {
        console.log('  Examples:');
        puzzles.slice(0, 3).forEach(p => {
            console.log(`    - ${p.word}`);
        });
    }
}

// Find replacements for broken puzzles
console.log('\n\nREPLACEMENT SUGGESTIONS:');
console.log('ARCHITECTURE (Path 1) needs replacement. Options:');
const path1Options = workingPuzzles[1];
if (path1Options.length > 0) {
    path1Options.slice(0, 5).forEach(p => {
        console.log(`  - ${p.word}: ${p.definition}`);
    });
}

console.log('\nINTELLIGENCE (Path 5) needs replacement. Options:');
const path5Options = workingPuzzles[5];
if (path5Options.length > 0) {
    path5Options.slice(0, 5).forEach(p => {
        console.log(`  - ${p.word}: ${p.definition}`);
    });
}

// Create a complete new puzzle board
console.log('\n\nCREATING NEW PUZZLE BOARD:');
const newPuzzle = workingPuzzles[1][0]; // Take first working puzzle for path 1
if (newPuzzle) {
    console.log(`\nNew Puzzle: ${newPuzzle.word}`);
    console.log(`Definition: ${newPuzzle.definition}`);
    console.log(`Path Index: 1`);
    
    // Show grid layout
    const path = HAMILTONIAN_PATHS[1];
    const grid = new Array(16).fill('');
    path.forEach((position, index) => {
        grid[position] = newPuzzle.word[index];
    });
    
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
    
    console.log(`\nCan be found via path: ${newPuzzle.path.join(' -> ')}`);
}