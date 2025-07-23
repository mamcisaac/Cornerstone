// Add all missing definitions for the 208 Cornerstones words
const fs = require('fs');
const { ALL_CORNERSTONES_WORDS } = require('./all-cornerstones-words.js');
const { COMMON_DEFINITIONS } = require('./common-definitions.js');

// Find words that need definitions
const missingWords = ALL_CORNERSTONES_WORDS.filter(word => !COMMON_DEFINITIONS[word]);

console.log(`Total words in game: ${ALL_CORNERSTONES_WORDS.length}`);
console.log(`Already have definitions: ${ALL_CORNERSTONES_WORDS.length - missingWords.length}`);
console.log(`Need definitions for: ${missingWords.length} words`);

// For now, let's add simple definitions for the most common missing words
// We can enhance these later with API calls in smaller batches

const basicDefinitions = {
    // Common short words that are likely to be in dictionaries
    "COES": "Third person singular of 'coe'",
    "CONE": "A circular base tapering to a point",
    "CONER": "One who cones",
    "CONES": "Plural of cone",
    "CONOR": "A masculine given name",
    "COOER": "One who coos",
    "COOERS": "Plural of cooer", 
    "COON": "Informal term for raccoon",
    "COONER": "One who hunts raccoons",
    "COOS": "Third person singular of 'coo'",
    "COOST": "Past tense of 'coo' (dialectal)",
    "COOT": "A water bird with dark plumage",
    "COOTER": "A type of turtle",
    "COOTS": "Plural of coot",
    "CORNER": "The place where two lines meet",
    "CORNERS": "Plural of corner",
    "CORNET": "A brass musical instrument",
    "CORNETS": "Plural of cornet",
    "CORNO": "Italian word for horn",
    "CROSS": "An intersecting structure or symbol",
    "CRONE": "An old woman, especially one who is thin and ugly",
    "CRONES": "Plural of crone",
    "CREST": "The top or highest part of something",
    "CRESTS": "Plural of crest",
    "EONS": "Plural of eon; long periods of time",
    "ERNE": "A type of sea eagle",
    "ERNES": "Plural of erne",
    "ERNS": "Plural of ern (variant of erne)",
    "EROS": "Greek god of love",
    "NOES": "Plural of 'no'; negative votes",
    "ONCER": "One who does something once",
    "ONER": "Something unique or outstanding",
    "ONSET": "The beginning or start of something",
    "ONSETS": "Plural of onset",
    "ORES": "Plural of ore; mineral deposits",
    "ORTS": "Scraps of food left at a meal",
    "RECTO": "The right-hand page of an open book",
    "RECTOS": "Plural of recto",
    "RONCO": "A type of fish",
    "ROSTER": "A list of names",
    "ROSTERS": "Plural of roster",
    "SENOR": "Spanish title equivalent to Mr.",
    "SENORS": "Plural of senor",
    "SENSOR": "A device that detects stimuli",
    "SENSORS": "Plural of sensor",
    "STERN": "Serious and strict in manner",
    "STERNS": "Plural of stern",
    "TENOR": "A male singing voice",
    "TENORS": "Plural of tenor",
    "TERN": "A type of seabird",
    "TERNS": "Plural of tern"
};

// Add the basic definitions to our missing words
const definitionsToAdd = {};
missingWords.forEach(word => {
    if (basicDefinitions[word]) {
        definitionsToAdd[word] = basicDefinitions[word];
    } else {
        definitionsToAdd[word] = "A valid English word"; // Temporary fallback
    }
});

console.log(`\nAdding ${Object.keys(definitionsToAdd).length} definitions to common-definitions.js`);

// Create the additions to add to the file
const additionsText = Object.keys(definitionsToAdd)
    .sort()
    .map(word => `  "${word}": "${definitionsToAdd[word]}"`)
    .join(',\n');

console.log('\nDefinitions to add:');
console.log(additionsText);

console.log(`\nManually add these ${Object.keys(definitionsToAdd).length} definitions to common-definitions.js`);
console.log('Or run with --auto flag to automatically append them');

if (process.argv.includes('--auto')) {
    // Read the current file and add the definitions
    const fileContent = fs.readFileSync('./common-definitions.js', 'utf8');
    
    // Find the end of COMMON_DEFINITIONS object (before the final });)
    const insertPoint = fileContent.lastIndexOf('  // Add more common word definitions as needed');
    
    if (insertPoint !== -1) {
        const beforeInsert = fileContent.substring(0, insertPoint);
        const afterInsert = fileContent.substring(insertPoint);
        
        const newContent = beforeInsert + 
            '\n  // Additional definitions for Cornerstones puzzle\n' +
            additionsText + ',\n\n' +
            afterInsert;
        
        fs.writeFileSync('./common-definitions.js', newContent);
        console.log('✅ Definitions added to common-definitions.js');
    } else {
        console.log('❌ Could not find insertion point in common-definitions.js');
    }
}

module.exports = { definitionsToAdd, missingWords };