#!/usr/bin/env node

// Simple Puzzle Creation - Create puzzles and fetch definitions using Datamuse

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
        const keystoneContent = await fs.readFile('../src/data/keystone-words.js', 'utf8');
        const keystoneMatch = keystoneContent.match(/const KEYSTONE_WORDS = (\{[\s\S]*?\});/);
        if (keystoneMatch) {
            eval(`data.KEYSTONE_WORDS = ${keystoneMatch[1]}`);
        }
    } catch (error) {
        console.warn('Could not load keystone words:', error.message);
        data.KEYSTONE_WORDS = {};
    }

    try {
        const cornerstoneContent = await fs.readFile('../src/data/cornerstone-words.js', 'utf8');
        const commonMatch = cornerstoneContent.match(/const COMMON_WORDS_LIST = (\[[\s\S]*?\]);/);
        if (commonMatch) {
            eval(`data.COMMON_WORDS_LIST = ${commonMatch[1]}`);
        }
    } catch (error) {
        console.warn('Could not load common words:', error.message);
        data.COMMON_WORDS_LIST = [];
    }

    try {
        const wordsContent = await fs.readFile('../src/data/words-database-compact.js', 'utf8');
        let wordsMatch = wordsContent.match(/const WORD_LIST_STRING = "([^"]+)"/);
        if (wordsMatch) {
            data.WORDS_DATABASE = wordsMatch[1].split('|');
        } else {
            wordsMatch = wordsContent.match(/const WORDS_DATABASE = (\[[\s\S]*?\]);/);
            if (wordsMatch) {
                eval(`data.WORDS_DATABASE = ${wordsMatch[1]}`);
            }
        }
    } catch (error) {
        console.warn('Could not load words database:', error.message);
        data.WORDS_DATABASE = [];
    }

    try {
        const defsContent = await fs.readFile('../src/data/word-definitions.js', 'utf8');
        const defsMatch = defsContent.match(/const COMMON_DEFINITIONS = (\{[\s\S]*?\});/);
        if (defsMatch) {
            eval(`data.COMMON_DEFINITIONS = ${defsMatch[1]}`);
        }
    } catch (error) {
        console.warn('Could not load definitions:', error.message);
        data.COMMON_DEFINITIONS = {};
    }

    try {
        const constContent = await fs.readFile('./src/js/constants.js', 'utf8');
        const sampleMatch = constContent.match(/export const SAMPLE_PUZZLES = (\{[\s\S]*?\});/);
        if (sampleMatch) {
            eval(`data.SAMPLE_PUZZLES = ${sampleMatch[1]}`);
        } else {
            data.SAMPLE_PUZZLES = {};
        }
        
        const pathsMatch = constContent.match(/export const HAMILTONIAN_PATHS = (\[[\s\S]*?\]);/);
        if (pathsMatch) {
            eval(`data.HAMILTONIAN_PATHS = ${pathsMatch[1]}`);
        } else {
            data.HAMILTONIAN_PATHS = [
                [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11],
                [4, 5, 9, 8, 13, 14, 11, 7, 6, 10, 2, 1],
                [1, 2, 7, 11, 14, 13, 8, 4, 5, 6, 10, 9]
            ];
        }

        data.CROSS_POSITIONS = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14];
        data.ADJACENCY = {
            1: [2, 4, 5, 6], 2: [1, 5, 6, 7], 4: [1, 5, 8, 9], 5: [1, 2, 4, 6, 8, 9, 10],
            6: [1, 2, 5, 7, 9, 10, 11], 7: [2, 6, 10, 11], 8: [4, 5, 9, 13], 9: [4, 5, 6, 8, 10, 13, 14],
            10: [5, 6, 7, 9, 11, 13, 14], 11: [6, 7, 10, 14], 13: [8, 9, 10, 14], 14: [9, 10, 11, 13]
        };
    } catch (error) {
        console.warn('Could not load constants:', error.message);
        data.SAMPLE_PUZZLES = {};
    }

    return data;
};

// Main function to create simple puzzles with definitions
const createSimplePuzzles = async () => {
    console.log('🎯 Creating Simple Cornerstones Puzzles with Definitions');
    console.log('═'.repeat(60));
    
    // Load game data
    console.log('📚 Loading existing game data...');
    const gameData = await loadGameData();
    
    // Set global variables for modules
    global.KEYSTONE_WORDS = gameData.KEYSTONE_WORDS;
    global.COMMON_WORDS_LIST = gameData.COMMON_WORDS_LIST;
    global.WORDS_DATABASE = gameData.WORDS_DATABASE;
    global.COMMON_DEFINITIONS = gameData.COMMON_DEFINITIONS;
    global.SAMPLE_PUZZLES = gameData.SAMPLE_PUZZLES;
    global.HAMILTONIAN_PATHS = gameData.HAMILTONIAN_PATHS;
    global.CROSS_POSITIONS = gameData.CROSS_POSITIONS;
    global.ADJACENCY = gameData.ADJACENCY;

    console.log(`   • Keystone words: ${Object.keys(gameData.KEYSTONE_WORDS || {}).length}`);
    console.log(`   • Sample puzzles: ${Object.keys(gameData.SAMPLE_PUZZLES || {}).length}`);
    console.log(`   • Existing definitions: ${Object.keys(gameData.COMMON_DEFINITIONS || {}).length}`);

    // Import puzzle builder components
    console.log('\\n🔧 Loading puzzle builder modules...');
    const { PuzzleBuilder } = await import('./src/js/puzzleBuilder.js');
    const { DatamuseClient } = await import('./src/js/datamuseClient.js');

    // Initialize components
    const puzzleBuilder = new PuzzleBuilder();
    const datamuseClient = new DatamuseClient();

    // Wait for puzzle builder to load word sets
    await puzzleBuilder.loadWordSets();
    
    console.log('\\n❌ Removing invalid puzzles...');
    const invalidPuzzles = ['TECHNOLOGIES', 'CONVERSATION'];
    
    // Remove invalid puzzles from SAMPLE_PUZZLES
    const validSamplePuzzles = { ...gameData.SAMPLE_PUZZLES };
    for (const invalidPuzzle of invalidPuzzles) {
        if (validSamplePuzzles[invalidPuzzle]) {
            delete validSamplePuzzles[invalidPuzzle];
            console.log(`   • Removed ${invalidPuzzle}`);
        }
    }
    
    console.log(`   • Valid puzzles remaining: ${Object.keys(validSamplePuzzles).length}`);

    // Get candidate keystone words - try ones known to work well
    console.log('\\n🔍 Finding good candidate keystone words...');
    const goodCandidates = [
        'PROFESSIONAL', 'CONSTRUCTION', 'REGISTRATION', 'ARCHITECTURE', 
        'PRESENTATION', 'REQUIREMENTS', 'APPLICATIONS', 'CERTIFICATES'
    ];
    
    const availableCandidates = goodCandidates.filter(word => 
        gameData.KEYSTONE_WORDS[word] && !validSamplePuzzles[word]
    );
    
    console.log(`   • Testing keystone words: ${availableCandidates.join(', ')}`);
    console.log(`   • Target: Create 3 puzzles with definitions`);

    // Generate puzzles
    console.log('\\n🔨 Generating puzzles...');
    const generatedPuzzles = [];
    
    for (const keystoneWord of availableCandidates.slice(0, 3)) {
        console.log(`\\n🎯 Generating puzzle for ${keystoneWord}...`);
        
        try {
            const puzzle = await puzzleBuilder.generatePuzzle(keystoneWord);
            if (puzzle && puzzle.cornerstoneWords.length >= 20) {
                generatedPuzzles.push(puzzle);
                console.log(`   ✅ Generated - ${puzzle.allWords.length} words, ${puzzle.cornerstoneWords.length} cornerstone words`);
            } else {
                console.log(`   ❌ Failed - insufficient cornerstone words`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }

    console.log(`\\n📝 Generated ${generatedPuzzles.length} candidate puzzles`);

    // Fetch definitions for puzzle words
    console.log('\\n📖 Fetching word definitions...');
    const allNewDefinitions = {};
    
    for (let i = 0; i < generatedPuzzles.length; i++) {
        const puzzle = generatedPuzzles[i];
        console.log(`\\n${i + 1}/${generatedPuzzles.length}: Fetching definitions for ${puzzle.keystoneWord}...`);
        
        // Get words that need definitions
        const wordsNeedingDefinitions = puzzle.allWords.filter(word => 
            !gameData.COMMON_DEFINITIONS[word]
        );
        
        console.log(`   • ${wordsNeedingDefinitions.length} words need definitions (${puzzle.allWords.length - wordsNeedingDefinitions.length} already exist)`);
        
        // Fetch definitions in batches
        let fetchedCount = 0;
        const batchSize = 20;
        
        for (let j = 0; j < wordsNeedingDefinitions.length; j += batchSize) {
            const batch = wordsNeedingDefinitions.slice(j, j + batchSize);
            console.log(`     • Fetching batch ${Math.floor(j/batchSize) + 1}/${Math.ceil(wordsNeedingDefinitions.length/batchSize)} (${batch.length} words)...`);
            
            for (const word of batch) {
                try {
                    const defData = await datamuseClient.fetchDefinition(word);
                    if (defData && defData.definition) {
                        allNewDefinitions[word] = defData.definition;
                        fetchedCount++;
                    }
                    
                    // Rate limiting
                    await new Promise(resolve => setTimeout(resolve, 150));
                } catch (error) {
                    console.warn(`       • Failed to fetch definition for ${word}: ${error.message}`);
                }
            }
            
            console.log(`     • Progress: ${fetchedCount}/${wordsNeedingDefinitions.length} definitions fetched`);
        }
        
        console.log(`   ✅ Fetched ${fetchedCount} new definitions for ${puzzle.keystoneWord}`);
    }

    console.log(`\\n📊 Total new definitions fetched: ${Object.keys(allNewDefinitions).length}`);

    // Update game files
    if (generatedPuzzles.length > 0) {
        console.log('\\n📝 Updating game files...');
        
        // Update SAMPLE_PUZZLES
        const allPuzzles = { ...validSamplePuzzles };
        generatedPuzzles.forEach(puzzle => {
            allPuzzles[puzzle.keystoneWord] = {
                seedWord: puzzle.keystoneWord, 
                pathIndex: puzzle.pathIndex
            };
        });

        // Update constants.js
        const newSamplePuzzlesCode = Object.entries(allPuzzles)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([word, data]) => `    "${word}": { seedWord: "${data.seedWord}", pathIndex: ${data.pathIndex} }`)
            .join(',\\n');

        const updatedSamplePuzzles = `export const SAMPLE_PUZZLES = {\\n${newSamplePuzzlesCode}\\n};`;
        
        const constContent = await fs.readFile('./src/js/constants.js', 'utf8');
        const updatedConstContent = constContent.replace(
            /export const SAMPLE_PUZZLES = \{[\s\S]*?\};/,
            updatedSamplePuzzles
        );
        
        await fs.writeFile('./src/js/constants.js', updatedConstContent, 'utf8');
        console.log('   ✅ Updated constants.js');

        // Update word-definitions.js
        if (Object.keys(allNewDefinitions).length > 0) {
            const mergedDefinitions = { ...gameData.COMMON_DEFINITIONS, ...allNewDefinitions };
            
            const definitionsCode = Object.entries(mergedDefinitions)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([word, def]) => `    "${word}": "${def.replace(/"/g, '\\\\"')}"`)
                .join(',\\n');

            const updatedDefinitionsFile = `// Common word definitions for the Cornerstones game
export const COMMON_DEFINITIONS = {
${definitionsCode}
};`;

            await fs.writeFile('../src/data/word-definitions.js', updatedDefinitionsFile, 'utf8');
            console.log(`   ✅ Updated word-definitions.js with ${Object.keys(allNewDefinitions).length} new definitions`);
        }

        // Save results
        const outputDir = './puzzle-creation-output';
        try {
            await fs.mkdir(outputDir, { recursive: true });
        } catch (error) {
            // Directory already exists
        }

        const results = {
            generatedAt: new Date().toISOString(),
            removedPuzzles: invalidPuzzles,
            newPuzzles: generatedPuzzles.map(p => ({
                keystoneWord: p.keystoneWord,
                pathIndex: p.pathIndex,
                totalWords: p.allWords.length,
                cornerstoneWords: p.cornerstoneWords.length
            })),
            newDefinitionsCount: Object.keys(allNewDefinitions).length,
            summary: {
                removedCount: invalidPuzzles.length,
                addedCount: generatedPuzzles.length,
                totalPuzzles: Object.keys(allPuzzles).length
            }
        };

        await fs.writeFile(
            path.join(outputDir, 'simple-puzzles-summary.json'),
            JSON.stringify(results, null, 2),
            'utf8'
        );

        console.log('\\n🎉 Simple Puzzle Creation Complete!');
        console.log('═'.repeat(60));
        console.log(`📊 SUMMARY:`);
        console.log(`   • Invalid puzzles removed: ${invalidPuzzles.length}`);
        console.log(`   • New puzzles added: ${generatedPuzzles.length}`);
        console.log(`   • Total puzzles now: ${Object.keys(allPuzzles).length}`);
        console.log(`   • New definitions fetched: ${Object.keys(allNewDefinitions).length}`);
        
        if (generatedPuzzles.length > 0) {
            console.log(`\\n🧩 NEW PUZZLES CREATED:`);
            generatedPuzzles.forEach((puzzle, i) => {
                console.log(`   ${i + 1}. ${puzzle.keystoneWord} (${puzzle.allWords.length} words, ${puzzle.cornerstoneWords.length} cornerstone)`);
            });
        }

        console.log(`\\n✅ Game files updated and ready to play!`);
    } else {
        console.log('\\n⚠️  No puzzles were created.');
    }

    return generatedPuzzles;
};

// Run the creation process
createSimplePuzzles().catch(error => {
    console.error('❌ Simple puzzle creation failed:', error);
    process.exit(1);
});