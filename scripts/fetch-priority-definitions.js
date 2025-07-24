#!/usr/bin/env node

// Fetch definitions for priority puzzle words
import fs from 'fs/promises';
import { EnhancedDefinitionFetcher } from './enhancedDefinitionFetcher.js';
import { COMMON_DEFINITIONS } from '../src/data/word-definitions.js';

async function fetchPriorityDefinitions() {
    console.log('📚 Fetching Definitions for Priority Puzzle Words');
    console.log('══════════════════════════════════════════════════');
    
    try {
        // Load priority words
        const urgentWordsData = await fs.readFile('../urgent-placeholder-words.json', 'utf8');
        const urgentWords = JSON.parse(urgentWordsData).words;
        
        console.log(`\n📝 Priority words to fetch: ${urgentWords.length}`);
        console.log(`   • High priority (3-4 puzzles): 7 words`);
        console.log(`   • Medium priority (2 puzzles): 22 words`);
        
        // Initialize fetcher
        const fetcher = new EnhancedDefinitionFetcher({
            rateLimitPerSecond: 5, // Conservative rate limit
            batchSize: 10,
            retryAttempts: 3
        });
        
        // Load existing definitions
        await fetcher.loadExistingDefinitions(COMMON_DEFINITIONS);
        
        // Fetch definitions for priority words
        console.log('\n🔍 Fetching definitions...');
        const results = await fetcher.fetchDefinitionsForWords(urgentWords);
        
        // Show results
        console.log('\n📊 Results Summary:');
        console.log(`   • Total words processed: ${urgentWords.length}`);
        console.log(`   • Definitions found: ${results.successCount}`);
        console.log(`   • Failed to fetch: ${results.failureCount}`);
        console.log(`   • API calls made: ${fetcher.stats.dataumusCalls + fetcher.stats.freeDictCalls}`);
        console.log(`   • Cache hits: ${fetcher.stats.cacheHits}`);
        
        // Update definitions file if we found new definitions
        if (results.newDefinitions && Object.keys(results.newDefinitions).length > 0) {
            console.log('\n💾 Updating word-definitions.js...');
            
            // Read current file
            const defsContent = await fs.readFile('../src/data/word-definitions.js', 'utf8');
            
            // Find the closing brace
            const lastBraceIndex = defsContent.lastIndexOf('}');
            
            // Add new definitions
            const newDefsString = Object.entries(results.newDefinitions)
                .map(([word, def]) => `    "${word}": "${def.replace(/"/g, '\\"')}"`)
                .join(',\n');
            
            const updatedContent = 
                defsContent.slice(0, lastBraceIndex - 1) + 
                ',\n' + newDefsString + '\n' +
                defsContent.slice(lastBraceIndex);
            
            await fs.writeFile('../src/data/word-definitions.js', updatedContent);
            console.log(`✅ Added ${Object.keys(results.newDefinitions).length} new definitions`);
            
            // Show which words got definitions
            console.log('\n📋 New definitions added for:');
            Object.keys(results.newDefinitions).forEach(word => {
                console.log(`   • ${word}`);
            });
        }
        
        // Show failed words
        if (results.failedWords && results.failedWords.length > 0) {
            console.log('\n⚠️  Failed to find definitions for:');
            results.failedWords.forEach(word => {
                console.log(`   • ${word}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
fetchPriorityDefinitions().catch(console.error);