// Test if ARCHITECTURE can be spelled along the given path

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

// Test ARCHITECTURE on path 1
const word = "ARCHITECTURE";
const path = HAMILTONIAN_PATHS[1]; // Path index 1

console.log(`Testing "${word}" on path index 1:`);
console.log(`Path: ${path.join(' -> ')}`);

// Place letters on grid
const grid = new Array(16).fill('');
path.forEach((position, index) => {
    grid[position] = word[index];
});

// Show the grid
console.log('\nGrid layout:');
for (let row = 0; row < 4; row++) {
    const rowStr = [];
    for (let col = 0; col < 4; col++) {
        const index = row * 4 + col;
        const letter = grid[index] || ' ';
        rowStr.push(letter);
    }
    console.log(rowStr.join(' '));
}

// Check if the word can be found by traversing adjacency
console.log('\nChecking if word can be found through adjacency...');

function canFindWord(grid, adjacency, targetWord) {
    // Try starting from each position that has the first letter
    const firstLetter = targetWord[0];
    const startPositions = [];
    
    for (let i = 0; i < grid.length; i++) {
        if (grid[i] === firstLetter) {
            startPositions.push(i);
        }
    }
    
    console.log(`Start positions with '${firstLetter}': ${startPositions}`);
    
    for (const start of startPositions) {
        const visited = new Array(16).fill(false);
        const path = [];
        
        if (dfs(start, 0, visited, path)) {
            console.log(`Found word! Path: ${path.join(' -> ')}`);
            return true;
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
        
        // Backtrack
        visited[pos] = false;
        path.pop();
        return false;
    }
    
    return false;
}

const canFind = canFindWord(grid, ADJACENCY, word);
console.log(`\nCan find "${word}": ${canFind}`);

// Check what valid positions are in the cross
const CROSS_POSITIONS = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14];
console.log('\nChecking path validity:');
for (let i = 0; i < path.length; i++) {
    const pos = path[i];
    const isValid = CROSS_POSITIONS.includes(pos);
    console.log(`Position ${pos} (letter '${word[i]}'): ${isValid ? 'VALID' : 'INVALID'}`);
}