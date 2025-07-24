#!/usr/bin/env node

// Simple script to fetch priority definitions
import fs from 'fs/promises';
import { DatamuseClient } from './datamuseClient.js';

async function fetchPriorityDefinitions() {
    console.log('📚 Fetching Definitions for Priority Puzzle Words');
    console.log('══════════════════════════════════════════════════');
    
    try {
        // Load priority words
        const urgentWordsData = await fs.readFile('../urgent-placeholder-words.json', 'utf8');
        const urgentWords = JSON.parse(urgentWordsData);
        
        console.log(`\n📝 Priority words to fetch: ${urgentWords.length}`);
        
        // Initialize Datamuse client
        const datamuseClient = new DatamuseClient();
        
        // Results storage
        const newDefinitions = {};
        const failedWords = [];
        
        // Fetch definitions
        console.log('\n🔍 Fetching definitions...');
        
        for (const word of urgentWords) {
            try {
                console.log(`   • Fetching ${word}...`);
                const result = await datamuseClient.fetchDefinition(word);
                
                if (result && result.definition) {
                    newDefinitions[word] = result.definition;
                    console.log(`     ✓ Found definition`);
                } else {
                    failedWords.push(word);
                    console.log(`     ✗ No definition found`);
                }
                
                // Small delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.log(`     ✗ Error: ${error.message}`);
                failedWords.push(word);
            }
        }
        
        // Show results
        console.log('\n📊 Results Summary:');
        console.log(`   • Total words processed: ${urgentWords.length}`);
        console.log(`   • Definitions found: ${Object.keys(newDefinitions).length}`);
        console.log(`   • Failed to fetch: ${failedWords.length}`);
        
        // Save new definitions to a JSON file for manual review
        if (Object.keys(newDefinitions).length > 0) {
            console.log('\n💾 Saving new definitions to new-definitions.json...');
            
            await fs.writeFile(
                '../new-definitions.json',
                JSON.stringify({ definitions: newDefinitions, failed: failedWords }, null, 2)
            );
            
            console.log('✅ Saved new definitions for manual review');
            console.log('\n📋 New definitions found for:');
            Object.keys(newDefinitions).forEach(word => {
                console.log(`   • ${word}`);
            });
        }
        
        if (failedWords.length > 0) {
            console.log('\n⚠️  Failed to find definitions for:');
            failedWords.forEach(word => {
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