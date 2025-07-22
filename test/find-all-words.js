const fs = require('fs');

// Load the word list
const wordListContent = fs.readFileSync('words_4plus.txt', 'utf8');
const validWords = new Set(wordListContent.trim().split('\n').map(w => w.toLowerCase()));

// Grid layout:
//    C N
// R O O E  
// N E T S
//    R S

// Define the grid with positions
const grid = {
  1: 'C', 2: 'N',
  4: 'R', 5: 'O', 6: 'O', 7: 'E',
  8: 'N', 9: 'E', 10: 'T', 11: 'S',
  13: 'R', 14: 'S'
};

// Define adjacency (which cells are connected)
const adjacency = {
  1: [2, 5],
  2: [1, 6],
  4: [5, 8],
  5: [1, 4, 6, 9],
  6: [2, 5, 7, 10],
  7: [6, 11],
  8: [4, 9],
  9: [5, 8, 10, 13],
  10: [6, 9, 11, 14],
  11: [7, 10],
  13: [9, 14],
  14: [10, 13]
};

// Find all possible words
function findAllWords() {
  const foundWords = new Set();
  
  // DFS to find all paths
  function dfs(current, path, visited, word) {
    // Check if current word is valid (4+ letters)
    if (word.length >= 4 && validWords.has(word.toLowerCase())) {
      foundWords.add(word);
    }
    
    // Try to extend the path
    for (const next of adjacency[current]) {
      if (!visited.has(next)) {
        visited.add(next);
        dfs(next, [...path, next], visited, word + grid[next]);
        visited.delete(next);
      }
    }
  }
  
  // Start from each position
  for (const start of Object.keys(grid).map(Number)) {
    const visited = new Set([start]);
    dfs(start, [start], visited, grid[start]);
  }
  
  return Array.from(foundWords).sort();
}

console.log('Finding all possible words in the Cornerstones grid...\n');

const allWords = findAllWords();

console.log(`Total possible words: ${allWords.length}\n`);

// Group by length
const byLength = {};
allWords.forEach(word => {
  const len = word.length;
  if (!byLength[len]) byLength[len] = [];
  byLength[len].push(word);
});

// Display by length
Object.keys(byLength).sort((a, b) => a - b).forEach(len => {
  console.log(`${len}-letter words (${byLength[len].length}):`);
  console.log(byLength[len].join(', '));
  console.log();
});

// Check some specific words that should be possible
console.log('Checking specific words that should be findable:');
const checkWords = ['STONE', 'CORN', 'CORE', 'TONE', 'NEST', 'REST', 'NETS', 'TENS', 
                   'SENT', 'TORE', 'STORE', 'CORES', 'CONES', 'ONES', 'ORES'];

checkWords.forEach(word => {
  const found = allWords.includes(word);
  console.log(`  ${word}: ${found ? '✓ Found' : '✗ Not found'}`);
});

// Save all words to a file for reference
fs.writeFileSync('test/all-possible-words.txt', allWords.join('\n'));
console.log('\nAll words saved to test/all-possible-words.txt');