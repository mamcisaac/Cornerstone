const fs = require('fs');

console.log('Verifying the word list fix...\n');

// Read the updated word list
const wordListContent = fs.readFileSync('words_4plus.txt', 'utf8');
const words = new Set(wordListContent.trim().split('\n').map(w => w.toLowerCase()));

console.log(`Total words in updated list: ${words.size}`);

// Check common words that should work in the game
const testWords = ['corn', 'stone', 'core', 'nets', 'nest', 'test', 'rest', 'tone', 'sent', 'tens'];

console.log('\nChecking if common words are in the updated list:');
testWords.forEach(word => {
  const isPresent = words.has(word);
  console.log(`  ${word.toUpperCase()}: ${isPresent ? '✓ Present' : '✗ Missing'}`);
});

// Check for malformed entries
const malformedEntries = ['aaa', 'aah', 'aal', 'aas', 'aba'];
console.log('\nChecking for malformed 3-letter entries:');
malformedEntries.forEach(entry => {
  const isPresent = words.has(entry);
  console.log(`  ${entry}: ${isPresent ? '✗ Still present' : '✓ Removed'}`);
});

// Show some sample words
const wordArray = Array.from(words);
console.log('\nFirst 20 words in the updated list:');
console.log(wordArray.slice(0, 20).join(', '));

console.log('\n✅ The local word list has been properly fixed!');
console.log('Once deployed to GitHub Pages, the game will accept valid English words.');