#!/usr/bin/env node

// Create New Puzzles Script - Remove invalid puzzles and generate 20 new valid ones

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
        // Load common words
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
        // Load words database
        const wordsContent = await fs.readFile('../src/data/words-database-compact.js', 'utf8');
        
        // Try new format first
        let wordsMatch = wordsContent.match(/const WORD_LIST_STRING = "([^"]+)"/);
        if (wordsMatch) {
            data.WORDS_DATABASE = wordsMatch[1].split('|');
        } else {
            // Try old format
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
        // Load definitions
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
        // Load sample puzzles and constants
        const constContent = await fs.readFile('./src/js/constants.js', 'utf8');
        
        // Extract SAMPLE_PUZZLES
        const sampleMatch = constContent.match(/export const SAMPLE_PUZZLES = (\{[\s\S]*?\});/);
        if (sampleMatch) {
            eval(`data.SAMPLE_PUZZLES = ${sampleMatch[1]}`);
        } else {
            data.SAMPLE_PUZZLES = {};
        }
        
        // Extract HAMILTONIAN_PATHS
        const pathsMatch = constContent.match(/export const HAMILTONIAN_PATHS = (\[[\s\S]*?\]);/);
        if (pathsMatch) {
            eval(`data.HAMILTONIAN_PATHS = ${pathsMatch[1]}`);
        } else {
            data.HAMILTONIAN_PATHS = [
                [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11],
                [4, 5, 9, 8, 13, 14, 11, 7, 6, 10, 2, 1],
                [1, 2, 7, 11, 14, 13, 8, 4, 5, 6, 10, 9],
                [5, 1, 2, 6, 10, 14, 13, 9, 8, 4, 7, 11],
                [11, 7, 2, 1, 5, 9, 13, 14, 10, 6, 4, 8],
                [8, 4, 5, 1, 6, 2, 7, 11, 14, 10, 9, 13],
                [9, 5, 4, 8, 13, 14, 10, 6, 1, 2, 7, 11],
                [14, 13, 9, 10, 11, 7, 6, 2, 1, 5, 4, 8],
                [2, 1, 4, 5, 9, 8, 13, 14, 11, 10, 6, 7],
                [7, 11, 10, 14, 9, 13, 8, 4, 5, 1, 2, 6]
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
        data.HAMILTONIAN_PATHS = [
            [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11],
            [4, 5, 9, 8, 13, 14, 11, 7, 6, 10, 2, 1],
            [1, 2, 7, 11, 14, 13, 8, 4, 5, 6, 10, 9],
            [5, 1, 2, 6, 10, 14, 13, 9, 8, 4, 7, 11],
            [11, 7, 2, 1, 5, 9, 13, 14, 10, 6, 4, 8],
            [8, 4, 5, 1, 6, 2, 7, 11, 14, 10, 9, 13],
            [9, 5, 4, 8, 13, 14, 10, 6, 1, 2, 7, 11],
            [14, 13, 9, 10, 11, 7, 6, 2, 1, 5, 4, 8],
            [2, 1, 4, 5, 9, 8, 13, 14, 11, 10, 6, 7],
            [7, 11, 10, 14, 9, 13, 8, 4, 5, 1, 2, 6]
        ];
        data.CROSS_POSITIONS = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14];
        data.ADJACENCY = {
            1: [2, 4, 5, 6], 2: [1, 5, 6, 7], 4: [1, 5, 8, 9], 5: [1, 2, 4, 6, 8, 9, 10],
            6: [1, 2, 5, 7, 9, 10, 11], 7: [2, 6, 10, 11], 8: [4, 5, 9, 13], 9: [4, 5, 6, 8, 10, 13, 14],
            10: [5, 6, 7, 9, 11, 13, 14], 11: [6, 7, 10, 14], 13: [8, 9, 10, 14], 14: [9, 10, 11, 13]
        };
    }

    return data;
};

// Main function to create new puzzles
const createNewPuzzles = async () => {
    console.log('🎯 Creating New Cornerstones Puzzles');
    console.log('═'.repeat(50));
    
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
    console.log(`   • Common words: ${(gameData.COMMON_WORDS_LIST || []).length}`);
    console.log(`   • Words database: ${(gameData.WORDS_DATABASE || []).length}`);

    // Import puzzle builder components
    console.log('\n🔧 Loading puzzle builder modules...');
    const { PuzzleBuilder } = await import('./src/js/puzzleBuilder.js');
    const { PuzzleValidator } = await import('./src/js/puzzleValidator.js');
    const { DataIntegration } = await import('./src/js/dataIntegration.js');

    // Initialize components
    const puzzleBuilder = new PuzzleBuilder();
    const puzzleValidator = new PuzzleValidator({
        minCornerstoneWords: 20, // Ensure high quality
        validatePuzzles: true
    });
    const dataIntegration = new DataIntegration();

    // Wait for puzzle builder to load word sets
    await puzzleBuilder.loadWordSets();
    
    console.log('\n❌ Removing invalid puzzles...');
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

    // Get list of available keystone words (excluding already used ones)
    console.log('\n🔍 Finding candidate keystone words...');
    const existingKeystoneWords = new Set(Object.keys(validSamplePuzzles));
    const availableKeystoneWords = Object.keys(gameData.KEYSTONE_WORDS)
        .filter(word => !existingKeystoneWords.has(word))
        .filter(word => word.length === 12 && /^[A-Z]+$/.test(word));
    
    console.log(`   • Available keystone words: ${availableKeystoneWords.length}`);
    console.log(`   • Target: Generate 20 new puzzles`);

    // Generate 20 new puzzles
    console.log('\n🔨 Generating new puzzles...');
    const newPuzzles = [];
    const maxAttempts = Math.min(availableKeystoneWords.length, 50); // Try up to 50 words
    
    let attempts = 0;
    let successes = 0;
    const targetPuzzles = 20;

    const progressCallback = (progress) => {
        if (progress.current % 5 === 0 || progress.completed !== progress.current - 1) {
            console.log(`   🎯 Progress: ${progress.current}/${progress.total} tested, ${progress.completed} successful`);
        }
    };

    // Use batch generation for efficiency
    const batchSize = Math.min(maxAttempts, 30);
    const candidateWords = availableKeystoneWords.slice(0, batchSize);
    
    console.log(`   • Testing ${candidateWords.length} candidate words...`);
    const generatedPuzzles = await puzzleBuilder.generateMultiplePuzzles(candidateWords, progressCallback);
    
    console.log(`\n🔍 Validating generated puzzles...`);
    const commonWordsSet = new Set(gameData.COMMON_WORDS_LIST.map(w => w.toUpperCase()));
    
    // Validate each generated puzzle
    for (let i = 0; i < generatedPuzzles.length && newPuzzles.length < targetPuzzles; i++) {
        const puzzle = generatedPuzzles[i];
        console.log(`   ${i + 1}/${generatedPuzzles.length}: Validating ${puzzle.keystoneWord}...`);
        
        try {
            const validation = await puzzleValidator.validatePuzzle(
                puzzle, 
                commonWordsSet, 
                gameData.COMMON_DEFINITIONS
            );
            
            if (validation.isValid) {
                newPuzzles.push(puzzle);
                console.log(`      ✅ Valid - ${puzzle.cornerstoneWords.length} cornerstone words, quality: ${validation.metrics.overall?.qualityScore || 'N/A'}`);
            } else {
                console.log(`      ❌ Invalid - ${validation.errors.length} errors`);
                if (validation.errors.length > 0) {
                    console.log(`         • ${validation.errors[0]}`);
                }
            }
        } catch (error) {
            console.log(`      💥 Validation error: ${error.message}`);
        }
    }

    console.log(`\n✅ Generated ${newPuzzles.length} valid puzzles!`);

    // If we need more puzzles, try additional keystone words
    if (newPuzzles.length < targetPuzzles && availableKeystoneWords.length > batchSize) {
        console.log(`\n🔄 Need ${targetPuzzles - newPuzzles.length} more puzzles, trying additional words...`);
        
        const additionalWords = availableKeystoneWords.slice(batchSize, batchSize + 20);
        const additionalPuzzles = await puzzleBuilder.generateMultiplePuzzles(additionalWords, progressCallback);
        
        for (const puzzle of additionalPuzzles) {
            if (newPuzzles.length >= targetPuzzles) break;
            
            try {
                const validation = await puzzleValidator.validatePuzzle(
                    puzzle, 
                    commonWordsSet, 
                    gameData.COMMON_DEFINITIONS
                );
                
                if (validation.isValid) {
                    newPuzzles.push(puzzle);
                    console.log(`      ✅ ${puzzle.keystoneWord} - ${puzzle.cornerstoneWords.length} cornerstone words`);
                }
            } catch (error) {
                console.log(`      ❌ ${puzzle.keystoneWord} - validation failed`);
            }
        }
    }

    console.log(`\n📊 Final Results:`);
    console.log(`   • New valid puzzles generated: ${newPuzzles.length}`);
    console.log(`   • Total puzzles (including existing): ${Object.keys(validSamplePuzzles).length + newPuzzles.length}`);

    // Update game files
    console.log('\n📝 Updating game files...');
    
    // 1. Update constants.js with new sample puzzles
    const allPuzzles = { ...validSamplePuzzles };
    newPuzzles.forEach(puzzle => {
        allPuzzles[puzzle.keystoneWord] = {
            seedWord: puzzle.keystoneWord, 
            pathIndex: puzzle.pathIndex
        };
    });

    const newSamplePuzzlesCode = Object.entries(allPuzzles)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([word, data]) => `    "${word}": { seedWord: "${data.seedWord}", pathIndex: ${data.pathIndex} }`)
        .join(',\n');

    const updatedSamplePuzzles = `export const SAMPLE_PUZZLES = {\n${newSamplePuzzlesCode}\n};`;
    
    // Read current constants.js
    const constContent = await fs.readFile('./src/js/constants.js', 'utf8');
    const updatedConstContent = constContent.replace(
        /export const SAMPLE_PUZZLES = \{[\s\S]*?\};/,
        updatedSamplePuzzles
    );
    
    await fs.writeFile('./src/js/constants.js', updatedConstContent, 'utf8');
    console.log('   ✅ Updated constants.js with new sample puzzles');

    // 2. Create output directory and save detailed results
    const outputDir = './puzzle-creation-output';
    try {
        await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
        // Directory already exists
    }

    // Save new puzzles data
    const newPuzzlesData = {
        generatedAt: new Date().toISOString(),
        removedPuzzles: invalidPuzzles,
        newPuzzles: newPuzzles.map(p => ({
            keystoneWord: p.keystoneWord,
            pathIndex: p.pathIndex,
            totalWords: p.allWords.length,
            cornerstoneWords: p.cornerstoneWords.length,
            difficulty: dataIntegration.calculateDifficulty(p),
            sampleWords: p.allWords.slice(0, 10) // Show first 10 words as sample
        })),
        summary: {
            removedCount: invalidPuzzles.length,
            addedCount: newPuzzles.length,
            totalPuzzles: Object.keys(allPuzzles).length,
            averageWordsPerPuzzle: Math.round(newPuzzles.reduce((sum, p) => sum + p.allWords.length, 0) / newPuzzles.length),
            averageCornerstoneWords: Math.round(newPuzzles.reduce((sum, p) => sum + p.cornerstoneWords.length, 0) / newPuzzles.length)
        }
    };

    await fs.writeFile(
        path.join(outputDir, 'new-puzzles-summary.json'),
        JSON.stringify(newPuzzlesData, null, 2),
        'utf8'
    );

    // Save complete puzzle data for integration
    const completeGameData = dataIntegration.generateCompleteDataPackage(
        newPuzzles,
        gameData.COMMON_DEFINITIONS,
        gameData
    );

    await fs.writeFile(
        path.join(outputDir, 'updated-sample-puzzles.js'),
        updatedSamplePuzzles,
        'utf8'
    );

    // Print final report
    console.log('\n🎉 Puzzle Creation Complete!');
    console.log('═'.repeat(60));
    console.log(`📊 SUMMARY:`);
    console.log(`   • Invalid puzzles removed: ${invalidPuzzles.length} (${invalidPuzzles.join(', ')})`);
    console.log(`   • New valid puzzles added: ${newPuzzles.length}`);
    console.log(`   • Total puzzles now: ${Object.keys(allPuzzles).length}`);
    console.log(`   • Average words per new puzzle: ${newPuzzlesData.summary.averageWordsPerPuzzle}`);
    console.log(`   • Average cornerstone words: ${newPuzzlesData.summary.averageCornerstoneWords}`);

    if (newPuzzles.length > 0) {
        console.log(`\n🧩 NEW PUZZLES CREATED:`);
        newPuzzles.slice(0, 15).forEach((puzzle, i) => {
            const difficulty = dataIntegration.calculateDifficulty(puzzle);
            console.log(`   ${i + 1}. ${puzzle.keystoneWord} (${difficulty}, ${puzzle.allWords.length} words, ${puzzle.cornerstoneWords.length} cornerstone)`);
        });
        
        if (newPuzzles.length > 15) {
            console.log(`   ... and ${newPuzzles.length - 15} more`);
        }
    }

    console.log(`\n📁 Results saved to: ${outputDir}`);
    console.log(`   • new-puzzles-summary.json - Complete creation summary`);
    console.log(`   • updated-sample-puzzles.js - New SAMPLE_PUZZLES code`);
    console.log(`\n✅ constants.js has been updated with new puzzles!`);
    console.log('\n✨ Ready to play with expanded puzzle collection!');

    return newPuzzlesData;
};

// Run the creation process
createNewPuzzles().catch(error => {
    console.error('❌ Puzzle creation failed:', error);
    process.exit(1);
});