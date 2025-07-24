#!/usr/bin/env node

// Clean up low-quality definitions from word-definitions.js
import fs from 'fs/promises';

async function cleanDefinitions() {
    console.log('🧹 Cleaning low-quality word definitions...');
    console.log('═'.repeat(50));

    try {
        // Read the word definitions file
        const content = await fs.readFile('src/data/word-definitions.js', 'utf8');
        
        // Extract the definitions object
        const objectMatch = content.match(/const COMMON_DEFINITIONS = \{([\s\S]*?)\};/);
        if (!objectMatch) {
            throw new Error('Could not find COMMON_DEFINITIONS object');
        }
        
        const objectContent = objectMatch[1];
        
        // Parse entries line by line
        const lines = objectContent.split('\n');
        const cleanedLines = [];
        let removedCount = 0;
        const removedWords = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Skip empty lines and preserve them
            if (!trimmed) {
                cleanedLines.push(line);
                continue;
            }
            
            // Extract word and definition if it's a definition line
            const match = trimmed.match(/^"([^"]+)":\s*"([^"]*)"[,]?$/);
            if (match) {
                const [, word, definition] = match;
                
                // Check if definition should be removed
                const shouldRemove = (
                    // Surname definitions
                    definition.includes('A surname') ||
                    definition.includes('surname from') ||
                    definition.includes('surname originating') ||
                    definition.includes('surname common') ||
                    // Personal name definitions
                    definition.includes('given name') ||
                    definition.includes('male given name') ||
                    definition.includes('female given name') ||
                    // Single letter definitions
                    /^[A-Z], the \d+(st|nd|rd|th) letter/.test(definition) ||
                    // Very short or unhelpful definitions
                    definition.length < 10 ||
                    definition === '' ||
                    // Generic place names without context
                    (definition.includes('A city') && definition.length < 50) ||
                    (definition.includes('A town') && definition.length < 50) ||
                    // Generic "A genus" without useful context
                    (definition.includes('a genus') && definition.length < 80)
                );
                
                if (shouldRemove) {
                    console.log(`❌ Removing ${word}: ${definition.substring(0, 60)}...`);
                    removedCount++;
                    removedWords.push(word);
                } else {
                    cleanedLines.push(line);
                }
            } else {
                // Keep non-definition lines as-is
                cleanedLines.push(line);
            }
        }
        
        // Rebuild the file content
        const cleanedObjectContent = cleanedLines.join('\n');
        const newContent = content.replace(
            /const COMMON_DEFINITIONS = \{([\s\S]*?)\};/,
            `const COMMON_DEFINITIONS = {${cleanedObjectContent}};`
        );
        
        // Write the cleaned file
        await fs.writeFile('src/data/word-definitions.js', newContent, 'utf8');
        
        console.log(`\n✅ Cleaned definitions file:`);
        console.log(`   • Total definitions removed: ${removedCount}`);
        console.log(`   • Remaining definitions: ${2477 - removedCount}`);
        
        // Show sample of removed words
        const sampleRemoved = removedWords.slice(0, 20);
        console.log(`   • Sample removed words: ${sampleRemoved.join(', ')}${removedWords.length > 20 ? '...' : ''}`);
        
        console.log('\n🎉 Definition cleanup complete!');
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
        process.exit(1);
    }
}

// Run the cleanup
cleanDefinitions();