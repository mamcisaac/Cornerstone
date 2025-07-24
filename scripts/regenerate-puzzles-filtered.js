#!/usr/bin/env node

// Regenerate all puzzles using only words with definitions
import fs from 'fs/promises';
import { PuzzleBuilder } from './puzzleBuilder.js';
import { GridGenerator } from './gridGenerator.js';

// Mock browser globals for Node.js environment
global.fetch = (await import('node-fetch')).default;
global.window = {};

// Load game data
const loadGameData = async () => {
    // Load keystone words
    const keystoneContent = await fs.readFile('../src/data/keystone-words.js', 'utf8');
    eval(keystoneContent.replace(/export /g, 'global.'));
    
    // Load cornerstone words
    const cornerstoneContent = await fs.readFile('../src/data/cornerstone-words.js', 'utf8');
    eval(cornerstoneContent.replace(/export /g, 'global.'));
    
    // Load word definitions
    const defsContent = await fs.readFile('../src/data/word-definitions.js', 'utf8');
    eval(defsContent.replace(/export /g, 'global.'));
    
    // Load word database and COMPREHENSIVE_WORD_SET
    const wordsContent = await fs.readFile('../src/data/words-database-compact.js', 'utf8');
    // Execute in a way that handles the imports
    const modifiedContent = wordsContent
        .replace(/import.*from.*;\s*/g, '') // Remove import statements
        .replace(/export /g, 'global.');
    eval(modifiedContent);
    
    console.log(`Loaded ${Object.keys(global.KEYSTONE_WORDS).length} keystone words`);
    console.log(`Word database size: ${global.WORDS_DATABASE.length}`);
    console.log(`Filtered word set size: ${global.COMPREHENSIVE_WORD_SET?.size || 0}`);
};

async function regeneratePuzzles() {
    console.log('🎮 Regenerating Puzzles with Filtered Words');
    console.log('══════════════════════════════════════════════════');
    
    try {
        await loadGameData();
        
        const builder = new PuzzleBuilder({ cleanWords: true });
        const gridGen = new GridGenerator();
        
        // Wait for word sets to load
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`\n📊 Word Statistics:`);
        console.log(`   • Total words in database: ${global.WORDS_DATABASE.length}`);
        console.log(`   • Words with definitions: ${global.COMPREHENSIVE_WORD_SET?.size || 0}`);
        console.log(`   • Common words: ${builder.commonWords.size}`);
        
        const results = [];
        const keystoneWords = Object.keys(global.KEYSTONE_WORDS);
        
        console.log(`\n🔧 Generating puzzles for ${keystoneWords.length} keystone words...`);
        
        for (const keystoneWord of keystoneWords) {
            console.log(`\n📝 Processing: ${keystoneWord}`);
            
            // Build puzzle
            const puzzleData = await builder.buildPuzzle(keystoneWord);
            
            if (!puzzleData || !puzzleData.success) {
                console.log(`   ❌ Failed to generate puzzle`);
                continue;
            }
            
            console.log(`   ✅ Generated puzzle with ${puzzleData.validWords.size} valid words`);
            console.log(`   📚 Cornerstone words: ${puzzleData.cornerstoneWords.size}`);
            
            // Generate grid from path
            const grid = gridGen.createGridFromPath(puzzleData.path, keystoneWord);
            
            results.push({
                keystone: keystoneWord,
                grid: grid,
                path: puzzleData.path,
                validWords: Array.from(puzzleData.validWords),
                cornerstoneWords: Array.from(puzzleData.cornerstoneWords),
                crossPositions: puzzleData.crossPositions
            });
        }
        
        // Save results
        console.log(`\n💾 Saving ${results.length} puzzles...`);
        
        await fs.writeFile(
            '../regenerated-puzzles.json',
            JSON.stringify(results, null, 2)
        );
        
        console.log('✅ Puzzles regenerated successfully!');
        
        // Summary
        console.log('\n📊 Summary:');
        console.log(`   • Puzzles generated: ${results.length}/${keystoneWords.length}`);
        
        results.forEach(puzzle => {
            console.log(`\n   ${puzzle.keystone}:`);
            console.log(`     • Valid words: ${puzzle.validWords.length}`);
            console.log(`     • Cornerstone words: ${puzzle.cornerstoneWords.length}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
regeneratePuzzles().catch(console.error);