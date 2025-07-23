const fs = require('fs');

// Load the Google 10000 common words list
const commonWordsContent = fs.readFileSync('/Users/michaelmcisaac/Github/connect-the-thoughts/google-10000-english-no-swears.txt', 'utf8');
const commonWords = new Set(commonWordsContent.trim().split('\n').map(w => w.toLowerCase()));

// Load all possible words from our puzzle
const puzzleWordsContent = fs.readFileSync('test/all-possible-words-with-diagonals.txt', 'utf8');
const puzzleWords = puzzleWordsContent.trim().split('\n').filter(w => w.length > 0).map(w => w.toLowerCase());

console.log(`Total words in Google 10000 list: ${commonWords.size}`);
console.log(`Total possible words in our puzzle: ${puzzleWords.length}\n`);

// Check which puzzle words are in the common words list
const commonPuzzleWords = [];
const uncommonPuzzleWords = [];

puzzleWords.forEach(word => {
  if (commonWords.has(word)) {
    commonPuzzleWords.push(word.toUpperCase());
  } else {
    uncommonPuzzleWords.push(word.toUpperCase());
  }
});

console.log(`Puzzle words that ARE in the common words list: ${commonPuzzleWords.length}`);
console.log('━'.repeat(60));

// Group common words by length
const byLength = {};
commonPuzzleWords.forEach(word => {
  const len = word.length;
  if (!byLength[len]) byLength[len] = [];
  byLength[len].push(word);
});

Object.keys(byLength).sort((a, b) => a - b).forEach(len => {
  console.log(`\n${len}-letter words (${byLength[len].length}):`);
  console.log(byLength[len].sort().join(', '));
});

console.log(`\n\nPuzzle words that are NOT in the common words list: ${uncommonPuzzleWords.length}`);
console.log('━'.repeat(60));

// Show some examples of uncommon words
console.log('\nExamples of uncommon words:');
const examples = uncommonPuzzleWords.slice(0, 30);
console.log(examples.join(', '));

console.log('\n\nSummary:');
console.log(`${commonPuzzleWords.length} out of ${puzzleWords.length} puzzle words (${Math.round(commonPuzzleWords.length / puzzleWords.length * 100)}%) are common English words`);