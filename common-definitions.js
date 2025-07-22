// Definitions for common English words (4+ letters)
// This provides basic definitions for cornerstone words

const COMMON_DEFINITIONS = {
  // 4-letter common words found in our puzzle
  "CORE": "The central or most important part",
  "CORN": "A cereal plant with yellow kernels",
  "COST": "The amount paid or required for something",
  "NEON": "A colorless inert gas used in lights",
  "NEST": "A structure where birds lay eggs",
  "NONE": "Not any; no one",
  "NOON": "Twelve o'clock in the day",
  "NOSE": "The organ for breathing and smelling",
  "NOTE": "A brief written message or musical tone",
  "ONES": "Individual units; plural of one",
  "RENO": "A city in Nevada",
  "REST": "To cease work or movement",
  "ROOT": "The part of a plant below ground",
  "SETS": "Groups of things; plural of set",
  "SOON": "In the near future",
  "TONE": "Quality of sound or color",
  
  // 5-letter common words
  "COSTS": "Amounts required for payment",
  "NOTES": "Written messages or musical tones",
  "NOTRE": "French word meaning 'our'",
  "ROOTS": "Plant parts below ground; origins",
  "STONE": "Hard solid mineral matter",
  "STORE": "A place where goods are sold",
  "TONER": "Powder used in laser printers",
  "TONES": "Qualities of sound or color",
  
  // 6-letter common words
  "CORNER": "The place where two lines meet",
  "STONES": "Pieces of rock",
  "STORES": "Shops or places of business",
  
  // 7-letter common words
  "CORNERS": "Places where lines or surfaces meet",
  "SOONEST": "At the earliest time",
  
  // Add more common word definitions as needed
  // For words without specific definitions, we'll use a generic fallback
};

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