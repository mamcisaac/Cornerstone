// Script to extract all cornerstone words from the 10 puzzles in index.html

// Puzzle configuration from index.html
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

// Mock the word validation sets for this analysis
// In the actual game, these are loaded from external files
const COMPREHENSIVE_WORD_SET = new Set(); // Would be loaded from words-database-compact.js
const CORNERSTONE_WORDS_SET = new Set(); // Would be loaded from cornerstone-words.js

// For this extraction, we'll collect the theoretical cornerstone words
// based on the algorithm without actually validating them

function generateGrid(seedWord, pathIndex) {
    const path = HAMILTONIAN_PATHS[pathIndex];
    const letters = seedWord.split('');
    const grid = new Array(16).fill('');
    
    path.forEach((position, index) => {
        grid[position] = letters[index];
    });
    
    return grid;
}

function findAllPossiblePaths(grid) {
    const paths = [];
    
    function dfsWordSearch(position, currentWord, path, visited) {
        visited[position] = true;
        const newWord = currentWord + grid[position];
        
        if (newWord.length >= 4 && newWord.length <= 12) {
            paths.push({
                word: newWord.toUpperCase(),
                path: [...path]
            });
        }
        
        if (newWord.length < 12) {
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
    
    return paths;
}

// Process each puzzle
console.log('Analyzing all 10 puzzles from index.html...\n');
console.log('Note: This shows all possible word patterns. In the actual game,');
console.log('only words that exist in the word database and are in the cornerstone words list');
console.log('would be marked as cornerstone words.\n');

const allPuzzleData = [];

Object.entries(SAMPLE_PUZZLES).forEach(([name, puzzle]) => {
    const grid = generateGrid(puzzle.seedWord, puzzle.pathIndex);
    const paths = findAllPossiblePaths(grid);
    
    console.log(`\n${name} (${puzzle.seedWord}):`);
    console.log(`- Grid positions used: ${HAMILTONIAN_PATHS[puzzle.pathIndex].join(', ')}`);
    console.log(`- Total possible word patterns: ${paths.length}`);
    
    // Group by word length
    const byLength = {};
    paths.forEach(({word}) => {
        const len = word.length;
        if (!byLength[len]) byLength[len] = [];
        byLength[len].push(word);
    });
    
    // Show distribution
    console.log(`- Word length distribution:`);
    Object.keys(byLength).sort((a, b) => a - b).forEach(len => {
        console.log(`  ${len} letters: ${byLength[len].length} patterns`);
    });
    
    allPuzzleData.push({
        puzzle: name,
        seedWord: puzzle.seedWord,
        pathIndex: puzzle.pathIndex,
        totalPatterns: paths.length,
        patterns: paths
    });
});

console.log('\n\nSummary:');
console.log('========');
console.log('These are the 10 puzzles defined in SAMPLE_PUZZLES:');
Object.entries(SAMPLE_PUZZLES).forEach(([name, puzzle], index) => {
    console.log(`${index + 1}. ${name} - Seed word: "${puzzle.seedWord}"`);
});

console.log('\n\nIMPORTANT NOTE:');
console.log('===============');
console.log('In the actual game, cornerstone words are determined by:');
console.log('1. Finding all valid 4+ letter words that can be formed by connecting adjacent letters');
console.log('2. Checking if those words exist in the comprehensive word database');
console.log('3. Marking as "cornerstone" only those that are in the cornerstone words list');
console.log('\nWithout access to the word databases, we cannot determine the exact cornerstone words,');
console.log('but the above analysis shows all possible word patterns that could be formed in each puzzle.');