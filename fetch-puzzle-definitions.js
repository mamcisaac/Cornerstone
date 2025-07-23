// Script to fetch definitions only for words that appear in puzzles
const https = require('https');
const fs = require('fs');

// Load the puzzle words we found
let puzzleWords;
try {
  puzzleWords = JSON.parse(fs.readFileSync('cornerstone-words-to-define.json', 'utf8'));
} catch (e) {
  console.log('cornerstone-words-to-define.json not found. Creating it...');
  // Manually add the cornerstone words we know from the puzzles
  puzzleWords = [
    // From visual inspection of grids
    "CORN", "CORE", "CONE", "ONCE", "NONE", "NOSE", "NOTE", "TONE", "STONE",
    "STORE", "NOTES", "TONES", "REST", "NEST", "NETS", "TENS", "SENT", "RENT",
    "ROOT", "ROOTS", "SOON", "NOON", "NEON", "EONS", "ONES", "ROSE", "SORE",
    "TORE", "WORE", "BORE", "HORN", "BORN", "TORN", "SORT", "COST", "COSTS",
    "SCORE", "SCORES", "CORNERS", "CORNER", "STONES", "STORES", 
    // Architecture puzzle
    "ARCH", "CART", "CARE", "RACE", "ACRE", "RARE", "TRUE", "CURE", "RICE",
    "EACH", "TECH", "ETCH", "TREE", "CUTE", "CITE", 
    // Experimental puzzle
    "MEET", "TERM", "ITEM", "MELT", "MEAT", "TEAM", "MATE", "REAL", "TALE",
    "LATE", "RATE", "PEAL", "PEAT", "EXAM", "MEAL", "PALE", "LEAP",
    // Technologies puzzle
    "TECH", "ECHO", "SHOE", "HOSE", "HOST", "SHOT", "LOTS", "SLOT", "LOST",
    "LONG", "SONG", "GONE", "LOGIC", "SONIC", "ICON", "COIN", "GOING",
    // Championship puzzle
    "CHAP", "CHIP", "SHIP", "HIPS", "SHOP", "CHOP", "INCH", "CHIN", "PINE",
    "PAIN", "MAIN", "RAIN", "GAIN", "CHAIN", "PIANO",
    // Intelligence puzzle
    "LINE", "LINT", "LENT", "GLEN", "GLEE", "TEEN", "GENE", "NICE", "LICE",
    "CENT", "GENT", "TELL", "TILL", "GILL", "CLING",
    // Neighborhood puzzle
    "HOOD", "GOOD", "DOOR", "BORE", "HERO", "HERE", "HEIR", "HIRE", "BONE",
    "GONE", "DONE", "RODE", "BODE", "HORDE", "DRONE",
    // Thanksgiving puzzle
    "GIVE", "GANG", "SING", "SIGN", "KING", "THING", "THINK", "THIN", "VAIN",
    "GAIN", "TANK", "BANK", "SANK", "KNIT", "GAIT",
    // Encyclopedia puzzle
    "COPE", "DOPE", "POLE", "LOPE", "LEAP", "PEAL", "DEAL", "DICE", "LICE",
    "NICE", "PINE", "DINE", "DIAL", "LAID", "IDEA", "AIDE",
    // Breakthrough puzzle
    "TOUGH", "ROUGH", "THOUGH", "THROUGH", "HOUR", "TOUR", "BORE", "ROBE",
    "BROKE", "BRAKE", "TAKE", "RAKE", "BAKE", "HAKE"
  ];
}

// Remove duplicates and convert to uppercase
puzzleWords = [...new Set(puzzleWords.map(w => w.toUpperCase()))].sort();

// Load existing definitions
let existingDefs = {};
try {
  existingDefs = require('./common-definitions.js').COMMON_DEFINITIONS || {};
} catch (e) {
  console.log('Could not load existing definitions');
}

// Filter words that need definitions
const wordsToDefine = puzzleWords.filter(word => 
  !existingDefs[word] || existingDefs[word] === 'A common English word'
);

console.log(`Found ${wordsToDefine.length} puzzle words needing definitions`);

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
              // Make sure first letter is capitalized
              const finalDef = cleanDef.charAt(0).toUpperCase() + cleanDef.slice(1);
              resolve({ word, definition: finalDef });
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
    console.log(`\nProcessing words ${i + 1}-${Math.min(i + batchSize, wordsToDefine.length)} of ${wordsToDefine.length}...`);
    
    const promises = batch.map(word => fetchDefinition(word));
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach(({ word, definition }) => {
      if (definition) {
        results[word] = definition;
        console.log(`  ✓ ${word}: ${definition}`);
      } else {
        console.log(`  ✗ ${word}: No definition found`);
      }
    });
    
    // Rate limit: wait 1 second between batches
    if (i + batchSize < wordsToDefine.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Ensure all existing definitions are preserved
  Object.keys(existingDefs).forEach(word => {
    if (existingDefs[word] !== 'A common English word') {
      results[word] = existingDefs[word];
    }
  });
  
  return results;
}

// Run the script
processWords().then(results => {
  // Sort the results alphabetically
  const sortedResults = {};
  Object.keys(results).sort().forEach(key => {
    sortedResults[key] = results[key];
  });
  
  // Generate the new common-definitions.js file
  const fileContent = `// Definitions for common English words (4+ letters)
// This provides basic definitions for cornerstone words

const COMMON_DEFINITIONS = ${JSON.stringify(sortedResults, null, 2)};

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
if (typeof window !== 'undefined') {
  window.getDefinition = getDefinition;
}

// Export for use in the game
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COMMON_DEFINITIONS, getDefinition };
}
`;

  fs.writeFileSync('common-definitions.js', fileContent);
  console.log('\n✓ Definitions saved to common-definitions.js');
  console.log(`Total definitions: ${Object.keys(sortedResults).length}`);
}).catch(err => {
  console.error('Error:', err);
});