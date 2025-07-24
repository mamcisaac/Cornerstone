#!/usr/bin/env node

// Filter words-database-compact.js to only include words with definitions
import fs from 'fs/promises';

async function filterWordDatabase() {
    console.log('🔧 Filtering word database to only include words with definitions...');
    
    try {
        // Load word definitions
        const defsContent = await fs.readFile('src/data/word-definitions.js', 'utf8');
        const defsMatch = defsContent.match(/export const COMMON_DEFINITIONS = \{([\s\S]*)\};/);
        
        if (!defsMatch) {
            throw new Error('Could not parse COMMON_DEFINITIONS from word-definitions.js');
        }
        
        // Extract defined words
        const definedWords = new Set();
        const defsText = defsMatch[1];
        const wordMatches = defsText.match(/"([A-Z]+)":/g);
        
        if (wordMatches) {
            wordMatches.forEach(match => {
                const word = match.slice(1, -2); // Remove quotes and colon
                definedWords.add(word);
            });
        }
        
        console.log(`   • Found ${definedWords.size} words with definitions`);
        
        // Load current word database
        const wordsContent = await fs.readFile('src/data/words-database-compact.js', 'utf8');
        const wordsMatch = wordsContent.match(/export const WORD_LIST_STRING = "([^"]+)"/);
        
        if (!wordsMatch) {
            throw new Error('Could not parse WORD_LIST_STRING from words-database-compact.js');
        }
        
        // Filter words
        const allWords = wordsMatch[1].split('|');
        const filteredWords = allWords.filter(word => definedWords.has(word.toUpperCase()));
        
        console.log(`   • Original word count: ${allWords.length}`);
        console.log(`   • Filtered word count: ${filteredWords.length}`);
        console.log(`   • Removed: ${allWords.length - filteredWords.length} words without definitions`);
        
        // Create new content
        const newWordListString = filteredWords.join('|');
        const newContent = `// Compact word database for the Cornerstones game (filtered to only include words with definitions)
// Generated: ${new Date().toISOString()}
// Words: ${filteredWords.length} (only words with definitions)

export const WORD_LIST_STRING = "${newWordListString}";

// For backwards compatibility
export const WORDS_DATABASE = WORD_LIST_STRING.split('|');

// Set up global access for compatibility
if (typeof window !== 'undefined') {
    window.WORDS_DATABASE = WORDS_DATABASE;
    window.WORD_LIST_STRING = WORD_LIST_STRING;
}
`;
        
        // Save the filtered database
        await fs.writeFile('src/data/words-database-compact.js', newContent);
        
        console.log('✅ Successfully filtered word database!');
        console.log(`   • Now contains only ${filteredWords.length} real dictionary words`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
filterWordDatabase().catch(console.error);