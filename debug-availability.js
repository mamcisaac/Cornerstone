// Debug script for AVAILABILITY puzzle
// This script simulates the game logic to identify the issue

// Simulate the Hamiltonian path and adjacency from constants.js
const HAMILTONIAN_PATHS = [
    [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11],  // Path 0
    [4, 5, 9, 8, 13, 14, 11, 7, 6, 10, 2, 1],  // Path 1 - AVAILABILITY
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

function generateGrid(seedWord, pathIndex) {
    console.log(`Generating grid for ${seedWord} using path ${pathIndex}`);
    
    const path = HAMILTONIAN_PATHS[pathIndex];
    const grid = Array(16).fill('');
    
    // Place letters along the Hamiltonian path
    for (let i = 0; i < seedWord.length && i < path.length; i++) {
        const position = path[i];
        grid[position] = seedWord[i];
    }
    
    return grid;
}

function findAllWords(grid, wordSet) {
    console.log('Finding all words in grid...');
    const validWords = new Set();
    
    // Try starting from each non-empty position
    for (let i = 0; i < grid.length; i++) {
        if (grid[i]) {
            dfs(grid, i, '', new Array(grid.length).fill(false), validWords, wordSet);
        }
    }
    
    return validWords;
}

function dfs(grid, position, currentWord, visited, validWords, wordSet) {
    if (!grid[position]) return;
    
    visited[position] = true;
    const newWord = currentWord + grid[position];
    
    // Check if this forms a valid word (4+ letters)
    if (newWord.length >= 4 && wordSet.has(newWord.toUpperCase())) {
        validWords.add(newWord.toUpperCase());
    }
    
    // Continue searching if word isn't too long
    if (newWord.length < 12) {
        const neighbors = ADJACENCY[position] || [];
        for (const neighbor of neighbors) {
            if (!visited[neighbor] && grid[neighbor]) {
                dfs(grid, neighbor, newWord, [...visited], validWords, wordSet);
            }
        }
    }
}

// Test the AVAILABILITY puzzle
function testAvailabilityPuzzle() {
    console.log('=== AVAILABILITY PUZZLE DEBUG ===\\n');
    
    const seedWord = 'AVAILABILITY';
    const pathIndex = 1;
    
    // Generate the grid
    const grid = generateGrid(seedWord, pathIndex);
    
    console.log('Generated grid:');
    console.log('Grid positions:', grid.map((cell, idx) => `${idx}:${cell || 'empty'}`).join(', '));
    
    // Show grid layout visually
    console.log('\\nGrid layout (4x4):');
    for (let row = 0; row < 4; row++) {
        let rowStr = '';
        for (let col = 0; col < 4; col++) {
            const idx = row * 4 + col;
            rowStr += (grid[idx] || '.').padEnd(2);
        }
        console.log(rowStr);
    }
    
    console.log('\\nPath used:', HAMILTONIAN_PATHS[pathIndex]);
    console.log('Letters placed:', seedWord.split('').map((letter, i) => `${letter}@${HAMILTONIAN_PATHS[pathIndex][i]}`).join(', '));
    
    // Create a simple word set for testing
    const testWords = new Set([
        'AVAILABILITY', 'ABILITY', 'VITAL', 'AVAILABLE', 'AVAIL', 'TAIL', 'BAIL', 'RAIL', 
        'LAY', 'BAY', 'BIT', 'LIT', 'TIL', 'AVA', 'VIAL', 'OVAL', 'LAVA', 'ITAL', 'TALI',
        'VILA', 'VAIL', 'BAIL', 'BALI', 'VITA', 'YALI', 'TILY', 'LILY', 'ALBI', 'ALBA'
    ]);
    
    console.log('\\nTesting word formation...');
    const foundWords = findAllWords(grid, testWords);
    
    console.log(`\\nFound ${foundWords.size} valid words:`);
    [...foundWords].sort().forEach(word => {
        console.log(`  ${word}`);
    });
    
    // Test specific words manually
    console.log('\\nManual word path testing:');
    const testSpecificWords = ['AVAILABILITY', 'ABILITY', 'VITAL', 'AVAIL', 'TAIL'];
    
    testSpecificWords.forEach(word => {
        const path = findWordPath(grid, word);
        if (path) {
            console.log(`  ${word}: FOUND - Path: ${path.join(' -> ')}`);
        } else {
            console.log(`  ${word}: NOT FOUND`);
        }
    });
    
    return { grid, foundWords };
}

function findWordPath(grid, targetWord) {
    const target = targetWord.toUpperCase();
    
    // Try starting from each position
    for (let i = 0; i < grid.length; i++) {
        if (grid[i] && grid[i].toUpperCase() === target[0]) {
            const path = findWordPathFromPosition(grid, target, i, []);
            if (path) return path;
        }
    }
    
    return null;
}

function findWordPathFromPosition(grid, targetWord, position, currentPath) {
    if (!grid[position]) return null;
    
    const newPath = [...currentPath, position];
    
    // Check if we've formed the complete word
    if (newPath.length === targetWord.length) {
        const formedWord = newPath.map(pos => grid[pos]).join('');
        return formedWord.toUpperCase() === targetWord ? newPath : null;
    }
    
    // If we still need more letters
    if (newPath.length < targetWord.length) {
        const nextLetter = targetWord[newPath.length];
        const neighbors = ADJACENCY[position] || [];
        
        for (const neighbor of neighbors) {
            if (!currentPath.includes(neighbor) && grid[neighbor] && 
                grid[neighbor].toUpperCase() === nextLetter) {
                const result = findWordPathFromPosition(grid, targetWord, neighbor, newPath);
                if (result) return result;
            }
        }
    }
    
    return null;
}

// Run the test
const result = testAvailabilityPuzzle();