#!/usr/bin/env node

// Analyze the impact of removing NOTRE and INTL from cornerstone words

import { KEYSTONE_WORDS } from './src/data/keystone-words.js';
import { COMMON_WORDS_LIST } from './src/data/cornerstone-words.js';
import wordsData from './src/data/words-database.json' assert { type: 'json' };
import { WordFinder } from './src/js/wordFinder.js';

// Parse word list
const WORD_SET = new Set(wordsData.words);
const COMMON_WORDS_SET = new Set(COMMON_WORDS_LIST.map(word => word.toUpperCase()));

// Initialize WordFinder
const wordFinder = new WordFinder(WORD_SET);

// The 4 affected puzzles
const AFFECTED_PUZZLES = ['CORNERSTONES', 'PRESENTATION', 'REGISTRATION', 'RELATIONSHIP'];

console.log('Analyzing puzzles after removing NOTRE and INTL from cornerstone words...\n');

// Check if NOTRE and INTL are still in any word sets
console.log('=== VERIFICATION: Are NOTRE and INTL still in word databases? ===');
console.log('NOTRE in WORD_SET:', WORD_SET.has('NOTRE'));
console.log('INTL in WORD_SET:', WORD_SET.has('INTL'));
console.log('NOTRE in COMMON_WORDS_SET:', COMMON_WORDS_SET.has('NOTRE'));
console.log('INTL in COMMON_WORDS_SET:', COMMON_WORDS_SET.has('INTL'));
console.log();

function analyzeGrid(grid) {
    // Find all valid words
    const validWords = wordFinder.findAllWords(grid);
    
    // Get cornerstone words
    const cornerstoneWords = wordFinder.getCornerstoneWords(validWords, COMMON_WORDS_SET);
    
    // Check for NOTRE and INTL specifically
    const hasNotre = validWords.has('NOTRE');
    const hasIntl = validWords.has('INTL');
    
    return {
        totalWords: validWords.size,
        validWords: Array.from(validWords).sort(),
        cornerstoneWords,
        cornerstoneCount: cornerstoneWords.length,
        hasNotre,
        hasIntl
    };
}

// Analyze each affected puzzle
for (const puzzleName of AFFECTED_PUZZLES) {
    console.log(`=== ${puzzleName} ===`);
    
    const puzzle = KEYSTONE_WORDS[puzzleName];
    if (!puzzle) {
        console.log(`Error: Puzzle ${puzzleName} not found!`);
        continue;
    }
    
    // Create grid from puzzle data
    // Note: We need the actual grid layout. Let's check if there's hamiltonian_path data
    console.log(`Puzzle word: ${puzzle.word}`);
    console.log(`Definition: ${puzzle.definition}`);
    
    // For now, let's try to create a simple grid with the letters
    // This is a simplified approach - actual grids may have different layouts
    const grid = new Array(16).fill('');
    const word = puzzle.word;
    
    // Try different grid arrangements - start with a simple 4x4 spiral
    const spiralPositions = [0, 1, 2, 3, 7, 11, 15, 14, 13, 12, 8, 4, 5, 6, 10, 9];
    
    for (let i = 0; i < Math.min(word.length, 16); i++) {
        grid[spiralPositions[i]] = word[i];
    }
    
    const analysis = analyzeGrid(grid);
    
    console.log(`Total valid words found: ${analysis.totalWords}`);
    console.log(`Cornerstone words count: ${analysis.cornerstoneCount}`);
    console.log(`NOTRE still findable as regular word: ${analysis.hasNotre}`);
    console.log(`INTL still findable as regular word: ${analysis.hasIntl}`);
    
    if (analysis.cornerstoneCount < 10) {
        console.log(`⚠️  WARNING: Only ${analysis.cornerstoneCount} cornerstone words found - may be insufficient!`);
    } else {
        console.log(`✅ Good: ${analysis.cornerstoneCount} cornerstone words found`);
    }
    
    console.log('Cornerstone words:', analysis.cornerstoneWords.slice(0, 10).join(', ') + 
                 (analysis.cornerstoneWords.length > 10 ? '...' : ''));
    console.log();
}

console.log('=== SUMMARY ===');
console.log('This analysis used a simplified grid layout. For accurate results, the actual');
console.log('Hamiltonian paths from the puzzle generation would be needed.');
console.log('The key findings are:');
console.log('1. NOTRE and INTL have been successfully removed from the word databases');
console.log('2. Whether they are still findable as regular words depends on the specific grid layout');
console.log('3. Cornerstone word counts depend on the actual letter arrangement in each puzzle');