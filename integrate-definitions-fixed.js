// Better integration script that handles duplicates and gets all definitions
const fs = require('fs');

// Read all-puzzle-definitions.js and extract ALL definitions
const fileContent = fs.readFileSync('./all-puzzle-definitions.js', 'utf8');

// Parse all JSON objects to get definitions
const allDefinitions = {};

// Extract all key-value pairs from the file
const matches = fileContent.matchAll(/"([A-Z]+)": "([^"]+)"/g);

for (const match of matches) {
    const word = match[1];
    const definition = match[2];
    
    // Keep the best definition (not a placeholder)
    if (!allDefinitions[word] || 
        allDefinitions[word].includes('valid English word') ||
        allDefinitions[word].includes('common English word')) {
        if (!definition.includes('valid English word') && 
            !definition.includes('common English word')) {
            allDefinitions[word] = definition;
        } else if (!allDefinitions[word]) {
            allDefinitions[word] = definition;
        }
    }
}

console.log(`Extracted ${Object.keys(allDefinitions).length} unique words`);

// Count how many have real definitions
const realDefs = Object.values(allDefinitions).filter(def => 
    !def.includes('valid English word') && !def.includes('common English word')
).length;
console.log(`${realDefs} have real definitions`);

// Now update common-definitions.js
let commonDefsContent = fs.readFileSync('./common-definitions.js', 'utf8');

let updated = 0;
let added = 0;

// Process each definition
Object.entries(allDefinitions).forEach(([word, definition]) => {
    const upperWord = word.toUpperCase();
    
    // Check if word exists in common-definitions.js
    const existingPattern = new RegExp(`"${upperWord}":\\s*"([^"]*)"`, 'g');
    const match = existingPattern.exec(commonDefsContent);
    
    if (match) {
        const currentDef = match[1];
        // Only update if current is placeholder and new is not
        if ((currentDef.includes('valid English word') || currentDef.includes('common English word')) &&
            !definition.includes('valid English word') && !definition.includes('common English word')) {
            
            commonDefsContent = commonDefsContent.replace(
                new RegExp(`"${upperWord}":\\s*"[^"]*"`),
                `"${upperWord}": "${definition.replace(/"/g, '\\"')}"`
            );
            updated++;
        }
    } else {
        // Word doesn't exist, add it if it's not a placeholder
        if (!definition.includes('valid English word') && !definition.includes('common English word')) {
            const insertPoint = commonDefsContent.lastIndexOf('};');
            if (insertPoint !== -1) {
                const insertion = `,\n  "${upperWord}": "${definition.replace(/"/g, '\\"')}"`;
                commonDefsContent = commonDefsContent.slice(0, insertPoint) + insertion + '\n' + commonDefsContent.slice(insertPoint);
                added++;
            }
        }
    }
});

// Write the updated content back
fs.writeFileSync('./common-definitions.js', commonDefsContent);

console.log(`\n✅ Definition Integration Complete!`);
console.log(`   Updated: ${updated} placeholder definitions with real ones`);
console.log(`   Added: ${added} new definitions`);

// Show some examples of updated definitions
console.log('\n📝 Sample updated definitions:');
const samples = ['CORER', 'AVERS', 'HAVER', 'BITER', 'TREY'];
samples.forEach(word => {
    if (allDefinitions[word] && !allDefinitions[word].includes('valid English word')) {
        console.log(`   ${word}: "${allDefinitions[word].substring(0, 60)}${allDefinitions[word].length > 60 ? '...' : ''}"`);
    }
});