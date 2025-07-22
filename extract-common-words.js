const fs = require('fs');

// Read the Google 10000 common words list
const commonWordsContent = fs.readFileSync('/Users/michaelmcisaac/Github/connect-the-thoughts/google-10000-english-no-swears.txt', 'utf8');
const allCommonWords = commonWordsContent.trim().split('\n');

// Filter for 4+ letter words
const common4PlusWords = allCommonWords.filter(word => word.length >= 4);

console.log(`Total words in Google 10k list: ${allCommonWords.length}`);
console.log(`Words with 4+ letters: ${common4PlusWords.length}`);

// Create a JavaScript file with the common words set
const jsContent = `// Common English words (4+ letters) from Google 10,000 most common words list
// Used to identify "cornerstone" words in the puzzle

const COMMON_WORDS_LIST = ${JSON.stringify(common4PlusWords, null, 2)};

const COMMON_WORDS_SET = new Set(COMMON_WORDS_LIST.map(w => w.toLowerCase()));

// Export for use in the game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { COMMON_WORDS_LIST, COMMON_WORDS_SET };
}
`;

fs.writeFileSync('common-words.js', jsContent);

console.log('\nCreated common-words.js with the word list');
console.log('First 10 words:', common4PlusWords.slice(0, 10).join(', '));
console.log('Last 10 words:', common4PlusWords.slice(-10).join(', '));