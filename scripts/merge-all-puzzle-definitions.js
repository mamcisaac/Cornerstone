#!/usr/bin/env node

/**
 * Script to merge definitions from all-puzzle-definitions.js into word-definitions.js
 * It will:
 * 1. Extract all unique definitions from all-puzzle-definitions.js
 * 2. Compare with existing definitions in word-definitions.js (COMMON_DEFINITIONS)
 * 3. Keep the better/longer definition when there are duplicates
 * 4. Update word-definitions.js with all the merged definitions
 */

const fs = require('fs');
const path = require('path');

// Load the all-puzzle-definitions.js file
const allPuzzleDefsPath = path.join(__dirname, '../src/data/all-puzzle-definitions.js');
const wordDefsPath = path.join(__dirname, '../src/data/word-definitions.js');

// Read and parse all-puzzle-definitions.js
const allPuzzleContent = fs.readFileSync(allPuzzleDefsPath, 'utf8');
const ALL_PUZZLE_DEFINITIONS = eval(allPuzzleContent.replace('module.exports = ', ''));

// Read the current word-definitions.js to extract existing definitions
const wordDefsContent = fs.readFileSync(wordDefsPath, 'utf8');

// Extract COMMON_DEFINITIONS object from word-definitions.js
const commonDefsMatch = wordDefsContent.match(/const COMMON_DEFINITIONS = \{[\s\S]*?\n\};/);
if (!commonDefsMatch) {
    console.error('Could not find COMMON_DEFINITIONS in word-definitions.js');
    process.exit(1);
}

// Parse existing COMMON_DEFINITIONS
let existingDefs = {};
try {
    // Extract just the object content
    const objContent = commonDefsMatch[0].replace('const COMMON_DEFINITIONS = ', '').replace(/;$/, '');
    existingDefs = eval(`(${objContent})`);
} catch (error) {
    console.error('Error parsing existing COMMON_DEFINITIONS:', error);
    process.exit(1);
}

// Function to determine if a definition is better than another
function isBetterDefinition(newDef, oldDef) {
    // If old definition is just "A valid English word" or similar generic, new is better
    if (oldDef.includes('A valid English word') || 
        oldDef.includes('A common English word') ||
        oldDef.includes('A short English word') ||
        oldDef.includes('A longer English word')) {
        return true;
    }
    
    // If new definition is generic, keep old
    if (newDef.includes('A valid English word')) {
        return false;
    }
    
    // Otherwise, prefer the longer, more detailed definition
    return newDef.length > oldDef.length;
}

// Merge all definitions
const mergedDefinitions = { ...existingDefs };
let updatedCount = 0;
let newCount = 0;

// First, process the COMMON_DEFINITIONS from all-puzzle-definitions
if (ALL_PUZZLE_DEFINITIONS.COMMON_DEFINITIONS) {
    for (const [word, def] of Object.entries(ALL_PUZZLE_DEFINITIONS.COMMON_DEFINITIONS)) {
        if (mergedDefinitions[word]) {
            if (isBetterDefinition(def, mergedDefinitions[word])) {
                console.log(`Updating ${word}: "${mergedDefinitions[word]}" -> "${def}"`);
                mergedDefinitions[word] = def;
                updatedCount++;
            }
        } else {
            mergedDefinitions[word] = def;
            newCount++;
        }
    }
}

// Then process all other words in ALL_PUZZLE_DEFINITIONS
for (const [word, def] of Object.entries(ALL_PUZZLE_DEFINITIONS)) {
    if (word === 'COMMON_DEFINITIONS') continue; // Skip the nested object
    
    if (mergedDefinitions[word]) {
        if (isBetterDefinition(def, mergedDefinitions[word])) {
            console.log(`Updating ${word}: "${mergedDefinitions[word]}" -> "${def}"`);
            mergedDefinitions[word] = def;
            updatedCount++;
        }
    } else {
        mergedDefinitions[word] = def;
        newCount++;
    }
}

// Sort definitions alphabetically
const sortedDefinitions = {};
Object.keys(mergedDefinitions)
    .sort()
    .forEach(key => {
        sortedDefinitions[key] = mergedDefinitions[key];
    });

// Generate the new word-definitions.js content
let newContent = `// Definitions for common English words (4+ letters)
// This provides basic definitions for cornerstone words

const COMMON_DEFINITIONS = {
`;

// Add all definitions
for (const [word, def] of Object.entries(sortedDefinitions)) {
    // Escape quotes in definition
    const escapedDef = def.replace(/"/g, '\\"');
    newContent += `  "${word}": "${escapedDef}",\n`;
}

// Remove the last comma and close the object
newContent = newContent.slice(0, -2) + '\n};\n';

// Add the rest of the word-definitions.js file (cache, functions, etc.)
const restOfFile = wordDefsContent.substring(wordDefsContent.indexOf('// Cache for fetched definitions'));
newContent += '\n' + restOfFile;

// Write the updated file
fs.writeFileSync(wordDefsPath, newContent);

console.log(`
Merge completed successfully!
- Updated definitions: ${updatedCount}
- New definitions added: ${newCount}
- Total definitions: ${Object.keys(sortedDefinitions).length}
`);

// Create a backup of the original file
const backupPath = wordDefsPath + '.backup.' + new Date().toISOString().replace(/:/g, '-');
fs.writeFileSync(backupPath, wordDefsContent);
console.log(`Backup saved to: ${backupPath}`);