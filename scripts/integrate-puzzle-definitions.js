// Integrate the fetched puzzle definitions into common-definitions.js

const fs = require('fs');

// Load the fetched definitions
const puzzleDefinitionsData = require('./all-puzzle-definitions.js');

// Extract the actual definitions (they're nested)
let puzzleDefinitions = {};

// The structure is ALL_PUZZLE_DEFINITIONS which contains multiple keys
// Each key contains word definitions
for (const [key, value] of Object.entries(puzzleDefinitionsData)) {
    if (typeof value === 'object' && value !== null) {
        // Merge all the definitions from each section
        Object.assign(puzzleDefinitions, value);
    }
}

console.log(`Found ${Object.keys(puzzleDefinitions).length} definitions to process`);

// Load the current common definitions file as text
let commonDefsContent = fs.readFileSync('./common-definitions.js', 'utf8');

// Count updates
let updated = 0;
let added = 0;

// Process each definition
Object.entries(puzzleDefinitions).forEach(([word, definition]) => {
    if (typeof definition !== 'string') return; // Skip non-string values
    const upperWord = word.toUpperCase();
    
    // Check if word exists in common-definitions.js
    const existingPattern = new RegExp(`"${upperWord}":\\s*"[^"]*"`, 'g');
    
    if (commonDefsContent.includes(`"${upperWord}":`)) {
        // Word exists, check if it has a placeholder definition
        const placeholderPattern = new RegExp(`"${upperWord}":\\s*"A (valid|common) English word"`);
        
        if (placeholderPattern.test(commonDefsContent)) {
            // Replace placeholder with real definition
            commonDefsContent = commonDefsContent.replace(
                existingPattern,
                `"${upperWord}": "${definition.replace(/"/g, '\\"')}"`
            );
            updated++;
        }
    } else {
        // Word doesn't exist, we'll need to add it
        // Find a good insertion point (before the closing brace)
        const insertPoint = commonDefsContent.lastIndexOf('};');
        if (insertPoint !== -1) {
            const insertion = `,\n    "${upperWord}": "${definition.replace(/"/g, '\\"')}"`;
            commonDefsContent = commonDefsContent.slice(0, insertPoint) + insertion + '\n' + commonDefsContent.slice(insertPoint);
            added++;
        }
    }
});

// Write the updated content back
fs.writeFileSync('./common-definitions.js', commonDefsContent);

console.log(`✅ Definition Integration Complete!`);
console.log(`   Updated: ${updated} placeholder definitions`);
console.log(`   Added: ${added} new definitions`);
console.log(`   Total definitions available: ${Object.keys(puzzleDefinitions).length}`);

// Also create a summary of words per puzzle
const puzzleWordCounts = {
    "CORNERSTONES": 208,
    "AVAILABILITY": 51,
    "EXPERIMENTAL": 216,
    "TECHNOLOGIES": 165,
    "CHAMPIONSHIP": 108,
    "UNIVERSITIES": 105,
    "NEIGHBORHOOD": 70,
    "THANKSGIVING": 95,
    "ENCYCLOPEDIA": 74,
    "BREAKTHROUGH": 85
};

console.log('\n📊 Words per puzzle:');
Object.entries(puzzleWordCounts).forEach(([puzzle, count]) => {
    console.log(`   ${puzzle}: ${count} words`);
});