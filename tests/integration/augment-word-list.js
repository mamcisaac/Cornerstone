const fs = require('fs');

// Load current word list
const wordListContent = fs.readFileSync('words_4plus.txt', 'utf8');
const currentWords = new Set(wordListContent.trim().split('\n').map(w => w.toLowerCase()));

// Words that should be added (valid English words that can be formed in the grid)
const wordsToAdd = [
  'nets',    // plural of net
  'tens',    // plural of ten  
  'cone',    // geometric shape
  'cones',   // plural of cone
  'torn',    // past participle of tear
  'tore',    // past tense of tear
  'ores',    // plural of ore (mineral)
  'sore',    // painful
  'sores',   // plural of sore
  'roes',    // plural of roe (fish eggs)
  'coot',    // water bird
  'soot',    // black powder from smoke
  'toot',    // sound a horn
  'eons',    // plural of eon (long time periods)
  'eros',    // Greek god of love
  'sent',    // past tense of send
  'cent',    // penny
  'cents',   // plural of cent
  'tensor',  // mathematical object
  'tenors',  // plural of tenor
  'snore',   // breathing sound while sleeping
  'snores',  // plural/verb form
  'rent',    // payment for property
  'rents',   // plural of rent
  'tern',    // seabird
  'terns',   // plural of tern
  'stern',   // rear of ship or serious
  'onset',   // beginning
  'crone',   // old woman
  'crones',  // plural
  'cornet',  // brass instrument
  'cornets', // plural
  'scone',   // baked good
  'scones',  // plural
  'tenor',   // singing voice
  'senor',   // Spanish title
  'nestor',  // wise elder
  'steno',   // shorthand writing
  'terse',   // brief and to the point
  'torso',   // trunk of body
  'torsos'   // plural
];

// Add only words that aren't already in the list
const newWords = [];
wordsToAdd.forEach(word => {
  if (!currentWords.has(word)) {
    currentWords.add(word);
    newWords.push(word);
  }
});

// Convert back to sorted array
const allWords = Array.from(currentWords).sort();

// Write updated word list
fs.writeFileSync('words_4plus.txt', allWords.join('\n'));

console.log(`Added ${newWords.length} new words to the word list:`);
console.log(newWords.sort().join(', '));
console.log(`\nTotal words now: ${allWords.length}`);

// Test that the specific grid words are now included
console.log('\nVerifying grid-specific words:');
const gridWords = ['nets', 'cone', 'coot', 'torn', 'tore', 'ores', 'roes', 'soot', 'sent', 'tens'];
gridWords.forEach(word => {
  console.log(`  ${word.toUpperCase()}: ${currentWords.has(word) ? '✓' : '✗'}`);
});