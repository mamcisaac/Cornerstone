// Script to find all 208 words in the Cornerstones puzzle using the exact game algorithm
const WORDS_DB = require('./words-database.js');
const WORD_SET = new Set(WORDS_DB.WORD_LIST);

function findAll208Words() {
    // Cornerstones puzzle grid - using the same cross-shaped layout as the game
    // Cross positions: 1,2,4,5,6,7,8,9,10,11,13,14
    // Empty positions: 0,3,12,15 (corners)
    const grid = ['', 'C', 'O', '', 'R', 'N', 'E', 'R', 'S', 'T', 'O', 'N', '', 'E', 'S', ''];
    
    // Cross-shaped adjacency matrix - copied exactly from the game
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
    
    // DFS function that matches the game exactly
    function dfsWordSearch(position, currentWord, path, visited) {
        visited[position] = true;
        const newWord = currentWord + grid[position];
        
        if (newWord.length >= 4 && WORD_SET.has(newWord.toUpperCase())) {
            allPossibleWords.add(newWord.toUpperCase());
        }
        
        // Continue searching up to 12 letters (to find seed words)
        if (newWord.length <= 12) {
            const neighbors = ADJACENCY[position] || [];
            neighbors.forEach(neighbor => {
                if (!visited[neighbor] && grid[neighbor]) {
                    dfsWordSearch(neighbor, newWord, [...path, neighbor], visited.slice());
                }
            });
        }
    }
    
    // Start DFS from each cross position (matching the game)
    const crossPositions = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14];
    for (const position of crossPositions) {
        dfsWordSearch(position, '', [position], new Array(16).fill(false));
    }
    
    return Array.from(allPossibleWords).sort();
}

// Run the script
const words = findAll208Words();
console.log(`Found ${words.length} words in Cornerstones puzzle (should be 208):`);

// Display in groups of 10 for easier reading
for (let i = 0; i < words.length; i += 10) {
    const group = words.slice(i, i + 10);
    console.log(`${String(i + 1).padStart(3, ' ')}-${String(Math.min(i + 10, words.length)).padStart(3, ' ')}: ${group.join(', ')}`);
}

console.log(`\nTotal: ${words.length} words`);

module.exports = { findAll208Words };