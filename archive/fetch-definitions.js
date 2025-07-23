// Script to fetch definitions from Free Dictionary API
const https = require('https');
const fs = require('fs');

// Load existing definitions
const existingDefs = require('./common-definitions.js').COMMON_DEFINITIONS || {};

// Load common words list
const commonWords = require('./common-words.js').COMMON_WORDS_LIST;

// Words to fetch definitions for (4+ letters only)
const wordsToDefine = commonWords
  .filter(word => word.length >= 4)
  .map(word => word.toUpperCase())
  .filter(word => !existingDefs[word] || existingDefs[word] === 'A common English word');

console.log(`Found ${wordsToDefine.length} words needing definitions`);

// Function to fetch definition from API
function fetchDefinition(word) {
  return new Promise((resolve, reject) => {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            // Get the first meaning's first definition
            if (parsed[0] && parsed[0].meanings && parsed[0].meanings[0] && parsed[0].meanings[0].definitions[0]) {
              const def = parsed[0].meanings[0].definitions[0].definition;
              // Clean up definition - remove example sentences, trim length
              const cleanDef = def.split(';')[0].split('.')[0].trim();
              resolve({ word, definition: cleanDef });
            } else {
              resolve({ word, definition: null });
            }
          } else {
            resolve({ word, definition: null });
          }
        } catch (e) {
          resolve({ word, definition: null });
        }
      });
    }).on('error', (err) => {
      resolve({ word, definition: null });
    });
  });
}

// Process words with rate limiting
async function processWords() {
  const results = { ...existingDefs };
  const batchSize = 5;
  
  for (let i = 0; i < wordsToDefine.length; i += batchSize) {
    const batch = wordsToDefine.slice(i, i + batchSize);
    console.log(`Processing words ${i + 1}-${Math.min(i + batchSize, wordsToDefine.length)} of ${wordsToDefine.length}...`);
    
    const promises = batch.map(word => fetchDefinition(word));
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach(({ word, definition }) => {
      if (definition) {
        results[word] = definition;
        console.log(`  ${word}: ${definition}`);
      } else {
        console.log(`  ${word}: No definition found`);
      }
    });
    
    // Rate limit: wait 1 second between batches
    if (i + batchSize < wordsToDefine.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// Run the script
processWords().then(results => {
  // Generate the new common-definitions.js file
  const fileContent = `// Definitions for common English words (4+ letters)
// This provides basic definitions for cornerstone words
// Auto-generated from Free Dictionary API

const COMMON_DEFINITIONS = ${JSON.stringify(results, null, 2)};

// Function to get definition with fallback
function getDefinition(word) {
  const upperWord = word.toUpperCase();
  if (COMMON_DEFINITIONS[upperWord]) {
    return COMMON_DEFINITIONS[upperWord];
  }
  
  // Generic fallback based on word characteristics
  if (word.endsWith('s') && word.length > 2) {
    const singular = word.slice(0, -1);
    if (COMMON_DEFINITIONS[singular.toUpperCase()]) {
      return "Plural of " + singular.toLowerCase();
    }
  }
  
  // Default fallback
  return "A common English word";
}

// Make function available globally
window.getDefinition = getDefinition;

// Export for use in the game
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COMMON_DEFINITIONS, getDefinition };
}
`;

  fs.writeFileSync('common-definitions-new.js', fileContent);
  console.log('\nDefinitions saved to common-definitions-new.js');
  console.log(`Total definitions: ${Object.keys(results).length}`);
}).catch(err => {
  console.error('Error:', err);
});