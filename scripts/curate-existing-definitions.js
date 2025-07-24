#!/usr/bin/env node

// Script to curate existing word definitions by removing offensive content
import fs from 'fs/promises';
import { EnhancedDefinitionFetcher } from './enhancedDefinitionFetcher.js';

async function curateExistingDefinitions() {
    console.log('🧹 Curating existing word definitions...');
    console.log('═'.repeat(50));

    try {
        // Read the word definitions file
        const content = await fs.readFile('src/data/word-definitions.js', 'utf8');
        
        // Create fetcher instance for offensive content detection
        const fetcher = new EnhancedDefinitionFetcher();
        
        // Words we know have offensive markers
        const suspiciousWords = ['CHOLO', 'CHOLOS', 'ERSE', 'GINK', 'GINKS', 'HOBO', 'HOON', 'SPED', 'STAN', 'TAIG'];
        
        let updatedContent = content;
        let removedCount = 0;
        
        // Check each suspicious word
        for (const word of suspiciousWords) {
            // Look for the word's definition in the file
            const regex = new RegExp(`\\s*"${word}": "[^"]*",?\\n`, 'g');
            const match = updatedContent.match(regex);
            
            if (match) {
                // Extract the definition to test
                const defMatch = match[0].match(`"${word}": "([^"]*)"`);
                if (defMatch) {
                    const definition = defMatch[1];
                    
                    // Test if it contains offensive content
                    if (fetcher.containsOffensiveContent(word, definition)) {
                        console.log(`❌ Removing ${word}: ${definition.substring(0, 60)}...`);
                        updatedContent = updatedContent.replace(regex, '');
                        removedCount++;
                        
                        // Mark for database removal too
                        fetcher.curator.markWordAsInvalid(word);
                    } else {
                        console.log(`✅ Keeping ${word}: passed content filter`);
                    }
                }
            }
        }
        
        // Clean up any double commas or trailing commas
        updatedContent = updatedContent.replace(/,(\\s*,)+/g, ',');
        updatedContent = updatedContent.replace(/,(\\s*)\\}/g, '$1}');
        
        // Write back the cleaned definitions
        if (removedCount > 0) {
            await fs.writeFile('src/data/word-definitions.js', updatedContent, 'utf8');
            console.log(`\\n✅ Removed ${removedCount} offensive word definitions`);
            
            // Also curate the word database
            console.log('\\n🧹 Curating word database...');
            const dbResults = await fetcher.curateWordDatabase();
            console.log(`   • Removed ${dbResults.wordsRemoved} words from database`);
        } else {
            console.log('\\n✅ No offensive definitions found to remove');
        }
        
        console.log('\\n🎉 Definition curation complete!');
        
    } catch (error) {
        console.error('❌ Curation failed:', error.message);
        process.exit(1);
    }
}

// Run the curation
curateExistingDefinitions();