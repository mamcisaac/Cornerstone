const fs = require('fs');

// Read the word list
const words = fs.readFileSync('words_4plus.txt', 'utf8')
    .trim()
    .split('\n')
    .map(word => word.toUpperCase());

// Create a more compact format - join all words with a delimiter
const jsContent = `// Comprehensive English word list for validation (4+ letters)
// Contains ${words.length} words

const WORD_LIST_STRING = "${words.join('|')}";
const COMPREHENSIVE_WORD_SET = new Set(WORD_LIST_STRING.split('|'));

// Export for use
if (typeof window !== 'undefined') {
    window.COMPREHENSIVE_WORD_SET = COMPREHENSIVE_WORD_SET;
}

console.log('Loaded ' + COMPREHENSIVE_WORD_SET.size + ' words');
`;

// Write to file
fs.writeFileSync('words-database-compact.js', jsContent);
console.log(`Created words-database-compact.js with ${words.length} words`);