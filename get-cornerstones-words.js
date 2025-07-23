// Script to find all words in the Cornerstones puzzle
const WORDS_DB = require('./words-database.js');
const WORD_SET = new Set(WORDS_DB.WORD_LIST);

function findAllCornerstonesWords() {
    // Cross-shaped grid layout (same as the game)
    // Positions used: [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14]
    // Positions 0, 3, 12, 15 are empty (corners of 4x4 grid)
    const grid = new Array(16).fill('');
    
    // CORNERSTONES puzzle using Hamiltonian path 0: [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11]
    const path = [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11];
    const letters = 'CORNERSTONES'.split('');
    
    // Place letters according to the Hamiltonian path
    path.forEach((position, index) => {
        grid[position] = letters[index];
    });
    
    // Cross-shaped adjacency matrix (same as the game)
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
    
    const allPossibleWords = new Set();
    
    // DFS function to find words
    function dfsWordSearch(position, currentWord, visited) {
        visited[position] = true;
        const newWord = currentWord + grid[position];
        
        if (newWord.length >= 4 && WORD_SET.has(newWord.toUpperCase())) {
            allPossibleWords.add(newWord.toUpperCase());
        }
        
        // Continue searching up to 12 letters
        if (newWord.length <= 12) {
            const neighbors = ADJACENCY[position] || [];
            neighbors.forEach(neighbor => {
                if (!visited[neighbor] && grid[neighbor]) {
                    dfsWordSearch(neighbor, newWord, visited.slice());
                }
            });
        }
    }
    
    // Start DFS from each cross position (same as the game)
    const CROSS_POSITIONS = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14];
    
    CROSS_POSITIONS.forEach(startPos => {
        dfsWordSearch(startPos, '', new Array(16).fill(false));
    });
    
    return Array.from(allPossibleWords).sort();
}

// Helper function to visualize the grid
function printGrid() {
    const grid = new Array(16).fill('');
    const path = [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11];
    const letters = 'CORNERSTONES'.split('');
    
    path.forEach((position, index) => {
        grid[position] = letters[index];
    });
    
    console.log('Cross-shaped grid layout:');
    console.log(`  ${grid[0] || '·'} ${grid[1] || '·'} ${grid[2] || '·'} ${grid[3] || '·'}`);
    console.log(`  ${grid[4] || '·'} ${grid[5] || '·'} ${grid[6] || '·'} ${grid[7] || '·'}`);
    console.log(`  ${grid[8] || '·'} ${grid[9] || '·'} ${grid[10] || '·'} ${grid[11] || '·'}`);
    console.log(`  ${grid[12] || '·'} ${grid[13] || '·'} ${grid[14] || '·'} ${grid[15] || '·'}`);
    console.log();
}

// Run the script
printGrid();
const words = findAllCornerstonesWords();
console.log(`Found ${words.length} words in Cornerstones puzzle:`);
words.forEach((word, index) => {
    console.log(`${index + 1}. ${word}`);
});

console.log(`\nTotal: ${words.length} words`);

module.exports = { findAllCornerstonesWords };