const { CORNERSTONE_WORDS_SET } = require('../src/data/cornerstone-words.js');

// Load words from the compact database  
const fs = require('fs');
const path = require('path');
const wordDbContent = fs.readFileSync(path.join(__dirname, '../src/data/words-database-compact.js'), 'utf8');
const wordListMatch = wordDbContent.match(/const WORD_LIST_STRING = "([^"]+)"/);
const WORDS_ARRAY = wordListMatch ? wordListMatch[1].split('|') : [];
const VALID_WORDS_SET = new Set(WORDS_ARRAY.map(w => w.toLowerCase()));

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

// Existing invalid puzzles to try different paths
const INVALID_PUZZLES = [
    { word: "AVAILABILITY", current: 2, pathIndex: 1 },
    { word: "ENCYCLOPEDIA", current: 6, pathIndex: 8 },
    { word: "CHAMPIONSHIP", current: 9, pathIndex: 4 },
    { word: "UNIVERSITIES", current: 10, pathIndex: 5 },
    { word: "NEIGHBORHOOD", current: 12, pathIndex: 6 }
];

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
    
    function dfs(position, visited, currentWord) {
        if (currentWord.length >= 4 && VALID_WORDS_SET.has(currentWord.toLowerCase())) {
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

function countCornerstoneWords(words) {
    let count = 0;
    words.forEach(word => {
        if (CORNERSTONE_WORDS_SET.has(word.toLowerCase())) {
            count++;
        }
    });
    return count;
}

console.log('Testing different paths for invalid puzzles...\n');

// Test each invalid puzzle with all paths
INVALID_PUZZLES.forEach(puzzle => {
    console.log(`\n${puzzle.word} (currently ${puzzle.current} cornerstone words with path ${puzzle.pathIndex}):`);
    console.log('=' .repeat(60));
    
    let bestPath = -1;
    let bestCount = 0;
    let pathResults = [];
    
    for (let pathIndex = 0; pathIndex < HAMILTONIAN_PATHS.length; pathIndex++) {
        const grid = getLettersFromSeedWord(puzzle.word, pathIndex);
        const allWords = findWordsInGrid(grid);
        const cornerstoneCount = countCornerstoneWords(allWords);
        
        pathResults.push({
            path: pathIndex,
            cornerstone: cornerstoneCount,
            total: allWords.size
        });
        
        if (cornerstoneCount > bestCount) {
            bestCount = cornerstoneCount;
            bestPath = pathIndex;
        }
    }
    
    // Sort by cornerstone count
    pathResults.sort((a, b) => b.cornerstone - a.cornerstone);
    
    // Show top 3 results
    console.log('Top 3 paths:');
    pathResults.slice(0, 3).forEach(result => {
        const status = result.cornerstone >= 20 ? '✓' : '✗';
        console.log(`  Path ${result.path}: ${result.cornerstone} cornerstone words (${result.total} total) ${status}`);
    });
    
    if (bestCount >= 20) {
        console.log(`\n✅ FOUND VALID PATH: Use path ${bestPath} for ${bestCount} cornerstone words!`);
    } else {
        console.log(`\n❌ No path yields 20+ cornerstone words. Best is path ${bestPath} with ${bestCount} words.`);
    }
});

console.log('\n\nSearching for new 12-letter words with 20+ cornerstone words...\n');

// Find potential new seed words
const potential12LetterWords = WORDS_ARRAY.filter(word => word.length === 12);
console.log(`Found ${potential12LetterWords.length} potential 12-letter words to test.\n`);

// Test a sample of words
const results = [];
const sampleSize = Math.min(100, potential12LetterWords.length);
const sampledWords = potential12LetterWords
    .sort(() => Math.random() - 0.5)
    .slice(0, sampleSize);

console.log(`Testing ${sampleSize} random 12-letter words...\n`);

sampledWords.forEach((word, index) => {
    if (index % 10 === 0) {
        process.stdout.write(`Progress: ${index}/${sampleSize}\r`);
    }
    
    let bestPathForWord = -1;
    let bestCountForWord = 0;
    let bestTotalForWord = 0;
    
    // Test each path
    for (let pathIndex = 0; pathIndex < HAMILTONIAN_PATHS.length; pathIndex++) {
        const grid = getLettersFromSeedWord(word, pathIndex);
        const allWords = findWordsInGrid(grid);
        const cornerstoneCount = countCornerstoneWords(allWords);
        
        if (cornerstoneCount > bestCountForWord) {
            bestCountForWord = cornerstoneCount;
            bestPathForWord = pathIndex;
            bestTotalForWord = allWords.size;
        }
    }
    
    if (bestCountForWord >= 20) {
        results.push({
            word: word,
            pathIndex: bestPathForWord,
            cornerstoneCount: bestCountForWord,
            totalWords: bestTotalForWord
        });
    }
});

console.log(`\n\nFound ${results.length} valid puzzle candidates:\n`);

// Sort by cornerstone count
results.sort((a, b) => b.cornerstoneCount - a.cornerstoneCount);

// Show top 20 results
console.log('Top 20 candidates with 20+ cornerstone words:');
console.log('=' .repeat(70));
results.slice(0, 20).forEach((result, index) => {
    console.log(`${index + 1}. ${result.word} - ${result.cornerstoneCount} cornerstone words (${result.totalWords} total) - Path ${result.pathIndex}`);
});

// Try some common/interesting 12-letter words
console.log('\n\nTesting specific common 12-letter words:');
console.log('=' .repeat(70));

const commonWords = [
    'INTRODUCTION', 'ORGANIZATION', 'INFORMATION', 'CONSTRUCTION',
    'CONVERSATION', 'INTELLIGENCE', 'RELATIONSHIP', 'INDEPENDENCE',
    'ENVIRONMENTAL', 'PROFESSIONAL', 'DISTRIBUTION', 'COMMUNICATION',
    'UNDERSTANDING', 'INSTRUCTIONS', 'EXPECTATIONS', 'PERFORMANCES',
    'DEVELOPMENTS', 'CELEBRATIONS', 'APPRECIATION', 'CONSEQUENCES'
];

commonWords.forEach(word => {
    if (VALID_WORDS_SET.has(word.toLowerCase())) {
        let bestPath = -1;
        let bestCount = 0;
        let bestTotal = 0;
        
        for (let pathIndex = 0; pathIndex < HAMILTONIAN_PATHS.length; pathIndex++) {
            const grid = getLettersFromSeedWord(word, pathIndex);
            const allWords = findWordsInGrid(grid);
            const cornerstoneCount = countCornerstoneWords(allWords);
            
            if (cornerstoneCount > bestCount) {
                bestCount = cornerstoneCount;
                bestPath = pathIndex;
                bestTotal = allWords.size;
            }
        }
        
        const status = bestCount >= 20 ? '✓' : '✗';
        console.log(`${word}: ${bestCount} cornerstone words (${bestTotal} total) - Path ${bestPath} ${status}`);
    }
});