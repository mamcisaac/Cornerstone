#!/usr/bin/env node

// Script to verify that all words in common-words.js exist in words-database-compact.js

const fs = require('fs');
const path = require('path');

// Load common-words.js
const commonWordsPath = path.join(__dirname, '../src/data/common-words.js');
const commonWordsContent = fs.readFileSync(commonWordsPath, 'utf8');

// Extract COMMON_WORDS_LIST array
const commonWordsMatch = commonWordsContent.match(/const COMMON_WORDS_LIST = \[([\s\S]*?)\];/);
if (!commonWordsMatch) {
  console.error('Could not find COMMON_WORDS_LIST in common-words.js');
  process.exit(1);
}

// Parse the array content to get all words
const commonWords = commonWordsMatch[1]
  .split(',')
  .map(line => line.trim())
  .filter(line => line.startsWith('"') && line.endsWith('"'))
  .map(line => line.slice(1, -1).toUpperCase()); // Remove quotes and convert to uppercase

console.log(`Total words in common-words.js: ${commonWords.length}`);

// Load words-database-compact.js
const wordsDbPath = path.join(__dirname, '../src/data/words-database-compact.js');
const wordsDbContent = fs.readFileSync(wordsDbPath, 'utf8');

// Extract WORD_LIST_STRING
const wordsDbMatch = wordsDbContent.match(/const WORD_LIST_STRING = "(.*?)";/);
if (!wordsDbMatch) {
  console.error('Could not find WORD_LIST_STRING in words-database-compact.js');
  process.exit(1);
}

// Convert to Set for faster lookup
const validWords = new Set(wordsDbMatch[1].split('|'));
console.log(`Total words in words-database-compact.js: ${validWords.size}`);

// Check each common word
const missingWords = [];
const foundWords = [];

console.log('\nChecking common words...\n');

// Show first 10 common words as a sample
console.log('Sample of first 10 common words:');
commonWords.slice(0, 10).forEach((word, index) => {
  const exists = validWords.has(word);
  console.log(`${index + 1}. "${word}" - ${exists ? 'FOUND' : 'NOT FOUND'}`);
});

// Check all words
commonWords.forEach(word => {
  if (validWords.has(word)) {
    foundWords.push(word);
  } else {
    missingWords.push(word);
  }
});

console.log('\n--- VERIFICATION RESULTS ---');
console.log(`Total common words: ${commonWords.length}`);
console.log(`Found in dictionary: ${foundWords.length}`);
console.log(`NOT found in dictionary: ${missingWords.length}`);

if (missingWords.length > 0) {
  console.log('\nWords NOT found in words-database-compact.js:');
  missingWords.forEach((word, index) => {
    console.log(`${index + 1}. "${word}"`);
  });
  
  // Try to find similar words
  console.log('\nSearching for similar words in dictionary:');
  missingWords.forEach(word => {
    const similarWords = Array.from(validWords)
      .filter(validWord => {
        // Check if the valid word starts with the missing word or vice versa
        return validWord.startsWith(word) || 
               word.startsWith(validWord) ||
               validWord.includes(word) ||
               word.includes(validWord);
      })
      .slice(0, 5); // Show max 5 similar words
    
    if (similarWords.length > 0) {
      console.log(`\n"${word}" - Similar words found: ${similarWords.join(', ')}`);
    }
  });
}

// Export the list of common words that are valid
if (foundWords.length === commonWords.length) {
  console.log('\n✓ All common words are valid English words in the dictionary!');
} else {
  console.log('\n✗ Some common words were not found in the dictionary.');
  console.log('This might indicate issues with the word format or the dictionary needs updating.');
}