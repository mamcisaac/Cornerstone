const fs = require('fs');

// Load the word list
const wordListContent = fs.readFileSync('words_4plus.txt', 'utf8');
const validWords = new Set(wordListContent.trim().split('\n').map(w => w.toLowerCase()));

// Grid layout with visual representation
console.log('Grid layout:');
console.log('   C N      (positions 1, 2)');
console.log('R O O E     (positions 4, 5, 6, 7)');  
console.log('N E T S     (positions 8, 9, 10, 11)');
console.log('   R S      (positions 13, 14)\n');

// Define the grid
const grid = {
  1: 'C', 2: 'N',
  4: 'R', 5: 'O', 6: 'O', 7: 'E',
  8: 'N', 9: 'E', 10: 'T', 11: 'S',
  13: 'R', 14: 'S'
};

// Adjacency from the game
const ADJACENCY = {
  1: [2, 5, 6],
  2: [1, 5, 6, 7],
  4: [5, 8, 9],
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

// Check what other common words might be possible but aren't in our word list
const commonWords = [
  'CENT', 'SENT', 'TENT', 'TENS', 'NETS', 'NEST', 
  'CORN', 'CORE', 'CONE', 'COST', 'COOT', 
  'TONE', 'TORN', 'TORE', 'TOOT', 
  'ONCE', 'ONES', 'ORES', 
  'ROSE', 'ROES', 'ROOT', 'RENT', 'REST',
  'SOON', 'SOOT', 'SORE', 'SORT', 
  'NOON', 'NOSE', 'NOTE', 'NEON',
  'EROS', 'EONS'
];

console.log('Checking if common words are in our word list:');
commonWords.forEach(word => {
  const inList = validWords.has(word.toLowerCase());
  if (!inList) {
    console.log(`  ${word}: ✗ Not in word list`);
  }
});

// Now check if these words can be formed in the grid
console.log('\nChecking which words can be formed with the grid:');

function canFormWord(word) {
  const letters = word.split('');
  
  function dfs(letterIndex, position, visited) {
    if (letterIndex === letters.length) return true;
    
    const neighbors = ADJACENCY[position] || [];
    for (const next of neighbors) {
      if (!visited.has(next) && grid[next] === letters[letterIndex]) {
        visited.add(next);
        if (dfs(letterIndex + 1, next, visited)) return true;
        visited.delete(next);
      }
    }
    return false;
  }
  
  // Try starting from each position that has the first letter
  for (const [pos, letter] of Object.entries(grid)) {
    if (letter === letters[0]) {
      const visited = new Set([parseInt(pos)]);
      if (dfs(1, parseInt(pos), visited)) {
        return true;
      }
    }
  }
  return false;
}

const possibleButMissing = [];
commonWords.forEach(word => {
  const inList = validWords.has(word.toLowerCase());
  const canForm = canFormWord(word);
  
  if (canForm && !inList) {
    console.log(`  ${word}: Can form ✓, but NOT in word list ✗`);
    possibleButMissing.push(word);
  } else if (canForm && inList) {
    console.log(`  ${word}: Can form ✓, in word list ✓`);
  }
});

console.log(`\n${possibleButMissing.length} words can be formed but aren't in our word list:`);
console.log(possibleButMissing.join(', '));

// Check all 4-letter combinations that can be formed
console.log('\nFinding ALL possible letter combinations (regardless of validity):');
const allCombinations = new Set();

function findAllCombinations(current, path, visited, word) {
  if (word.length >= 4) {
    allCombinations.add(word);
  }
  
  if (word.length < 8) { // Don't go too long
    const neighbors = ADJACENCY[current] || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        visited.add(next);
        findAllCombinations(next, [...path, next], visited, word + grid[next]);
        visited.delete(next);
      }
    }
  }
}

// Start from each position
for (const start of Object.keys(grid).map(Number)) {
  const visited = new Set([start]);
  findAllCombinations(start, [start], visited, grid[start]);
}

// Check which combinations are missing from our word list
const missingFromWordList = [];
allCombinations.forEach(combo => {
  if (validWords.has(combo.toLowerCase()) && combo.length === 4) {
    // Already in list
  } else if (combo.length === 4) {
    // Check if this could be a real word
    const common = ['CENT', 'SENT', 'TENT', 'TENS', 'NETS', 'EROS', 'EONS', 'SOOT', 'COOT', 'TOOT', 'ROES'];
    if (common.includes(combo)) {
      missingFromWordList.push(combo);
    }
  }
});

console.log(`\nWords that can be formed but missing from word list:`);
console.log(missingFromWordList.join(', '));