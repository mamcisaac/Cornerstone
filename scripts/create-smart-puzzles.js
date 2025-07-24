#!/usr/bin/env node

// Smart Puzzle Creation - API-optimized puzzle creation with word database cleaning

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

// Update word database file with cleaned words
const updateWordDatabase = async (cleanedWords) => {
    const wordListString = cleanedWords.sort().join('|');
    const updatedContent = `// Compact word database for the Cornerstones game (cleaned)
// Generated: ${new Date().toISOString()}
// Words: ${cleanedWords.length} (cleaned during puzzle creation)

export const WORD_LIST_STRING = "${wordListString}";

// For backwards compatibility
export const WORDS_DATABASE = WORD_LIST_STRING.split('|');
`;

    await fs.writeFile('../src/data/words-database-compact.js', updatedContent, 'utf8');
    console.log(`✅ Updated word database: ${cleanedWords.length} words`);
};

// Update definitions file with new definitions
const updateDefinitionsFile = async (allDefinitions) => {
    const definitionsCode = Object.entries(allDefinitions)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([word, def]) => {
            // Handle both string definitions and definition objects
            const definition = typeof def === 'string' ? def : (def.definition || String(def));
            return `    "${word}": "${definition.replace(/"/g, '\\\\"')}"`;
        })
        .join(',\n');

    const updatedContent = `// Common word definitions for the Cornerstones game (updated)
// Generated: ${new Date().toISOString()}
// Definitions: ${Object.keys(allDefinitions).length}

export const COMMON_DEFINITIONS = {
${definitionsCode}
};`;

    await fs.writeFile('../src/data/word-definitions.js', updatedContent, 'utf8');
    console.log(`✅ Updated definitions: ${Object.keys(allDefinitions).length} definitions`);
};

// Update constants.js with new puzzles
const updateConstantsFile = async (allPuzzles) => {
    const newSamplePuzzlesCode = Object.entries(allPuzzles)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([word, data]) => `    "${word}": { seedWord: "${data.seedWord}", pathIndex: ${data.pathIndex} }`)
        .join(',\n');

    const updatedSamplePuzzles = `export const SAMPLE_PUZZLES = {\n${newSamplePuzzlesCode}\n};`;
    
    const constContent = await fs.readFile('./src/js/constants.js', 'utf8');
    const updatedConstContent = constContent.replace(
        /export const SAMPLE_PUZZLES = \{[\s\S]*?\};/,
        updatedSamplePuzzles
    );
    
    await fs.writeFile('./src/js/constants.js', updatedConstContent, 'utf8');
    console.log(`✅ Updated constants.js: ${Object.keys(allPuzzles).length} puzzles`);
};

// Main smart puzzle creation function
const createSmartPuzzles = async () => {
    console.log('🎯 Smart Cornerstones Puzzle Creation');
    console.log('════════════════════════════════════════════════════════');
    console.log('✨ Features: API optimization, word cleaning, definition fetching');
    console.log('');
    
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

    // Import enhanced puzzle builder components
    console.log('\n🔧 Loading enhanced puzzle builder modules...');
    const { PuzzleBuilder } = await import('./src/js/puzzleBuilder.js');
    const { PuzzleValidator } = await import('./src/js/puzzleValidator.js');

    // Initialize components with word cleaning enabled
    const puzzleBuilder = new PuzzleBuilder({
        cleanWords: true,
        definitionFetcher: {
            rateLimitPerSecond: 8, // Conservative rate limiting
            cacheResults: true
        }
    });
    
    const puzzleValidator = new PuzzleValidator({
        minCornerstoneWords: 20,
        validatePuzzles: true
    });

    // Wait for puzzle builder to load word sets and definitions
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

    // Get candidate keystone words - focus on high-quality candidates
    console.log('\n🔍 Finding candidate keystone words...');
    const goodCandidates = [
        'PROFESSIONAL', 'CONSTRUCTION', 'REGISTRATION', 'ARCHITECTURE', 
        'PRESENTATION', 'REQUIREMENTS', 'APPLICATIONS', 'CERTIFICATES',
        'CONTEMPORARY', 'PRESCRIPTION', 'CONSERVATION', 'PARTICIPANTS'
    ];
    
    const availableCandidates = goodCandidates.filter(word => 
        gameData.KEYSTONE_WORDS[word] && !validSamplePuzzles[word]
    );
    
    console.log(`   • Available candidates: ${availableCandidates.join(', ')}`);
    console.log(`   • Target: Create 5 high-quality puzzles with complete definitions`);

    // Generate puzzles with word cleaning
    console.log('\n🔨 Generating puzzles with word cleaning...');
    const successfulPuzzles = [];
    const cleaningStats = {
        totalWordsRemoved: 0,
        totalApiCalls: 0,
        totalApiCallsSaved: 0,
        totalDefinitionsFound: 0
    };
    
    for (let i = 0; i < Math.min(availableCandidates.length, 5); i++) {
        const keystoneWord = availableCandidates[i];
        console.log(`\n🎯 ${i + 1}/5: Generating puzzle for ${keystoneWord}...`);
        
        try {
            const puzzle = await puzzleBuilder.generatePuzzle(keystoneWord);
            
            if (puzzle) {
                // Validate the cleaned puzzle
                console.log(`   🔍 Validating cleaned puzzle...`);
                const commonWordsSet = new Set(gameData.COMMON_WORDS_LIST.map(w => w.toUpperCase()));
                const validation = await puzzleValidator.validatePuzzle(
                    puzzle, 
                    commonWordsSet, 
                    puzzle.definitions || gameData.COMMON_DEFINITIONS
                );
                
                if (validation.isValid) {
                    successfulPuzzles.push(puzzle);
                    
                    // Accumulate cleaning stats
                    if (puzzle.cleaningStats) {
                        cleaningStats.totalWordsRemoved += puzzle.cleaningStats.wordsRemoved;
                        cleaningStats.totalApiCallsSaved += puzzle.cleaningStats.apiCallsSaved;
                        cleaningStats.totalDefinitionsFound += puzzle.cleaningStats.definitionsFound;
                    }
                    
                    console.log(`   ✅ VALID - ${puzzle.allWords.length} words, ${puzzle.cornerstoneWords.length} cornerstone`);
                    console.log(`   📊 Cleaned: -${puzzle.cleaningStats?.wordsRemoved || 0} words, +${puzzle.cleaningStats?.definitionsFound || 0} definitions`);
                } else {
                    console.log(`   ❌ INVALID - ${validation.errors.length} errors`);
                    validation.errors.slice(0, 2).forEach(error => {
                        console.log(`      • ${error}`);
                    });
                }
            } else {
                console.log(`   ❌ Failed to generate puzzle`);
            }
        } catch (error) {
            console.log(`   💥 Error: ${error.message}`);
        }
    }

    console.log(`\n📊 Generation Results:`);
    console.log(`   • Successful puzzles: ${successfulPuzzles.length}`);
    console.log(`   • Total words removed: ${cleaningStats.totalWordsRemoved}`);
    console.log(`   • API calls saved: ${cleaningStats.totalApiCallsSaved}`);
    console.log(`   • New definitions: ${cleaningStats.totalDefinitionsFound}`);

    // Update game files if we have successful puzzles
    if (successfulPuzzles.length > 0) {
        console.log('\n📝 Updating game files...');
        
        // Collect all definitions from successful puzzles
        const allNewDefinitions = {};
        successfulPuzzles.forEach(puzzle => {
            if (puzzle.definitions) {
                Object.assign(allNewDefinitions, puzzle.definitions);
            }
        });
        
        // Merge with existing definitions
        const mergedDefinitions = { ...gameData.COMMON_DEFINITIONS, ...allNewDefinitions };
        
        // Update SAMPLE_PUZZLES
        const allPuzzles = { ...validSamplePuzzles };
        successfulPuzzles.forEach(puzzle => {
            allPuzzles[puzzle.keystoneWord] = {
                seedWord: puzzle.keystoneWord, 
                pathIndex: puzzle.pathIndex
            };
        });

        // Get word cleaning stats and update word database
        const wordStats = puzzleBuilder.getWordCleaningStats();
        if (wordStats.wordsRemoved > 0) {
            const cleanedWordDatabase = [...puzzleBuilder.allWords].sort();
            await updateWordDatabase(cleanedWordDatabase);
            console.log(`   📉 Word database: ${wordStats.originalWordCount} → ${wordStats.cleanedWordCount} (${wordStats.reductionPercentage}% reduction)`);
        }

        // Update definitions file
        if (Object.keys(allNewDefinitions).length > 0) {
            await updateDefinitionsFile(mergedDefinitions);
        }

        // Update constants file
        await updateConstantsFile(allPuzzles);

        // Save comprehensive results
        const outputDir = './puzzle-creation-output';
        try {
            await fs.mkdir(outputDir, { recursive: true });
        } catch (error) {
            // Directory already exists
        }

        const results = {
            generatedAt: new Date().toISOString(),
            method: 'smart-creation-with-word-cleaning',
            removedPuzzles: invalidPuzzles,
            newPuzzles: successfulPuzzles.map(p => ({
                keystoneWord: p.keystoneWord,
                pathIndex: p.pathIndex,
                totalWords: p.allWords.length,
                cornerstoneWords: p.cornerstoneWords.length,
                cleaningStats: p.cleaningStats
            })),
            wordCleaningStats: wordStats,
            apiEfficiency: {
                totalApiCallsSaved: cleaningStats.totalApiCallsSaved,
                newDefinitionsFetched: cleaningStats.totalDefinitionsFound,
                existingDefinitionsUsed: Object.keys(gameData.COMMON_DEFINITIONS).length
            },
            summary: {
                removedCount: invalidPuzzles.length,
                addedCount: successfulPuzzles.length,
                totalPuzzles: Object.keys(allPuzzles).length,
                finalWordDatabaseSize: puzzleBuilder.allWords.size,
                finalDefinitionsCount: Object.keys(mergedDefinitions).length
            }
        };

        await fs.writeFile(
            path.join(outputDir, 'smart-puzzle-creation.json'),
            JSON.stringify(results, null, 2),
            'utf8'
        );

        // Print final comprehensive report
        console.log('\n🎉 Smart Puzzle Creation Complete!');
        console.log('═'.repeat(60));
        console.log(`📈 EFFICIENCY GAINS:`);
        console.log(`   • API calls saved: ${cleaningStats.totalApiCallsSaved}`);
        console.log(`   • Word database cleaned: ${wordStats.reductionPercentage}% reduction`);
        console.log(`   • Complete definitions: ${Object.keys(mergedDefinitions).length}`);
        
        console.log(`\n📊 FINAL RESULTS:`);
        console.log(`   • Invalid puzzles removed: ${invalidPuzzles.length}`);
        console.log(`   • New puzzles created: ${successfulPuzzles.length}`);
        console.log(`   • Total puzzles: ${Object.keys(allPuzzles).length}`);
        console.log(`   • Word database: ${puzzleBuilder.allWords.size} clean words`);
        console.log(`   • Definitions: ${Object.keys(mergedDefinitions).length} complete`);
        
        if (successfulPuzzles.length > 0) {
            console.log(`\n🧩 NEW PUZZLES CREATED:`);
            successfulPuzzles.forEach((puzzle, i) => {
                console.log(`   ${i + 1}. ${puzzle.keystoneWord}`);
                console.log(`      └─ ${puzzle.allWords.length} words (${puzzle.cornerstoneWords.length} cornerstone)`);
                console.log(`      └─ Removed ${puzzle.cleaningStats?.wordsRemoved || 0} undefined words`);
            });
        }

        console.log(`\n📁 Results saved to: ${outputDir}/smart-puzzle-creation.json`);
        console.log(`\n✅ Game ready with optimized word database and complete definitions!`);
        
        return results;
        
    } else {
        console.log('\n⚠️  No puzzles were successfully created.');
        console.log('Consider trying different keystone words or adjusting criteria.');
        return null;
    }
};

// Run the smart creation process
createSmartPuzzles().catch(error => {
    console.error('❌ Smart puzzle creation failed:', error);
    console.error(error.stack);
    process.exit(1);
});