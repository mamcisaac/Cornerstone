#!/usr/bin/env node

// Simplified analysis script for definition coverage
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing Definition Coverage for Cornerstone Puzzles\n');

// Puzzle configurations from constants.js
const SAMPLE_PUZZLES = {
    "ARCHITECTURE": { seedWord: "ARCHITECTURE", pathIndex: 6 },
    "BREAKTHROUGH": { seedWord: "BREAKTHROUGH", pathIndex: 9 },
    "CORNERSTONES": { seedWord: "CORNERSTONES", pathIndex: 0 },
    "DEVELOPMENTS": { seedWord: "DEVELOPMENTS", pathIndex: 2 },
    "ENCYCLOPEDIA": { seedWord: "ENCYCLOPEDIA", pathIndex: 2 },
    "EXPERIMENTAL": { seedWord: "EXPERIMENTAL", pathIndex: 2 },
    "PRESENTATION": { seedWord: "PRESENTATION", pathIndex: 0 },
    "PROFESSIONAL": { seedWord: "PROFESSIONAL", pathIndex: 5 },
    "REGISTRATION": { seedWord: "REGISTRATION", pathIndex: 0 },
    "RELATIONSHIP": { seedWord: "RELATIONSHIP", pathIndex: 0 },
    "THANKSGIVING": { seedWord: "THANKSGIVING", pathIndex: 7 },
    "UNIVERSITIES": { seedWord: "UNIVERSITIES", pathIndex: 9 }
};

const HAMILTONIAN_PATHS = [
    [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11],  // Path 0
    [4, 5, 9, 8, 13, 14, 11, 7, 6, 10, 2, 1],  // Path 1
    [1, 2, 7, 11, 14, 13, 8, 4, 5, 6, 10, 9],  // Path 2
    [5, 1, 2, 6, 10, 14, 13, 9, 8, 4, 7, 11],  // Path 3
    [11, 7, 2, 1, 5, 9, 13, 14, 10, 6, 4, 8],  // Path 4
    [8, 4, 5, 1, 6, 2, 7, 11, 14, 10, 9, 13],  // Path 5
    [9, 5, 4, 8, 13, 14, 10, 6, 1, 2, 7, 11],  // Path 6
    [14, 13, 9, 10, 11, 7, 6, 2, 1, 5, 4, 8],  // Path 7
    [2, 1, 4, 5, 9, 8, 13, 14, 11, 10, 6, 7],  // Path 8
    [7, 11, 10, 14, 9, 13, 8, 4, 5, 1, 2, 6]   // Path 9
];

const ADJACENCY = {
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

// Load definitions from the word definitions file
function loadDefinitions() {
    const definitionsPath = path.join(__dirname, 'src/data/word-definitions.js');
    const definitionsContent = fs.readFileSync(definitionsPath, 'utf8');
    
    const definitions = {};
    let placeholderCount = 0;
    
    // Parse definitions using regex
    const definitionRegex = /"([A-Z]+)":\s*"([^"]*(?:\\.[^"]*)*)"/g;
    let match;
    
    while ((match = definitionRegex.exec(definitionsContent)) !== null) {
        const word = match[1];
        const definition = match[2];
        definitions[word] = definition;
        
        if (definition.startsWith('A valid English word')) {
            placeholderCount++;
        }
    }
    
    return { definitions, placeholderCount };
}

// Load word database
function loadWordDatabase() {
    const wordsDbPath = path.join(__dirname, 'src/data/words-database-compact.js');
    const wordsContent = fs.readFileSync(wordsDbPath, 'utf8');
    
    // Extract the word string - look for WORD_LIST_STRING
    const wordsMatch = wordsContent.match(/WORD_LIST_STRING\s*=\s*"([^"]+)"/);
    if (!wordsMatch) {
        console.error('Could not find WORD_LIST_STRING in database file');
        return new Set();
    }
    
    // Parse the pipe-separated words
    const wordsString = wordsMatch[1];
    const words = wordsString.split('|');
    
    if (!words || words.length === 0) {
        console.error('Could not parse words from database file');
        return new Set();
    }
    
    return new Set(words.map(w => w.toUpperCase()));
}

// Load cornerstone words list
function loadCornerstoneWords() {
    const cornerstonePath = path.join(__dirname, 'src/data/cornerstone-words.js');
    const cornerstoneContent = fs.readFileSync(cornerstonePath, 'utf8');
    
    // Extract the words array
    const wordsMatch = cornerstoneContent.match(/COMMON_WORDS_LIST\s*=\s*\[([\s\S]*?)\]/);
    if (!wordsMatch) {
        console.error('Could not find COMMON_WORDS_LIST');
        return new Set();
    }
    
    // Parse the words array
    const wordsArrayContent = wordsMatch[1];
    const words = wordsArrayContent.match(/"([^"]+)"/g);
    
    if (!words) {
        console.error('Could not parse cornerstone words');
        return new Set();
    }
    
    return new Set(words.map(w => w.replace(/"/g, '').toUpperCase()));
}

// WordFinder class for finding words in grid
class WordFinder {
    constructor(wordSet) {
        this.wordSet = wordSet || new Set();
    }

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
            const neighbors = ADJACENCY[position] || [];
            for (const neighbor of neighbors) {
                if (!visited[neighbor] && grid[neighbor]) {
                    this.dfs(grid, neighbor, newWord, [...visited], validWords);
                }
            }
        }
    }
}

function main() {
    console.log('📚 Loading definitions...');
    const { definitions, placeholderCount } = loadDefinitions();
    console.log(`   Loaded ${Object.keys(definitions).length} definitions`);
    console.log(`   Found ${placeholderCount} placeholder definitions`);
    
    console.log('🎯 Loading word database...');
    const wordDatabase = loadWordDatabase();
    console.log(`   Loaded ${wordDatabase.size} words`);
    
    console.log('🏛️  Loading cornerstone words...');
    const cornerstoneWords = loadCornerstoneWords();
    console.log(`   Loaded ${cornerstoneWords.size} cornerstone words`);
    
    console.log('🔍 Initializing word finder...\n');
    const wordFinder = new WordFinder(wordDatabase);
    
    const results = [];
    const allWordsAcrossPuzzles = new Set();
    const allCornerstoneWordsAcrossPuzzles = new Set();
    const wordsWithoutDefinitions = new Set();
    const placeholderWords = new Set();
    
    // Find placeholder words
    for (const [word, definition] of Object.entries(definitions)) {
        if (definition.startsWith('A valid English word')) {
            placeholderWords.add(word);
        }
    }
    
    console.log('🧩 Analyzing each puzzle:\n');
    
    // Analyze each puzzle
    for (const [puzzleName, puzzleData] of Object.entries(SAMPLE_PUZZLES)) {
        console.log(`Analyzing ${puzzleName}...`);
        
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
        const cornerstoneWordsInPuzzle = [];
        const regularWords = [];
        
        for (const word of allWords) {
            allWordsAcrossPuzzles.add(word);
            
            if (cornerstoneWords.has(word)) {
                cornerstoneWordsInPuzzle.push(word);
                allCornerstoneWordsAcrossPuzzles.add(word);
            } else {
                regularWords.push(word);
            }
        }

        // Check definition coverage
        const cornerstoneWithDefs = cornerstoneWordsInPuzzle.filter(word => definitions[word] && !definitions[word].startsWith('A valid English word'));
        const cornerstoneWithoutDefs = cornerstoneWordsInPuzzle.filter(word => !definitions[word]);
        const cornerstoneWithPlaceholders = cornerstoneWordsInPuzzle.filter(word => definitions[word] && definitions[word].startsWith('A valid English word'));
        
        const regularWithDefs = regularWords.filter(word => definitions[word] && !definitions[word].startsWith('A valid English word'));
        const regularWithoutDefs = regularWords.filter(word => !definitions[word]);
        const regularWithPlaceholders = regularWords.filter(word => definitions[word] && definitions[word].startsWith('A valid English word'));

        // Track words without definitions
        cornerstoneWithoutDefs.forEach(word => wordsWithoutDefinitions.add(word));
        regularWithoutDefs.forEach(word => wordsWithoutDefinitions.add(word));

        const result = {
            puzzleName,
            seedWord: puzzleData.seedWord,
            totalWords: allWords.size,
            cornerstoneWords: {
                total: cornerstoneWordsInPuzzle.length,
                withDefinitions: cornerstoneWithDefs.length,
                withoutDefinitions: cornerstoneWithoutDefs.length,
                withPlaceholders: cornerstoneWithPlaceholders.length,
                coverage: cornerstoneWordsInPuzzle.length > 0 ? 
                    ((cornerstoneWithDefs.length / cornerstoneWordsInPuzzle.length) * 100).toFixed(1) : '0.0',
                words: cornerstoneWordsInPuzzle.sort()
            },
            regularWords: {
                total: regularWords.length,
                withDefinitions: regularWithDefs.length,
                withoutDefinitions: regularWithoutDefs.length,
                withPlaceholders: regularWithPlaceholders.length,
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
        console.log(`  🏛️  Cornerstone: ${result.cornerstoneWords.total} (${result.cornerstoneWords.coverage}% coverage)`);
        console.log(`  📝 Regular: ${result.regularWords.total} (${result.regularWords.coverage}% coverage)`);
        console.log(`  🎯 Overall: ${result.overall.coverage}% coverage\n`);
    }

    // Generate comprehensive report
    console.log('═'.repeat(80));
    console.log('📋 COMPREHENSIVE DEFINITION COVERAGE REPORT');
    console.log('═'.repeat(80));

    const totalWordsAcrossPuzzles = allWordsAcrossPuzzles.size;
    const totalCornerstoneWords = allCornerstoneWordsAcrossPuzzles.size;
    const wordsWithDefs = Array.from(allWordsAcrossPuzzles).filter(word => 
        definitions[word] && !definitions[word].startsWith('A valid English word')
    ).length;
    const cornerstoneWordsWithDefs = Array.from(allCornerstoneWordsAcrossPuzzles).filter(word => 
        definitions[word] && !definitions[word].startsWith('A valid English word')
    ).length;

    console.log(`\n📈 OVERALL STATISTICS:`);
    console.log(`Total definitions available: ${Object.keys(definitions).length}`);
    console.log(`Placeholder definitions: ${placeholderCount}`);
    console.log(`Total unique words across all puzzles: ${totalWordsAcrossPuzzles}`);
    console.log(`Total unique cornerstone words: ${totalCornerstoneWords}`);
    console.log(`Words with proper definitions: ${wordsWithDefs}/${totalWordsAcrossPuzzles} (${((wordsWithDefs/totalWordsAcrossPuzzles)*100).toFixed(1)}%)`);
    console.log(`Cornerstone words with proper definitions: ${cornerstoneWordsWithDefs}/${totalCornerstoneWords} (${((cornerstoneWordsWithDefs/totalCornerstoneWords)*100).toFixed(1)}%)`);
    console.log(`Words missing definitions: ${wordsWithoutDefinitions.size}`);

    // Detailed puzzle breakdown
    console.log(`\n📋 PUZZLE-BY-PUZZLE BREAKDOWN:`);
    console.log('─'.repeat(100));
    console.log(`${'Puzzle'.padEnd(16)} | ${'Total'.padEnd(6)} | ${'C-stone'.padEnd(8)} | ${'C-Def%'.padEnd(7)} | ${'Regular'.padEnd(8)} | ${'R-Def%'.padEnd(7)} | ${'Overall%'.padEnd(8)}`);
    console.log('─'.repeat(100));

    results.forEach(result => {
        console.log(`${result.puzzleName.padEnd(16)} | ${String(result.totalWords).padEnd(6)} | ${String(result.cornerstoneWords.total).padEnd(8)} | ${String(result.cornerstoneWords.coverage + '%').padEnd(7)} | ${String(result.regularWords.total).padEnd(8)} | ${String(result.regularWords.coverage + '%').padEnd(7)} | ${String(result.overall.coverage + '%').padEnd(8)}`);
    });

    // Show cornerstone words for each puzzle
    console.log(`\n🏛️  CORNERSTONE WORDS BY PUZZLE:`);
    results.forEach(result => {
        console.log(`\n${result.puzzleName}:`);
        if (result.cornerstoneWords.words.length > 0) {
            result.cornerstoneWords.words.forEach(word => {
                const hasDef = definitions[word] && !definitions[word].startsWith('A valid English word');
                const hasPlaceholder = definitions[word] && definitions[word].startsWith('A valid English word');
                const status = hasDef ? '✅' : hasPlaceholder ? '🔄' : '❌';
                console.log(`  ${status} ${word}`);
            });
        } else {
            console.log('  No cornerstone words found');
        }
    });

    // Show words missing definitions (first 50)
    if (wordsWithoutDefinitions.size > 0) {
        console.log(`\n❌ WORDS MISSING DEFINITIONS (showing first 50 of ${wordsWithoutDefinitions.size}):`);
        const missingArray = Array.from(wordsWithoutDefinitions).sort();
        console.log(missingArray.slice(0, 50).join(', '));
        if (missingArray.length > 50) {
            console.log(`\n... and ${missingArray.length - 50} more words`);
        }
    }

    // Show placeholder definitions (first 50)
    if (placeholderWords.size > 0) {
        console.log(`\n🔄 WORDS WITH PLACEHOLDER DEFINITIONS (showing first 50 of ${placeholderWords.size}):`);
        const placeholderArray = Array.from(placeholderWords).sort();
        console.log(placeholderArray.slice(0, 50).join(', '));
        if (placeholderArray.length > 50) {
            console.log(`\n... and ${placeholderArray.length - 50} more words`);
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
        generatedAt: new Date().toISOString(),
        summary: {
            totalDefinitions: Object.keys(definitions).length,
            placeholderDefinitions: placeholderCount,
            totalPuzzles: Object.keys(SAMPLE_PUZZLES).length,
            totalUniqueWords: totalWordsAcrossPuzzles,
            totalCornerstoneWords: totalCornerstoneWords,
            wordsWithDefinitions: wordsWithDefs,
            cornerstoneWordsWithDefinitions: cornerstoneWordsWithDefs,
            wordsMissingDefinitions: wordsWithoutDefinitions.size,
            wordsWithPlaceholders: placeholderWords.size,
            overallCoverage: ((wordsWithDefs/totalWordsAcrossPuzzles)*100).toFixed(1),
            cornerstoneCoverage: ((cornerstoneWordsWithDefs/totalCornerstoneWords)*100).toFixed(1)
        },
        puzzles: results,
        wordsMissingDefinitions: Array.from(wordsWithoutDefinitions).sort(),
        wordsWithPlaceholders: Array.from(placeholderWords).sort()
    };

    fs.writeFileSync('definition-coverage-analysis.json', JSON.stringify(outputData, null, 2));
    console.log(`\n💾 Detailed analysis saved to: definition-coverage-analysis.json`);
    console.log(`\n✅ Analysis complete!`);
}

// Run the analysis
main();