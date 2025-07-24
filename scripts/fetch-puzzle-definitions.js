#!/usr/bin/env node

// Fetch Definitions for Puzzle Words Only
// This script fetches definitions only for words that are used in puzzles and missing definitions

import fs from 'fs/promises';
import { DatamuseClient } from './datamuseClient.js';

// Load the list of words needing definitions
const loadWordsNeedingDefinitions = async () => {
    try {
        const content = await fs.readFile('../words-needing-definitions.json', 'utf8');
        const data = JSON.parse(content);
        return data.words || [];
    } catch (error) {
        console.error('Failed to load words needing definitions:', error.message);
        return [];
    }
};

// Load existing definitions
const loadExistingDefinitions = async () => {
    try {
        const defsContent = await fs.readFile('../src/data/word-definitions.js', 'utf8');
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

// Fetch definition from APIs
const fetchDefinition = async (word, datamuseClient) => {
    try {
        // Try Datamuse API first
        const defData = await datamuseClient.fetchDefinition(word);
        if (defData && defData.definition && defData.definition.trim()) {
            return { source: 'datamuse', definition: defData.definition.trim() };
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
                    return { source: 'free-dictionary', definition: definition.trim() };
                }
            }
        }
    } catch (error) {
        console.warn(`Free Dictionary failed for ${word}: ${error.message}`);
    }
    
    return null;
};

// Update definitions file
const updateDefinitionsFile = async (newDefinitions, existingDefinitions) => {
    const mergedDefinitions = { ...existingDefinitions, ...newDefinitions };
    
    const definitionsCode = Object.entries(mergedDefinitions)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([word, def]) => `    "${word}": "${def.replace(/"/g, '\\"')}"`)
        .join(',\n');

    const updatedDefinitionsFile = `// Common word definitions for the Cornerstones game (updated)
// Generated: ${new Date().toISOString()}
// Definitions: ${Object.keys(mergedDefinitions).length} (added ${Object.keys(newDefinitions).length} new)

export const COMMON_DEFINITIONS = {
${definitionsCode}
};`;

    await fs.writeFile('../src/data/word-definitions.js', updatedDefinitionsFile, 'utf8');
    console.log(`✅ Updated word-definitions.js with ${Object.keys(newDefinitions).length} new definitions`);
};

// Main function
const fetchPuzzleDefinitions = async () => {
    console.log('📚 Fetching Definitions for Puzzle Words');
    console.log('═'.repeat(50));
    
    // Load data
    const wordsNeeding = await loadWordsNeedingDefinitions();
    const existingDefinitions = await loadExistingDefinitions();
    
    console.log(`📝 Words needing definitions: ${wordsNeeding.length}`);
    console.log(`📖 Existing definitions: ${Object.keys(existingDefinitions).length}`);
    
    if (wordsNeeding.length === 0) {
        console.log('🎉 No words need definitions! All puzzle words are covered.');
        return;
    }
    
    // Initialize API client
    const datamuseClient = new DatamuseClient();
    
    const newDefinitions = {};
    let successCount = 0;
    let failCount = 0;
    
    console.log('\n🔍 Fetching definitions...');
    
    for (let i = 0; i < wordsNeeding.length; i++) {
        const word = wordsNeeding[i];
        console.log(`${i + 1}/${wordsNeeding.length}: ${word}`);
        
        const result = await fetchDefinition(word, datamuseClient);
        
        if (result) {
            newDefinitions[word.toUpperCase()] = result.definition;
            successCount++;
            console.log(`   ✅ Found definition (${result.source})`);
        } else {
            failCount++;
            console.log(`   ❌ No definition found`);
        }
        
        // Rate limiting - be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    console.log(`\n📊 Results:`);
    console.log(`   • Definitions found: ${successCount}/${wordsNeeding.length} (${Math.round(successCount/wordsNeeding.length*100)}%)`);
    console.log(`   • Failed to find: ${failCount}`);
    
    if (successCount > 0) {
        await updateDefinitionsFile(newDefinitions, existingDefinitions);
        console.log('🎉 Definition fetching complete!');
    } else {
        console.log('⚠️  No new definitions were found.');
    }
};

// Run the script
fetchPuzzleDefinitions().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});