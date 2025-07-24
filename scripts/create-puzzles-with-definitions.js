#!/usr/bin/env node

// Create Puzzles with Full Definition Fetching
// This script generates puzzles and fetches ALL word definitions via Datamuse

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

// Main function to create puzzles with full definition fetching
const createPuzzlesWithDefinitions = async () => {
    console.log('🎯 Creating Complete Cornerstones Puzzles with Definitions');
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
    console.log(`   • Common words: ${(gameData.COMMON_WORDS_LIST || []).length}`);
    console.log(`   • Words database: ${(gameData.WORDS_DATABASE || []).length}`);
    console.log(`   • Existing definitions: ${Object.keys(gameData.COMMON_DEFINITIONS || {}).length}`);

    // Import puzzle builder components
    console.log('\\n🔧 Loading puzzle builder modules...');
    const { PuzzleBuilder } = await import('./src/js/puzzleBuilder.js');
    const { PuzzleValidator } = await import('./src/js/puzzleValidator.js');
    const { DatamuseClient } = await import('./src/js/datamuseClient.js');
    const { DefinitionValidator } = await import('./src/js/definitionValidator.js');

    // Initialize components
    const puzzleBuilder = new PuzzleBuilder();
    const puzzleValidator = new PuzzleValidator({
        minCornerstoneWords: 20,
        validatePuzzles: true
    });
    const datamuseClient = new DatamuseClient();
    const definitionValidator = new DefinitionValidator();

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

    // Get candidate keystone words
    console.log('\\n🔍 Finding candidate keystone words...');
    const existingKeystoneWords = new Set(Object.keys(validSamplePuzzles));
    const availableKeystoneWords = Object.keys(gameData.KEYSTONE_WORDS)
        .filter(word => !existingKeystoneWords.has(word))
        .filter(word => word.length === 12 && /^[A-Z]+$/.test(word));
    
    console.log(`   • Available keystone words: ${availableKeystoneWords.length}`);
    console.log(`   • Target: Generate 5 new puzzles with full definitions`);

    // Generate puzzles with smaller batch size for definition fetching
    console.log('\\n🔨 Generating puzzles...');
    const candidateWords = availableKeystoneWords.slice(0, 15); // Test fewer words initially
    
    const progressCallback = (progress) => {
        console.log(`   🎯 Progress: ${progress.current}/${progress.total} tested, ${progress.completed} successful`);
    };

    const generatedPuzzles = await puzzleBuilder.generateMultiplePuzzles(candidateWords, progressCallback);
    console.log(`\\n📝 Generated ${generatedPuzzles.length} candidate puzzles`);

    // Process each puzzle with full definition fetching
    console.log('\\n🔍 Fetching definitions for all words in puzzles...');
    const completePuzzles = [];
    
    for (let i = 0; i < Math.min(generatedPuzzles.length, 5); i++) {
        const puzzle = generatedPuzzles[i];
        console.log(`\\n${i + 1}/5: Processing ${puzzle.keystoneWord}...`);
        console.log(`   • Found ${puzzle.allWords.length} words, ${puzzle.cornerstoneWords.length} cornerstone words`);
        
        try {
            // Fetch definitions for ALL words in the puzzle
            console.log(`   • Fetching definitions for ${puzzle.allWords.length} words...`);
            const newDefinitions = {};
            let fetchedCount = 0;
            let existingCount = 0;
            
            for (const word of puzzle.allWords) {
                if (gameData.COMMON_DEFINITIONS[word]) {
                    existingCount++;
                    continue;
                }
                
                try {
                    const definition = await datamuseClient.getWordDefinition(word);
                    if (definition && definition.trim()) {
                        newDefinitions[word] = definition;
                        fetchedCount++;
                        
                        // Progress feedback for large word lists
                        if (fetchedCount % 10 === 0) {
                            console.log(`     • Fetched ${fetchedCount} definitions...`);
                        }
                    }
                    
                    // Rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    console.warn(`     • Failed to fetch definition for ${word}: ${error.message}`);
                }
            }
            
            console.log(`   • Fetched ${fetchedCount} new definitions, ${existingCount} existing`);
            
            // Validate cornerstone word definitions with LLM
            console.log(`   • Validating ${puzzle.cornerstoneWords.length} cornerstone word definitions...`);
            let validatedCount = 0;
            
            for (const word of puzzle.cornerstoneWords) {
                const definition = newDefinitions[word] || gameData.COMMON_DEFINITIONS[word];
                if (definition) {
                    try {
                        const validation = await definitionValidator.validateDefinition(word, definition);
                        if (!validation.isValid) {
                            console.log(`     • ⚠️  ${word}: ${validation.reason}`);
                            // Try to get a better definition
                            const alternatives = await datamuseClient.getAlternativeDefinitions(word);
                            if (alternatives && alternatives.length > 0) {
                                newDefinitions[word] = alternatives[0];
                                console.log(`     • ✅ ${word}: Found better definition`);
                            }
                        } else {
                            validatedCount++;
                        }
                    } catch (error) {
                        console.warn(`     • Failed to validate ${word}: ${error.message}`);
                    }
                }
                
                // Rate limiting for LLM calls
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            console.log(`   • Validated ${validatedCount}/${puzzle.cornerstoneWords.length} cornerstone definitions`);
            
            // Merge new definitions
            const allDefinitions = { ...gameData.COMMON_DEFINITIONS, ...newDefinitions };
            
            // Final validation
            console.log(`   • Running final puzzle validation...`);
            const commonWordsSet = new Set(gameData.COMMON_WORDS_LIST.map(w => w.toUpperCase()));
            const validation = await puzzleValidator.validatePuzzle(
                puzzle, 
                commonWordsSet, 
                allDefinitions
            );
            
            if (validation.isValid) {
                puzzle.definitions = newDefinitions;
                puzzle.allDefinitions = allDefinitions;
                completePuzzles.push(puzzle);
                console.log(`   ✅ VALID - Quality Score: ${validation.metrics.overall?.qualityScore || 'N/A'}`);
            } else {
                console.log(`   ❌ INVALID - ${validation.errors.length} errors`);
                validation.errors.slice(0, 2).forEach(error => {
                    console.log(`      • ${error}`);
                });
            }
            
        } catch (error) {
            console.error(`   💥 Processing error: ${error.message}`);
        }
    }

    console.log(`\\n✅ Created ${completePuzzles.length} complete valid puzzles!`);

    // Update game files
    if (completePuzzles.length > 0) {
        console.log('\\n📝 Updating game files...');
        
        // Update SAMPLE_PUZZLES
        const allPuzzles = { ...validSamplePuzzles };
        completePuzzles.forEach(puzzle => {
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

        // Update word-definitions.js with new definitions
        const allNewDefinitions = {};
        completePuzzles.forEach(puzzle => {
            Object.assign(allNewDefinitions, puzzle.definitions);
        });

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

        // Save detailed results
        const outputDir = './puzzle-creation-output';
        try {
            await fs.mkdir(outputDir, { recursive: true });
        } catch (error) {
            // Directory already exists
        }

        const results = {
            generatedAt: new Date().toISOString(),
            removedPuzzles: invalidPuzzles,
            newPuzzles: completePuzzles.map(p => ({
                keystoneWord: p.keystoneWord,
                pathIndex: p.pathIndex,
                totalWords: p.allWords.length,
                cornerstoneWords: p.cornerstoneWords.length,
                newDefinitions: Object.keys(p.definitions).length
            })),
            summary: {
                removedCount: invalidPuzzles.length,
                addedCount: completePuzzles.length,
                totalPuzzles: Object.keys(allPuzzles).length,
                totalNewDefinitions: Object.keys(allNewDefinitions).length
            }
        };

        await fs.writeFile(
            path.join(outputDir, 'complete-puzzles-summary.json'),
            JSON.stringify(results, null, 2),
            'utf8'
        );

        console.log('\\n🎉 Puzzle Creation Complete!');
        console.log('═'.repeat(60));
        console.log(`📊 SUMMARY:`);
        console.log(`   • Invalid puzzles removed: ${invalidPuzzles.length}`);
        console.log(`   • New complete puzzles added: ${completePuzzles.length}`);
        console.log(`   • Total puzzles now: ${Object.keys(allPuzzles).length}`);
        console.log(`   • New definitions fetched: ${Object.keys(allNewDefinitions).length}`);
        
        if (completePuzzles.length > 0) {
            console.log(`\\n🧩 NEW PUZZLES CREATED:`);
            completePuzzles.forEach((puzzle, i) => {
                console.log(`   ${i + 1}. ${puzzle.keystoneWord} (${puzzle.allWords.length} words, ${puzzle.cornerstoneWords.length} cornerstone, ${Object.keys(puzzle.definitions).length} new definitions)`);
            });
        }

        console.log(`\\n✅ Game files updated and ready to play!`);
    } else {
        console.log('\\n⚠️  No valid complete puzzles were created. Consider adjusting criteria or trying different keystone words.');
    }

    return completePuzzles;
};

// Run the creation process
createPuzzlesWithDefinitions().catch(error => {
    console.error('❌ Puzzle creation failed:', error);
    process.exit(1);
});