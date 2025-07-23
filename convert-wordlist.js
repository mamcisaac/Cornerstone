const fs = require('fs');

// Read the word list
const words = fs.readFileSync('words_4plus.txt', 'utf8')
    .trim()
    .split('\n')
    .map(word => word.toUpperCase());

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
fs.writeFileSync('words-database.js', jsContent);
console.log(`Created words-database.js with ${words.length} words`);