#!/usr/bin/env node

// Simple Node.js script to run puzzle generation
// This script bridges between the browser-based modules and Node.js filesystem operations

import fs from 'fs/promises';
import path from 'path';

// Mock browser globals for Node.js environment
global.fetch = (await import('node-fetch')).default;
global.window = {};
global.document = {};
global.localStorage = {};
global.console = console;

// Load existing game data
const loadGameData = async () => {
    const data = {};
    
    try {
        // Load keystone words
        const keystoneContent = await fs.readFile('./src/data/keystone-words.js', 'utf8');
        const keystoneMatch = keystoneContent.match(/const KEYSTONE_WORDS = (\{[\s\S]*?\});/);
        if (keystoneMatch) {
            eval(`data.KEYSTONE_WORDS = ${keystoneMatch[1]}`);
        }
    } catch (error) {
        console.warn('Could not load keystone words:', error.message);
        data.KEYSTONE_WORDS = {};
    }

    try {
        // Load common words
        const cornerstoneContent = await fs.readFile('./src/data/cornerstone-words.js', 'utf8');
        const commonMatch = cornerstoneContent.match(/const COMMON_WORDS_LIST = (\[[\s\S]*?\]);/);
        if (commonMatch) {
            eval(`data.COMMON_WORDS_LIST = ${commonMatch[1]}`);
        }
    } catch (error) {
        console.warn('Could not load common words:', error.message);
        data.COMMON_WORDS_LIST = [];
    }

    try {
        // Load words database
        const wordsContent = await fs.readFile('./src/data/words-database-compact.js', 'utf8');
        const wordsMatch = wordsContent.match(/const WORDS_DATABASE = (\[[\s\S]*?\]);/);
        if (wordsMatch) {
            eval(`data.WORDS_DATABASE = ${wordsMatch[1]}`);
        }
    } catch (error) {
        console.warn('Could not load words database:', error.message);
        data.WORDS_DATABASE = [];
    }

    try {
        // Load definitions
        const defsContent = await fs.readFile('./src/data/word-definitions.js', 'utf8');
        const defsMatch = defsContent.match(/const COMMON_DEFINITIONS = (\{[\s\S]*?\});/);
        if (defsMatch) {
            eval(`data.COMMON_DEFINITIONS = ${defsMatch[1]}`);
        }
    } catch (error) {
        console.warn('Could not load definitions:', error.message);
        data.COMMON_DEFINITIONS = {};
    }

    try {
        // Load sample puzzles
        const constContent = await fs.readFile('./src/js/constants.js', 'utf8');
        const sampleMatch = constContent.match(/export const SAMPLE_PUZZLES = (\{[\s\S]*?\});/);
        if (sampleMatch) {
            eval(`data.SAMPLE_PUZZLES = ${sampleMatch[1]}`);
        }
    } catch (error) {
        console.warn('Could not load sample puzzles:', error.message);
        data.SAMPLE_PUZZLES = {};
    }

    return data;
};

// Simple puzzle generation example
const runSimplePuzzleGeneration = async () => {
    console.log('🎯 Starting Simple Puzzle Generation');
    
    // Load game data
    console.log('📚 Loading existing game data...');
    const gameData = await loadGameData();
    
    // Set global variables for modules
    global.KEYSTONE_WORDS = gameData.KEYSTONE_WORDS;
    global.COMMON_WORDS_LIST = gameData.COMMON_WORDS_LIST;
    global.WORDS_DATABASE = gameData.WORDS_DATABASE;
    global.COMMON_DEFINITIONS = gameData.COMMON_DEFINITIONS;
    global.SAMPLE_PUZZLES = gameData.SAMPLE_PUZZLES;

    console.log(`   • Keystone words: ${Object.keys(gameData.KEYSTONE_WORDS).length}`);
    console.log(`   • Common words: ${gameData.COMMON_WORDS_LIST.length}`);
    console.log(`   • Words database: ${gameData.WORDS_DATABASE.length}`);
    console.log(`   • Definitions: ${Object.keys(gameData.COMMON_DEFINITIONS).length}`);

    // Import puzzle builder components
    console.log('🔧 Loading puzzle builder modules...');
    const { PuzzleBuilder } = await import('./src/js/puzzleBuilder.js');
    const { DataIntegration } = await import('./src/js/dataIntegration.js');

    // Initialize components
    const puzzleBuilder = new PuzzleBuilder();
    const dataIntegration = new DataIntegration();

    // Wait for puzzle builder to load word sets
    await puzzleBuilder.loadWordSets();
    
    // Test with a few keystone words
    const testWords = ['CORNERSTONES', 'TECHNOLOGIES', 'EXPERIMENTAL'];
    console.log(`🎮 Testing puzzle generation with: ${testWords.join(', ')}`);

    const results = [];
    for (const word of testWords) {
        console.log(`\n🔨 Generating puzzle for: ${word}`);
        try {
            const puzzle = await puzzleBuilder.generatePuzzle(word);
            if (puzzle) {
                const validation = puzzleBuilder.validatePuzzle(puzzle);
                if (validation.success) {
                    results.push(puzzle);
                    console.log(`✅ Success! Generated puzzle with ${puzzle.cornerstoneWords.length} cornerstone words`);
                } else {
                    console.log(`❌ Validation failed:`, validation.errors.slice(0, 2));
                }
            } else {
                console.log(`❌ Could not generate puzzle (insufficient cornerstone words)`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    if (results.length > 0) {
        console.log(`\n📊 Summary: Generated ${results.length} valid puzzles`);
        
        // Generate sample output
        console.log('📝 Generating sample output files...');
        const dataPackage = dataIntegration.generateCompleteDataPackage(
            results, 
            gameData.COMMON_DEFINITIONS, 
            gameData
        );

        // Create output directory
        const outputDir = './puzzle-output';
        try {
            await fs.mkdir(outputDir, { recursive: true });
        } catch (error) {
            // Directory already exists
        }

        // Save files
        for (const [filename, content] of Object.entries(dataPackage.files)) {
            const filepath = path.join(outputDir, filename);
            await fs.writeFile(filepath, content, 'utf8');
            console.log(`   • Saved ${filename} (${content.length} bytes)`);
        }

        // Save results summary
        const summary = {
            generatedAt: new Date().toISOString(),
            puzzleCount: results.length,
            puzzles: results.map(p => ({
                keystoneWord: p.keystoneWord,
                pathIndex: p.pathIndex,
                totalWords: p.allWords.length,
                cornerstoneWords: p.cornerstoneWords.length
            })),
            statistics: dataPackage.statistics
        };

        await fs.writeFile(
            path.join(outputDir, 'generation-summary.json'),
            JSON.stringify(summary, null, 2),
            'utf8'
        );

        console.log(`\n🎉 Complete! Files saved to: ${outputDir}`);
        console.log(`📁 Generated files:`);
        console.log(`   • keystone-words.js - Updated keystone words with definitions`);
        console.log(`   • constants-sample-puzzles.js - Sample puzzles for constants.js`);
        console.log(`   • word-definitions.js - Complete definitions database`);
        console.log(`   • words-database-compact.js - All valid words`);
        console.log(`   • generation-summary.json - Generation statistics`);

    } else {
        console.log('\n❌ No valid puzzles generated');
    }
};

// Check for command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🎯 Cornerstones Puzzle Generator

Usage: node generate-puzzles.js [options]

This script generates sample puzzles using the existing game data.

Options:
  --help, -h    Show this help message

Example:
  node generate-puzzles.js

The script will:
1. Load existing game data from src/data/
2. Generate puzzles for test keystone words
3. Save results to ./puzzle-output/

Requirements:
  - Node.js with ES modules support
  - npm install node-fetch (for API calls)
`);
    process.exit(0);
}

// Run the generation
runSimplePuzzleGeneration().catch(error => {
    console.error('❌ Generation failed:', error);
    process.exit(1);
});