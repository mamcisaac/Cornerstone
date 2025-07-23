const fs = require('fs');

// Read the JSON dictionary
const dictionaryContent = fs.readFileSync('words_dictionary.json', 'utf8');
const dictionary = JSON.parse(dictionaryContent);

// Get all words that are 4+ letters
const words = Object.keys(dictionary)
  .filter(word => word.length >= 4)
  .map(word => word.toLowerCase())
  .sort();

// Remove duplicates (just in case)
const uniqueWords = [...new Set(words)];

console.log(`Total words in dictionary: ${Object.keys(dictionary).length}`);
console.log(`Words with 4+ letters: ${uniqueWords.length}`);

// Write to words_4plus.txt
fs.writeFileSync('words_4plus.txt', uniqueWords.join('\n'));

console.log('\nWord list updated successfully!');
console.log('First 20 words:', uniqueWords.slice(0, 20).join(', '));
console.log('Last 20 words:', uniqueWords.slice(-20).join(', '));