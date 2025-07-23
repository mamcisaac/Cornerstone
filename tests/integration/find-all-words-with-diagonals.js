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

// FROM THE GAME CODE - INCLUDING DIAGONALS!
const ADJACENCY = {
  1: [2, 5, 6],                    // Top row left (can reach diagonally to 6!)
  2: [1, 5, 6, 7],                 // Top row right (can reach diagonally to 5, 6, 7!)
  4: [5, 8, 9],                    // Left column top (can reach diagonally to 9!)
  5: [1, 2, 4, 6, 8, 9, 10],       // Center left (connects to many!)
  6: [1, 2, 5, 7, 9, 10, 11],      // Center right (connects to many!)
  7: [2, 6, 10, 11],               // Right column top (can reach diagonally!)
  8: [4, 5, 9, 13],                // Left column bottom
  9: [4, 5, 6, 8, 10, 13, 14],     // Center bottom left (connects to many!)
  10: [5, 6, 7, 9, 11, 13, 14],    // Center bottom right (connects to many!)
  11: [6, 7, 10, 14],              // Right column bottom
  13: [8, 9, 10, 14],              // Bottom row left
  14: [9, 10, 11, 13]              // Bottom row right
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
    
    // Try to extend the path (up to 12 letters like in the game)
    if (word.length < 12) {
      const neighbors = ADJACENCY[current] || [];
      for (const next of neighbors) {
        if (!visited.has(next)) {
          visited.add(next);
          dfs(next, [...path, next], visited, word + grid[next]);
          visited.delete(next);
        }
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

console.log('Finding all possible words with diagonal connections...\n');

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

// Check some specific paths
console.log('Checking specific word paths:');
console.log('\nSTONE path: S(11) -> T(10) -> O(6) -> N(2) -> E(7)');
console.log('  11->10: ' + (ADJACENCY[11].includes(10) ? '✓' : '✗'));
console.log('  10->6: ' + (ADJACENCY[10].includes(6) ? '✓' : '✗'));
console.log('  6->2: ' + (ADJACENCY[6].includes(2) ? '✓' : '✗'));
console.log('  2->7: ' + (ADJACENCY[2].includes(7) ? '✓' : '✗'));

console.log('\nNEST path: N(8) -> E(9) -> S(14) -> T(10)');
console.log('  8->9: ' + (ADJACENCY[8].includes(9) ? '✓' : '✗'));
console.log('  9->14: ' + (ADJACENCY[9].includes(14) ? '✓' : '✗'));
console.log('  14->10: ' + (ADJACENCY[14].includes(10) ? '✓' : '✗'));

console.log('\nTONE path: T(10) -> O(6) -> N(2) -> E(7)');
console.log('  10->6: ' + (ADJACENCY[10].includes(6) ? '✓' : '✗'));
console.log('  6->2: ' + (ADJACENCY[6].includes(2) ? '✓' : '✗'));
console.log('  2->7: ' + (ADJACENCY[2].includes(7) ? '✓' : '✗'));

// Save all words to a file for reference
fs.writeFileSync('test/all-possible-words-with-diagonals.txt', allWords.join('\n'));
console.log('\nAll words saved to test/all-possible-words-with-diagonals.txt');