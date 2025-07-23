const fs = require('fs');

// Read words from the JSON dictionary
const dictionaryContent = fs.readFileSync('../src/data/words_dictionary.json', 'utf8');
const dictionary = JSON.parse(dictionaryContent);

// Get all words that are 4+ letters
const words = Object.keys(dictionary)
    .filter(word => word.length >= 4)
    .map(word => word.toUpperCase())
    .sort();

// Create a more compact format - join all words with a delimiter
const jsContent = `// Comprehensive English word list for validation (4+ letters)
// Contains ${words.length} words

const WORD_LIST_STRING = "${words.join('|')}";
const COMPREHENSIVE_WORD_SET = new Set(WORD_LIST_STRING.split('|'));

// Export for use
if (typeof window !== 'undefined') {
    window.COMPREHENSIVE_WORD_SET = COMPREHENSIVE_WORD_SET;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { COMPREHENSIVE_WORD_SET };
}

console.log('Loaded ' + COMPREHENSIVE_WORD_SET.size + ' words');
`;

// Write to file
fs.writeFileSync('../src/data/words-database-compact.js', jsContent);
console.log(`Created words-database-compact.js with ${words.length} words`);