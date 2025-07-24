#!/usr/bin/env node

// Analysis script for definition coverage across all puzzles in Cornerstone word game
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the game constants and data
const constantsPath = path.join(__dirname, 'src/js/constants.js');
const definitionsPath = path.join(__dirname, 'src/data/word-definitions.js');
const cornerstoneWordsPath = path.join(__dirname, 'src/data/cornerstone-words.js');
const wordsDbPath = path.join(__dirname, 'src/data/words-database-compact.js');

console.log('🔍 Analyzing Definition Coverage for Cornerstone Puzzles\n');

// Helper function to dynamically import ES modules
async function importModule(modulePath) {
    try {
        const module = await import(`file://${path.resolve(modulePath)}`);
        return module;
    } catch (error) {
        console.error(`Failed to import ${modulePath}:`, error.message);
        return null;
    }
}

// WordFinder class - simplified version for analysis
class WordFinder {
    constructor(wordSet) {
        this.wordSet = wordSet || new Set();
    }

    // Define adjacency map
    get ADJACENCY() {
        return {
            1: [2, 4, 5, 6],
            2: [1, 5, 6, 7],
            4: [1, 5, 8, 9],
            5: [1, 2, 4, 6, 8, 9, 10],
            6: [1, 2, 5, 7, 9, 10, 11],
            7: [2, 6, 10, 11],
            8: [4, 5, 9, 13],
            9: [4, 5, 6, 8, 10, 13, 14],
            10: [5, 6, 7, 9, 11, 13, 14],
            11: [6, 7, 10, 14],
            13: [8, 9, 10, 14],
            14: [9, 10, 11, 13]
        };
    }

    // Find all possible words in a grid using DFS
    findAllWords(grid) {
        const validWords = new Set();
        
        // Try starting from each non-empty position
        for (let i = 0; i < grid.length; i++) {
            if (grid[i]) {
                this.dfs(grid, i, '', new Array(grid.length).fill(false), validWords);
            }
        }
        
        return validWords;
    }

    // Depth-first search to find words
    dfs(grid, position, currentWord, visited, validWords) {
        if (!grid[position]) return;
        
        visited[position] = true;
        const newWord = currentWord + grid[position];
        
        // Check if this forms a valid word (4+ letters)
        if (newWord.length >= 4 && this.wordSet.has(newWord.toUpperCase())) {
            validWords.add(newWord.toUpperCase());
        }
        
        // Continue searching if word isn't too long
        if (newWord.length < 12) {
            const neighbors = this.ADJACENCY[position] || [];
            for (const neighbor of neighbors) {
                if (!visited[neighbor] && grid[neighbor]) {
                    this.dfs(grid, neighbor, newWord, [...visited], validWords);
                }
            }
        }
    }
}

async function analyzePuzzles() {
    // Load modules
    const constantsModule = await importModule(constantsPath);
    const definitionsModule = await importModule(definitionsPath);
    const cornerstoneWordsModule = await importModule(cornerstoneWordsPath);
    const wordsDbModule = await importModule(wordsDbPath);

    if (!constantsModule || !definitionsModule || !cornerstoneWordsModule || !wordsDbModule) {
        console.error('Failed to load required modules');
        return;
    }

    const { SAMPLE_PUZZLES, HAMILTONIAN_PATHS } = constantsModule;
    const { COMMON_DEFINITIONS } = definitionsModule;
    const { COMMON_WORDS_LIST } = cornerstoneWordsModule;
    const { COMPREHENSIVE_WORD_SET } = wordsDbModule;

    console.log(`📚 Total definitions available: ${Object.keys(COMMON_DEFINITIONS).length}`);
    console.log(`🎯 Total puzzles to analyze: ${Object.keys(SAMPLE_PUZZLES).length}`);
    console.log(`📖 Word database size: ${COMPREHENSIVE_WORD_SET.size}\n`);

    // Convert common words list to Set for faster lookup
    const cornerstoneWordsSet = new Set(COMMON_WORDS_LIST.map(w => w.toUpperCase()));

    // Initialize WordFinder
    const wordFinder = new WordFinder(COMPREHENSIVE_WORD_SET);

    const results = [];
    const allWordsAcrossPuzzles = new Set();
    const allCornerstoneWordsAcrossPuzzles = new Set();
    const wordsWithoutDefinitions = new Set();
    const placeholderDefinitions = new Set();

    // Analyze each puzzle
    for (const [puzzleName, puzzleData] of Object.entries(SAMPLE_PUZZLES)) {
        console.log(`🧩 Analyzing puzzle: ${puzzleName}`);
        
        // Generate grid for this puzzle
        const path = HAMILTONIAN_PATHS[puzzleData.pathIndex];
        const letters = puzzleData.seedWord.split('');
        const grid = new Array(16).fill('');
        
        path.forEach((position, index) => {
            grid[position] = letters[index];
        });

        // Find all possible words in this grid
        const allWords = wordFinder.findAllWords(grid);
        
        // Classify words as cornerstone or regular
        const cornerstoneWords = [];
        const regularWords = [];
        
        for (const word of allWords) {
            allWordsAcrossPuzzles.add(word);
            
            if (cornerstoneWordsSet.has(word)) {
                cornerstoneWords.push(word);
                allCornerstoneWordsAcrossPuzzles.add(word);
            } else {
                regularWords.push(word);
            }
        }

        // Check definition coverage
        const cornerstoneWithDefs = cornerstoneWords.filter(word => COMMON_DEFINITIONS[word]);
        const cornerstoneWithoutDefs = cornerstoneWords.filter(word => !COMMON_DEFINITIONS[word]);
        const regularWithDefs = regularWords.filter(word => COMMON_DEFINITIONS[word]);
        const regularWithoutDefs = regularWords.filter(word => !COMMON_DEFINITIONS[word]);

        // Check for placeholder definitions
        const cornerstonePlaceholders = cornerstoneWords.filter(word => 
            COMMON_DEFINITIONS[word] && COMMON_DEFINITIONS[word].startsWith('A valid English word')
        );
        const regularPlaceholders = regularWords.filter(word => 
            COMMON_DEFINITIONS[word] && COMMON_DEFINITIONS[word].startsWith('A valid English word')
        );

        // Track words without definitions
        cornerstoneWithoutDefs.forEach(word => wordsWithoutDefinitions.add(word));
        regularWithoutDefs.forEach(word => wordsWithoutDefinitions.add(word));

        // Track placeholder definitions
        cornerstonePlaceholders.forEach(word => placeholderDefinitions.add(word));
        regularPlaceholders.forEach(word => placeholderDefinitions.add(word));

        const result = {
            puzzleName,
            seedWord: puzzleData.seedWord,
            totalWords: allWords.size,
            cornerstoneWords: {
                total: cornerstoneWords.length,
                withDefinitions: cornerstoneWithDefs.length,
                withoutDefinitions: cornerstoneWithoutDefs.length,
                withPlaceholders: cornerstonePlaceholders.length,
                coverage: cornerstoneWords.length > 0 ? 
                    ((cornerstoneWithDefs.length / cornerstoneWords.length) * 100).toFixed(1) : '0.0',
                words: cornerstoneWords.sort()
            },
            regularWords: {
                total: regularWords.length,
                withDefinitions: regularWithDefs.length,
                withoutDefinitions: regularWithoutDefs.length,
                withPlaceholders: regularPlaceholders.length,
                coverage: regularWords.length > 0 ? 
                    ((regularWithDefs.length / regularWords.length) * 100).toFixed(1) : '0.0'
            },
            overall: {
                coverage: allWords.size > 0 ? 
                    (((cornerstoneWithDefs.length + regularWithDefs.length) / allWords.size) * 100).toFixed(1) : '0.0'
            }
        };

        results.push(result);

        console.log(`  📊 Total words: ${result.totalWords}`);
        console.log(`  🏛️  Cornerstone words: ${result.cornerstoneWords.total} (${result.cornerstoneWords.coverage}% with definitions)`);
        console.log(`  📝 Regular words: ${result.regularWords.total} (${result.regularWords.coverage}% with definitions)`);
        console.log(`  🎯 Overall coverage: ${result.overall.coverage}%\n`);
    }

    // Generate comprehensive report
    console.log('=' * 80);
    console.log('📋 COMPREHENSIVE DEFINITION COVERAGE REPORT');
    console.log('=' * 80);

    // Summary statistics
    const totalWordsAcrossPuzzles = allWordsAcrossPuzzles.size;
    const totalCornerstoneWords = allCornerstoneWordsAcrossPuzzles.size;
    const wordsWithDefs = Array.from(allWordsAcrossPuzzles).filter(word => COMMON_DEFINITIONS[word]).length;
    const cornerstoneWordsWithDefs = Array.from(allCornerstoneWordsAcrossPuzzles).filter(word => COMMON_DEFINITIONS[word]).length;

    console.log(`\n📈 OVERALL STATISTICS:`);
    console.log(`Total unique words across all puzzles: ${totalWordsAcrossPuzzles}`);
    console.log(`Total unique cornerstone words: ${totalCornerstoneWords}`);
    console.log(`Words with definitions: ${wordsWithDefs}/${totalWordsAcrossPuzzles} (${((wordsWithDefs/totalWordsAcrossPuzzles)*100).toFixed(1)}%)`);
    console.log(`Cornerstone words with definitions: ${cornerstoneWordsWithDefs}/${totalCornerstoneWords} (${((cornerstoneWordsWithDefs/totalCornerstoneWords)*100).toFixed(1)}%)`);
    console.log(`Words missing definitions: ${wordsWithoutDefinitions.size}`);
    console.log(`Words with placeholder definitions: ${placeholderDefinitions.size}`);

    // Detailed puzzle breakdown
    console.log(`\n📋 PUZZLE-BY-PUZZLE BREAKDOWN:`);
    console.log('─'.repeat(120));
    console.log(`${'Puzzle'.padEnd(16)} | ${'Total'.padEnd(6)} | ${'Cornerstone'.padEnd(12)} | ${'Def%'.padEnd(5)} | ${'Regular'.padEnd(8)} | ${'Def%'.padEnd(5)} | ${'Overall%'.padEnd(8)}`);
    console.log('─'.repeat(120));

    results.forEach(result => {
        console.log(`${result.puzzleName.padEnd(16)} | ${String(result.totalWords).padEnd(6)} | ${String(result.cornerstoneWords.total).padEnd(12)} | ${String(result.cornerstoneWords.coverage + '%').padEnd(5)} | ${String(result.regularWords.total).padEnd(8)} | ${String(result.regularWords.coverage + '%').padEnd(5)} | ${String(result.overall.coverage + '%').padEnd(8)}`);
    });

    // Identify puzzles with missing definitions
    const puzzlesWithIssues = results.filter(r => 
        r.cornerstoneWords.withoutDefinitions > 0 || 
        r.cornerstoneWords.withPlaceholders > 0
    );

    if (puzzlesWithIssues.length > 0) {
        console.log(`\n⚠️  PUZZLES WITH DEFINITION ISSUES:`);
        puzzlesWithIssues.forEach(result => {
            console.log(`\n🧩 ${result.puzzleName}:`);
            if (result.cornerstoneWords.withoutDefinitions > 0) {
                console.log(`  Missing definitions for ${result.cornerstoneWords.withoutDefinitions} cornerstone words`);
            }
            if (result.cornerstoneWords.withPlaceholders > 0) {
                console.log(`  Placeholder definitions for ${result.cornerstoneWords.withPlaceholders} cornerstone words`);
            }
        });
    }

    // Show specific words missing definitions (first 20)
    if (wordsWithoutDefinitions.size > 0) {
        console.log(`\n❌ WORDS MISSING DEFINITIONS (showing first 20 of ${wordsWithoutDefinitions.size}):`);
        const missingArray = Array.from(wordsWithoutDefinitions).sort();
        console.log(missingArray.slice(0, 20).join(', '));
        if (missingArray.length > 20) {
            console.log('...' + (missingArray.length - 20) + ' more words');
        }
    }

    // Show words with placeholder definitions (first 20)
    if (placeholderDefinitions.size > 0) {
        console.log(`\n🔄 WORDS WITH PLACEHOLDER DEFINITIONS (showing first 20 of ${placeholderDefinitions.size}):`);
        const placeholderArray = Array.from(placeholderDefinitions).sort();
        console.log(placeholderArray.slice(0, 20).join(', '));
        if (placeholderArray.length > 20) {
            console.log('...' + (placeholderArray.length - 20) + ' more words');
        }
    }

    // Best and worst performing puzzles
    const sortedByOverallCoverage = results.sort((a, b) => 
        parseFloat(b.overall.coverage) - parseFloat(a.overall.coverage)
    );

    console.log(`\n🏆 BEST DEFINITION COVERAGE:`);
    sortedByOverallCoverage.slice(0, 3).forEach((result, index) => {
        console.log(`${index + 1}. ${result.puzzleName}: ${result.overall.coverage}% overall coverage`);
    });

    console.log(`\n⚠️  WORST DEFINITION COVERAGE:`);
    sortedByOverallCoverage.slice(-3).reverse().forEach((result, index) => {
        console.log(`${index + 1}. ${result.puzzleName}: ${result.overall.coverage}% overall coverage`);
    });

    // Save detailed results to JSON
    const outputData = {
        summary: {
            totalPuzzles: Object.keys(SAMPLE_PUZZLES).length,
            totalUniqueWords: totalWordsAcrossPuzzles,
            totalCornerstoneWords: totalCornerstoneWords,
            wordsWithDefinitions: wordsWithDefs,
            cornerstoneWordsWithDefinitions: cornerstoneWordsWithDefs,
            wordsMissingDefinitions: wordsWithoutDefinitions.size,
            wordsWithPlaceholders: placeholderDefinitions.size,
            overallCoverage: ((wordsWithDefs/totalWordsAcrossPuzzles)*100).toFixed(1),
            cornerstoneCoverage: ((cornerstoneWordsWithDefs/totalCornerstoneWords)*100).toFixed(1)
        },
        puzzles: results,
        wordsMissingDefinitions: Array.from(wordsWithoutDefinitions).sort(),
        wordsWithPlaceholders: Array.from(placeholderDefinitions).sort()
    };

    fs.writeFileSync('definition-coverage-analysis.json', JSON.stringify(outputData, null, 2));
    console.log(`\n💾 Detailed analysis saved to: definition-coverage-analysis.json`);
    console.log(`\n✅ Analysis complete!`);
}

// Run the analysis
analyzePuzzles().catch(console.error);