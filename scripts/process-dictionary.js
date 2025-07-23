const fs = require('fs');

// Read the JSON dictionary
const dictionaryContent = fs.readFileSync('../src/data/words_dictionary.json', 'utf8');
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

console.log('\nDictionary processed successfully!');
console.log('First 20 words:', uniqueWords.slice(0, 20).join(', '));
console.log('Last 20 words:', uniqueWords.slice(-20).join(', '));
console.log('\nThis script now only analyzes the dictionary.');
console.log('Use create-compact-wordlist.js or convert-wordlist.js to generate database files.');