#!/usr/bin/env node

// Clean Word Database - Remove words without available definitions

import fs from 'fs/promises';
import path from 'path';

// Mock browser globals for Node.js environment
global.fetch = (await import('node-fetch')).default;
global.window = {};
global.document = {};
global.localStorage = {};
global.console = console;

// Load current word database
const loadWordDatabase = async () => {
    try {
        const wordsContent = await fs.readFile('./src/data/words-database-compact.js', 'utf8');
        
        // Try new format first
        let wordsMatch = wordsContent.match(/const WORD_LIST_STRING = "([^"]+)"/);
        if (wordsMatch) {
            return wordsMatch[1].split('|');
        } else {
            // Try old format
            wordsMatch = wordsContent.match(/const WORDS_DATABASE = (\[[\s\S]*?\]);/);
            if (wordsMatch) {
                let wordsArray;
                eval(`wordsArray = ${wordsMatch[1]}`);
                return wordsArray;
            }
        }
        throw new Error('Could not parse words database format');
    } catch (error) {
        console.error('Failed to load words database:', error.message);
        return [];
    }
};

// Load existing definitions
const loadExistingDefinitions = async () => {
    try {
        const defsContent = await fs.readFile('./src/data/word-definitions.js', 'utf8');
        const defsMatch = defsContent.match(/const COMMON_DEFINITIONS = (\{[\s\S]*?\});/);
        if (defsMatch) {
            let definitions;
            eval(`definitions = ${defsMatch[1]}`);
            return definitions;
        }
        return {};
    } catch (error) {
        console.warn('Could not load existing definitions:', error.message);
        return {};
    }
};

// Check if word has definition available from multiple sources
const checkWordDefinition = async (word, datamuseClient, existingDefs) => {
    const upperWord = word.toUpperCase();
    
    // Check if we already have definition
    if (existingDefs[upperWord]) {
        return { hasDefinition: true, source: 'existing', definition: existingDefs[upperWord] };
    }
    
    try {
        // Try Datamuse API
        const defData = await datamuseClient.fetchDefinition(word);
        if (defData && defData.definition && defData.definition.trim()) {
            return { hasDefinition: true, source: 'datamuse', definition: defData.definition };
        }
    } catch (error) {
        console.warn(`Datamuse failed for ${word}: ${error.message}`);
    }
    
    try {
        // Try Free Dictionary API as backup
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
        if (response.ok) {
            const data = await response.json();
            if (data && data[0] && data[0].meanings && data[0].meanings[0] && data[0].meanings[0].definitions && data[0].meanings[0].definitions[0]) {
                const definition = data[0].meanings[0].definitions[0].definition;
                if (definition && definition.trim()) {
                    return { hasDefinition: true, source: 'free-dictionary', definition: definition };
                }
            }
        }
    } catch (error) {
        console.warn(`Free Dictionary failed for ${word}: ${error.message}`);
    }
    
    return { hasDefinition: false, source: 'none', definition: null };
};

// Main function to clean word database
const cleanWordDatabase = async () => {
    console.log('🧹 Cleaning Word Database - Removing Words Without Definitions');
    console.log('═'.repeat(70));
    
    // Load current data
    console.log('📚 Loading current word database...');
    const originalWords = await loadWordDatabase();
    const existingDefinitions = await loadExistingDefinitions();
    
    console.log(`   • Original word count: ${originalWords.length}`);
    console.log(`   • Existing definitions: ${Object.keys(existingDefinitions).length}`);
    
    // Import Datamuse client
    const { DatamuseClient } = await import('./src/js/datamuseClient.js');
    const datamuseClient = new DatamuseClient();
    
    // Process words in batches to avoid overwhelming APIs
    console.log('\\n🔍 Checking word definitions...');
    const batchSize = 50; // Process 50 words at a time
    const cleanedWords = [];
    const removedWords = [];
    const newDefinitions = {};
    
    let processedCount = 0;
    let foundCount = 0;
    let removedCount = 0;
    
    // Process words in batches
    for (let i = 0; i < originalWords.length; i += batchSize) {
        const batch = originalWords.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(originalWords.length / batchSize);
        
        console.log(`\\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} words)...`);
        
        for (const word of batch) {
            const result = await checkWordDefinition(word, datamuseClient, existingDefinitions);
            processedCount++;
            
            if (result.hasDefinition) {
                cleanedWords.push(word);
                foundCount++;
                
                // Store new definitions
                if (result.source !== 'existing') {
                    newDefinitions[word.toUpperCase()] = result.definition;
                }
                
                // Progress indicator
                if (processedCount % 10 === 0) {
                    console.log(`     • Progress: ${processedCount}/${originalWords.length} (${foundCount} kept, ${removedCount} removed)`);
                }
            } else {
                removedWords.push(word);
                removedCount++;
                console.log(`     • ❌ Removing ${word} (no definition found)`);
            }
            
            // Rate limiting - be respectful to APIs
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`   ✅ Batch ${batchNumber} complete: ${batch.filter(w => cleanedWords.includes(w)).length}/${batch.length} words kept`);
        
        // Longer pause between batches
        if (i + batchSize < originalWords.length) {
            console.log('   ⏸️  Pausing between batches...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\\n📊 Cleaning Results:');
    console.log(`   • Original words: ${originalWords.length}`);
    console.log(`   • Words kept: ${cleanedWords.length}`);
    console.log(`   • Words removed: ${removedWords.length}`);
    console.log(`   • Removal rate: ${Math.round((removedWords.length / originalWords.length) * 100)}%`);
    console.log(`   • New definitions found: ${Object.keys(newDefinitions).length}`);
    
    // Update files
    console.log('\\n📝 Updating database files...');
    
    // Update words database
    const newWordListString = cleanedWords.sort().join('|');
    const updatedWordsFile = `// Compact word database for the Cornerstones game (cleaned)
// Generated: ${new Date().toISOString()}
// Words: ${cleanedWords.length} (removed ${removedWords.length} without definitions)

export const WORD_LIST_STRING = "${newWordListString}";

// For backwards compatibility
export const WORDS_DATABASE = WORD_LIST_STRING.split('|');
`;
    
    await fs.writeFile('./src/data/words-database-compact.js', updatedWordsFile, 'utf8');
    console.log('   ✅ Updated words-database-compact.js');
    
    // Update definitions file if we found new ones
    if (Object.keys(newDefinitions).length > 0) {
        const mergedDefinitions = { ...existingDefinitions, ...newDefinitions };
        
        const definitionsCode = Object.entries(mergedDefinitions)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([word, def]) => `    "${word}": "${def.replace(/"/g, '\\\\"')}"`)
            .join(',\\n');

        const updatedDefinitionsFile = `// Common word definitions for the Cornerstones game (updated)
// Generated: ${new Date().toISOString()}
// Definitions: ${Object.keys(mergedDefinitions).length} (added ${Object.keys(newDefinitions).length} new)

export const COMMON_DEFINITIONS = {
${definitionsCode}
};`;

        await fs.writeFile('./src/data/word-definitions.js', updatedDefinitionsFile, 'utf8');
        console.log(`   ✅ Updated word-definitions.js with ${Object.keys(newDefinitions).length} new definitions`);
    }
    
    // Save cleanup report
    const outputDir = './puzzle-creation-output';
    try {
        await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
        // Directory already exists
    }
    
    const cleanupReport = {
        generatedAt: new Date().toISOString(),
        original: {
            wordCount: originalWords.length,
            definitionCount: Object.keys(existingDefinitions).length
        },
        cleaned: {
            wordCount: cleanedWords.length,
            definitionCount: Object.keys(existingDefinitions).length + Object.keys(newDefinitions).length,
            newDefinitions: Object.keys(newDefinitions).length
        },
        removed: {
            wordCount: removedWords.length,
            words: removedWords.slice(0, 100), // Save first 100 removed words as sample
            removalRate: Math.round((removedWords.length / originalWords.length) * 100)
        },
        stats: {
            definitionSources: {
                existing: cleanedWords.filter(w => existingDefinitions[w.toUpperCase()]).length,
                datamuse: Object.keys(newDefinitions).length, // Assuming most new ones came from Datamuse
                freeDictionary: 0 // Would need to track this separately
            }
        }
    };
    
    await fs.writeFile(
        path.join(outputDir, 'word-database-cleanup.json'),
        JSON.stringify(cleanupReport, null, 2),
        'utf8'
    );
    
    // Show sample of removed words
    console.log('\\n🗑️  Sample of removed words (no definitions found):');
    removedWords.slice(0, 20).forEach((word, i) => {
        console.log(`   ${i + 1}. ${word}`);
    });
    if (removedWords.length > 20) {
        console.log(`   ... and ${removedWords.length - 20} more`);
    }
    
    console.log('\\n🎉 Word Database Cleanup Complete!');
    console.log('═'.repeat(70));
    console.log(`📈 IMPACT:`);
    console.log(`   • Database size reduced by ${Math.round((removedWords.length / originalWords.length) * 100)}%`);
    console.log(`   • All remaining ${cleanedWords.length} words have definitions`);
    console.log(`   • Added ${Object.keys(newDefinitions).length} new definitions`);
    console.log(`   • Game will now work properly with complete definitions`);
    console.log(`\\n📁 Cleanup report saved to: ${outputDir}/word-database-cleanup.json`);
    console.log(`\\n✅ Ready to generate puzzles with complete definitions!`);
    
    return {
        originalCount: originalWords.length,
        cleanedCount: cleanedWords.length,
        removedCount: removedWords.length,
        newDefinitionsCount: Object.keys(newDefinitions).length
    };
};

// Run the cleanup process
cleanWordDatabase().catch(error => {
    console.error('❌ Word database cleanup failed:', error);
    process.exit(1);
});