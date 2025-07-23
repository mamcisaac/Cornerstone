const fs = require('fs');
const path = require('path');

// New puzzle words that need to be added
const newPuzzleWords = {
    "DEVELOPMENTS": {
        word: "DEVELOPMENTS",
        definition: "The process of developing or being developed; new and advanced products or ideas"
    },
    "CONVERSATION": {
        word: "CONVERSATION",
        definition: "A talk between two or more people in which thoughts, feelings, and ideas are expressed"
    }
};

// Read the current seed-words.js file
const seedWordsPath = path.join(__dirname, '../src/data/seed-words.js');
let content = fs.readFileSync(seedWordsPath, 'utf8');

// Find the end of the SEED_WORDS object (before the closing brace)
const lastEntryRegex = /    "([A-Z]+)": \{[^}]+\}(\s*)\};/;
const match = content.match(lastEntryRegex);

if (match) {
    // Add the new entries before the closing brace
    let newEntries = '';
    Object.entries(newPuzzleWords).forEach(([key, value]) => {
        // Check if the word already exists
        if (!content.includes(`"${key}"`)) {
            newEntries += `,\n    "${key}": {\n        word: "${value.word}",\n        definition: "${value.definition}"\n    }`;
        }
    });
    
    if (newEntries) {
        // Replace the last entry with the last entry + new entries + closing
        const replacement = match[0].replace('};', newEntries + '\n};');
        content = content.replace(lastEntryRegex, replacement);
        
        // Write the updated content back
        fs.writeFileSync(seedWordsPath, content);
        console.log('✅ Updated seed-words.js with new puzzle words');
        console.log('Added:', Object.keys(newPuzzleWords).filter(key => !content.includes(`"${key}"`)));
    } else {
        console.log('ℹ️ All puzzle words already exist in seed-words.js');
    }
} else {
    console.log('❌ Could not find the SEED_WORDS object structure');
}