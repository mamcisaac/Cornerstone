const fs = require('fs');

// Read words from the JSON dictionary
const dictionaryContent = fs.readFileSync('../src/data/words_dictionary.json', 'utf8');
const dictionary = JSON.parse(dictionaryContent);

// Get all words that are 4+ letters
const words = Object.keys(dictionary)
    .filter(word => word.length >= 4)
    .map(word => word.toUpperCase())
    .sort();

// Create JavaScript content
const jsContent = `// Comprehensive English word list for validation (4+ letters)
// Generated from dwyl/english-words repository
// Contains ${words.length} words for complete word discovery

const WORD_LIST = [
${words.map(word => `  "${word}"`).join(',\n')}
];

// Create set for fast lookup
const WORD_SET = new Set(WORD_LIST);

// Export for use
if (typeof window !== 'undefined') {
    window.COMPREHENSIVE_WORD_SET = WORD_SET;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WORD_LIST, WORD_SET };
}
`;

// Write to file
fs.writeFileSync('../src/data/words-database.js', jsContent);
console.log(`Created words-database.js with ${words.length} words`);