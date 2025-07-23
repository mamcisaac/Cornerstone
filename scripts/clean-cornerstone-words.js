#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Words to remove, organized by category
const WORDS_TO_REMOVE = {
  brandNames: [
    'ajax', 'argos', 'audi', 'bentley', 'bloomberg', 'calvin', 'canon', 'cisco', 
    'dell', 'disney', 'ebay', 'espn', 'ferrari', 'gmail', 'google', 'gucci', 
    'honda', 'hotmail', 'intel', 'java', 'linux', 'marc', 'mario', 'mozilla', 
    'nissan', 'nokia', 'oracle', 'oscar', 'panasonic', 'paypal', 'pepsi', 'peter', 
    'playstation', 'polo', 'prada', 'puerto', 'rico', 'safari', 'samsung', 'sharon', 
    'simon', 'sirius', 'skype', 'sony', 'suzuki', 'tommy', 'toyota', 'unix', 
    'verizon', 'vista', 'volkswagen', 'volvo', 'walmart', 'wesley', 'wiki', 
    'wordpress', 'xbox', 'yahoo', 'youtube'
  ],
  
  programmingTerms: [
    'api', 'ascii', 'aspx', 'bool', 'cached', 'checkbox', 'const', 'cpp', 
    'ctrl', 'datetime', 'dll', 'emacs', 'enum', 'eval', 'foreach', 'goto', 
    'grep', 'guid', 'href', 'html', 'http', 'https', 'iframe', 'init', 
    'inline', 'jpeg', 'jquery', 'json', 'lang', 'libs', 'localhost', 'login', 
    'logout', 'mozilla', 'namespace', 'navbar', 'node', 'onclick', 'param', 
    'params', 'parser', 'permalink', 'perl', 'php', 'plugin', 'plugins', 
    'popup', 'postgres', 'postscript', 'proc', 'proxy', 'ptr', 'python', 
    'readonly', 'regex', 'regexp', 'reload', 'render', 'resize', 'screenshot', 
    'servlet', 'spam', 'spec', 'sql', 'ssl', 'stderr', 'stdin', 'stdout', 
    'submit', 'sudo', 'sync', 'syntax', 'tcp', 'template', 'templates', 
    'textbox', 'thead', 'timeout', 'timestamp', 'tooltip', 'unicode', 'unix', 
    'upload', 'uploads', 'uploader', 'url', 'urls', 'username', 'usr', 
    'util', 'utils', 'uuid', 'validator', 'varchar', 'vars', 'viewport', 
    'widget', 'widgets', 'wiki', 'xml', 'xmlns', 'xpath', 'xsl'
  ],
  
  misspellings: [
    'appartment', 'beleive', 'calender', 'cemetary', 'cheif', 'choclate', 
    'cieling', 'couldnt', 'definate', 'dilemna', 'embarass', 'enviroment', 
    'excercise', 'facist', 'gaurd', 'grammer', 'harrass', 'higene', 
    'independant', 'inoculate', 'judgement', 'liscence', 'millenium', 
    'miniscule', 'mischievious', 'neccessary', 'noticable', 'occassion', 
    'occured', 'posession', 'publically', 'recieve', 'repetative', 'rythm', 
    'sargent', 'seperate', 'suprise', 'tommorow', 'truely', 'twelth', 
    'untill', 'vaccuum', 'wierd'
  ],
  
  nonEnglish: [
    'agosto', 'avril', 'avec', 'bali', 'beijing', 'bien', 'bruno', 'buenos', 
    'aires', 'casa', 'chan', 'dans', 'degli', 'delhi', 'desde', 'deux', 
    'diego', 'domingo', 'donc', 'dong', 'elle', 'entre', 'eres', 'esta', 
    'este', 'euro', 'feng', 'francais', 'gmbh', 'gran', 'hasta', 'hindi', 
    'hong', 'juan', 'juin', 'juillet', 'kong', 'kuala', 'lanka', 'leur', 
    'lima', 'lisboa', 'lorem', 'lumpur', 'lyon', 'mais', 'mars', 'mismo', 
    'mujer', 'nueva', 'nuevo', 'octobre', 'otro', 'otros', 'para', 'pero', 
    'puede', 'puis', 'puerto', 'quand', 'quien', 'quoi', 'rico', 'sans', 
    'sept', 'sera', 'shui', 'sido', 'solo', 'sont', 'sous', 'sri', 'sur', 
    'tout', 'tres', 'trois', 'votre', 'vous', 'yang'
  ],
  
  // Additional non-words that might not fit in other categories
  otherNonWords: [
    'wordpress', 'jpeg', 'checkbox', 'permalink'
  ]
};

// Combine all words to remove into a single set for efficient lookup
const allWordsToRemove = new Set();
Object.values(WORDS_TO_REMOVE).forEach(category => {
  category.forEach(word => allWordsToRemove.add(word.toLowerCase()));
});

// Read the cornerstone-words.js file
const filePath = path.join(__dirname, '..', 'src', 'data', 'cornerstone-words.js');
const backupPath = filePath + '.backup.' + new Date().toISOString().replace(/:/g, '-');

console.log('Reading cornerstone-words.js...');
const content = fs.readFileSync(filePath, 'utf8');

// Extract the array content
const arrayMatch = content.match(/const COMMON_WORDS_LIST = \[([\s\S]*?)\];/);
if (!arrayMatch) {
  console.error('Could not find COMMON_WORDS_LIST array in the file');
  process.exit(1);
}

// Parse the words from the array
const wordsString = arrayMatch[1];
const words = wordsString
  .split(',')
  .map(w => w.trim())
  .filter(w => w)
  .map(w => w.replace(/^["']|["']$/g, ''));

console.log(`Found ${words.length} words in the original file`);

// Filter out the words to remove
const cleanedWords = words.filter(word => !allWordsToRemove.has(word.toLowerCase()));
const removedWords = words.filter(word => allWordsToRemove.has(word.toLowerCase()));

console.log(`Removed ${removedWords.length} invalid words`);
console.log(`${cleanedWords.length} words remain`);

// Show what words were removed
console.log('\nRemoved words by category:');
Object.entries(WORDS_TO_REMOVE).forEach(([category, categoryWords]) => {
  const removed = removedWords.filter(word => 
    categoryWords.includes(word.toLowerCase())
  );
  if (removed.length > 0) {
    console.log(`\n${category}: ${removed.length} words`);
    console.log(removed.sort().join(', '));
  }
});

// Create backup
console.log(`\nCreating backup at: ${backupPath}`);
fs.copyFileSync(filePath, backupPath);

// Reconstruct the file content
const newArrayContent = cleanedWords.map(word => `  "${word}"`).join(',\n');
const newContent = content.replace(
  /const COMMON_WORDS_LIST = \[([\s\S]*?)\];/,
  `const COMMON_WORDS_LIST = [\n${newArrayContent}\n];`
);

// Write the cleaned content back
console.log('Writing cleaned content back to file...');
fs.writeFileSync(filePath, newContent);

console.log('\nCleaning complete!');
console.log(`Original words: ${words.length}`);
console.log(`Removed words: ${removedWords.length}`);
console.log(`Remaining words: ${cleanedWords.length}`);