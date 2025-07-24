#!/usr/bin/env node

// Validate Existing Puzzles Script
// This script validates all existing puzzles in the game for quality and compliance

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
        // Load sample puzzles and constants
        const constContent = await fs.readFile('./src/js/constants.js', 'utf8');
        
        // Extract SAMPLE_PUZZLES
        const sampleMatch = constContent.match(/export const SAMPLE_PUZZLES = (\{[\s\S]*?\});/);
        if (sampleMatch) {
            eval(`data.SAMPLE_PUZZLES = ${sampleMatch[1]}`);
        }
        
        // Extract HAMILTONIAN_PATHS
        const pathsMatch = constContent.match(/export const HAMILTONIAN_PATHS = (\[[\s\S]*?\]);/);
        if (pathsMatch) {
            eval(`data.HAMILTONIAN_PATHS = ${pathsMatch[1]}`);
        } else {
            data.HAMILTONIAN_PATHS = [];
        }

        // Extract CROSS_POSITIONS
        const crossMatch = constContent.match(/export const CROSS_POSITIONS = (\[[\s\S]*?\]);/);
        if (crossMatch) {
            eval(`data.CROSS_POSITIONS = ${crossMatch[1]}`);
        } else {
            data.CROSS_POSITIONS = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14];
        }

        // Extract ADJACENCY
        const adjMatch = constContent.match(/export const ADJACENCY = (\{[\s\S]*?\});/);
        if (adjMatch) {
            eval(`data.ADJACENCY = ${adjMatch[1]}`);
        } else {
            data.ADJACENCY = {
                1: [2, 4, 5, 6], 2: [1, 5, 6, 7], 4: [1, 5, 8, 9], 5: [1, 2, 4, 6, 8, 9, 10],
                6: [1, 2, 5, 7, 9, 10, 11], 7: [2, 6, 10, 11], 8: [4, 5, 9, 13], 9: [4, 5, 6, 8, 10, 13, 14],
                10: [5, 6, 7, 9, 11, 13, 14], 11: [6, 7, 10, 14], 13: [8, 9, 10, 14], 14: [9, 10, 11, 13]
            };
        }
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

// Convert existing puzzle data to our validation format
const convertExistingPuzzlesToValidationFormat = (gameData) => {
    const puzzles = [];
    
    for (const [keystoneWord, puzzleInfo] of Object.entries(gameData.SAMPLE_PUZZLES)) {
        const pathIndex = puzzleInfo.pathIndex;
        const path = gameData.HAMILTONIAN_PATHS[pathIndex];
        
        if (!path) {
            console.warn(`⚠️  Invalid path index ${pathIndex} for ${keystoneWord}`);
            continue;
        }

        // Create grid from keystone word and path
        const grid = new Array(16).fill('');
        for (let i = 0; i < 12; i++) {
            const position = path[i];
            const letter = keystoneWord[i];
            grid[position] = letter;
        }

        puzzles.push({
            keystoneWord: keystoneWord,
            pathIndex: pathIndex,
            grid: grid,
            // We'll calculate these during validation
            allWords: [],
            cornerstoneWords: [],
            metadata: {
                source: 'existing_game_data',
                hasDefinition: Boolean(gameData.KEYSTONE_WORDS[keystoneWord])
            }
        });
    }

    return puzzles;
};

// Main validation function
const validateExistingPuzzles = async () => {
    console.log('🔍 Validating Existing Cornerstones Puzzles');
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
    console.log(`   • Definitions: ${Object.keys(gameData.COMMON_DEFINITIONS || {}).length}`);

    // Import validation modules
    console.log('\n🔧 Loading validation modules...');
    const { PuzzleValidator } = await import('./src/js/puzzleValidator.js');
    const { WordDiscoverySystem } = await import('./src/js/wordDiscovery.js');
    const { PuzzleBuilder } = await import('./src/js/puzzleBuilder.js');

    // Initialize components
    const puzzleValidator = new PuzzleValidator({
        minCornerstoneWords: 15, // Slightly lower for existing puzzles
        validateDefinitions: true
    });
    const wordDiscovery = new WordDiscoverySystem();
    const puzzleBuilder = new PuzzleBuilder();

    // Wait for word sets to load
    await puzzleBuilder.loadWordSets();
    wordDiscovery.wordSet = new Set(gameData.WORDS_DATABASE.map(w => w.toUpperCase()));

    // Convert existing puzzles to validation format
    console.log('\n🔄 Converting existing puzzles to validation format...');
    const existingPuzzles = convertExistingPuzzlesToValidationFormat(gameData);
    console.log(`   • Found ${existingPuzzles.length} puzzles to validate`);

    // Enhance puzzles with word discovery
    console.log('\n🔎 Discovering words for each puzzle...');
    for (let i = 0; i < existingPuzzles.length; i++) {
        const puzzle = existingPuzzles[i];
        console.log(`   ${i + 1}/${existingPuzzles.length}: ${puzzle.keystoneWord}`);
        
        try {
            const discoveryResults = wordDiscovery.findAllWordsComprehensive(puzzle.grid, wordDiscovery.wordSet);
            puzzle.allWords = [...discoveryResults.allWords];
            
            // Identify cornerstone words
            const commonWordsSet = new Set(gameData.COMMON_WORDS_LIST.map(w => w.toUpperCase()));
            puzzle.cornerstoneWords = puzzle.allWords.filter(word => commonWordsSet.has(word));
            
            console.log(`      • Found ${puzzle.allWords.length} total words, ${puzzle.cornerstoneWords.length} cornerstone words`);
        } catch (error) {
            console.error(`      • Error discovering words: ${error.message}`);
            puzzle.allWords = [];
            puzzle.cornerstoneWords = [];
        }
    }

    // Validate each puzzle
    console.log('\n🔍 Validating puzzles...');
    const validationResults = [];
    const commonWordsSet = new Set(gameData.COMMON_WORDS_LIST.map(w => w.toUpperCase()));
    
    for (let i = 0; i < existingPuzzles.length; i++) {
        const puzzle = existingPuzzles[i];
        console.log(`\n📋 Validating ${i + 1}/${existingPuzzles.length}: ${puzzle.keystoneWord}`);
        
        try {
            const validation = await puzzleValidator.validatePuzzle(
                puzzle, 
                commonWordsSet, 
                gameData.COMMON_DEFINITIONS
            );
            
            validationResults.push({
                puzzle: puzzle,
                validation: validation,
                index: i
            });

            // Print validation summary
            if (validation.isValid) {
                console.log(`   ✅ VALID - Quality Score: ${validation.metrics.overall?.qualityScore || 'N/A'}`);
            } else {
                console.log(`   ❌ INVALID - ${validation.errors.length} errors`);
                validation.errors.slice(0, 2).forEach(error => {
                    console.log(`      • ${error}`);
                });
            }
            
            if (validation.warnings.length > 0) {
                console.log(`   ⚠️  ${validation.warnings.length} warnings`);
                validation.warnings.slice(0, 2).forEach(warning => {
                    console.log(`      • ${warning}`);
                });
            }

        } catch (error) {
            console.error(`   💥 Validation error: ${error.message}`);
            validationResults.push({
                puzzle: puzzle,
                validation: {
                    isValid: false,
                    errors: [`Validation failed: ${error.message}`],
                    warnings: [],
                    metrics: {}
                },
                index: i
            });
        }
    }

    // Generate comprehensive report
    console.log('\n📊 Generating Validation Report...');
    const report = generateValidationReport(validationResults, gameData);
    
    // Save detailed report
    const outputDir = './validation-output';
    try {
        await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
        // Directory already exists
    }

    // Save full validation results
    await fs.writeFile(
        path.join(outputDir, 'validation-results.json'),
        JSON.stringify({
            generatedAt: new Date().toISOString(),
            summary: report.summary,
            puzzleResults: validationResults.map(r => ({
                keystoneWord: r.puzzle.keystoneWord,
                isValid: r.validation.isValid,
                qualityScore: r.validation.metrics.overall?.qualityScore,
                totalWords: r.puzzle.allWords.length,
                cornerstoneWords: r.puzzle.cornerstoneWords.length,
                errors: r.validation.errors,
                warnings: r.validation.warnings,
                recommendations: r.validation.recommendations
            }))
        }, null, 2),
        'utf8'
    );

    // Save problem puzzles list
    const problemPuzzles = validationResults
        .filter(r => !r.validation.isValid || r.validation.warnings.length > 0)
        .map(r => ({
            keystoneWord: r.puzzle.keystoneWord,
            pathIndex: r.puzzle.pathIndex,
            issues: {
                errors: r.validation.errors,
                warnings: r.validation.warnings,
                recommendations: r.validation.recommendations
            },
            stats: {
                totalWords: r.puzzle.allWords.length,
                cornerstoneWords: r.puzzle.cornerstoneWords.length,
                qualityScore: r.validation.metrics.overall?.qualityScore
            }
        }));

    await fs.writeFile(
        path.join(outputDir, 'problem-puzzles.json'),
        JSON.stringify(problemPuzzles, null, 2),
        'utf8'
    );

    // Print final report
    printValidationReport(report);
    
    console.log(`\n📁 Detailed reports saved to: ${outputDir}`);
    console.log(`   • validation-results.json - Complete validation data`);
    console.log(`   • problem-puzzles.json - Puzzles needing attention`);

    return report;
};

// Generate comprehensive validation report
const generateValidationReport = (validationResults, gameData) => {
    const total = validationResults.length;
    const valid = validationResults.filter(r => r.validation.isValid).length;
    const invalid = total - valid;
    
    // Quality score distribution
    const qualityScores = validationResults
        .map(r => r.validation.metrics.overall?.qualityScore || 0)
        .filter(score => score > 0);
    
    const avgQualityScore = qualityScores.length > 0 ? 
        Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length) : 0;

    // Word count statistics
    const wordCounts = validationResults.map(r => r.puzzle.allWords.length);
    const cornerstoneCounts = validationResults.map(r => r.puzzle.cornerstoneWords.length);
    
    const avgWordsPerPuzzle = wordCounts.length > 0 ?
        Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length) : 0;
    
    const avgCornerstoneWords = cornerstoneCounts.length > 0 ?
        Math.round(cornerstoneCounts.reduce((a, b) => a + b, 0) / cornerstoneCounts.length) : 0;

    // Most common issues
    const allErrors = validationResults.flatMap(r => r.validation.errors);
    const allWarnings = validationResults.flatMap(r => r.validation.warnings);
    
    const errorCounts = {};
    allErrors.forEach(error => {
        const key = error.split(':')[0]; // Get error type
        errorCounts[key] = (errorCounts[key] || 0) + 1;
    });

    const warningCounts = {};
    allWarnings.forEach(warning => {
        const key = warning.split(':')[0]; // Get warning type
        warningCounts[key] = (warningCounts[key] || 0) + 1;
    });

    // Puzzles needing attention
    const lowQualityPuzzles = validationResults
        .filter(r => r.validation.metrics.overall?.qualityScore < 70)
        .map(r => r.puzzle.keystoneWord);

    const insufficientCornerstones = validationResults
        .filter(r => r.puzzle.cornerstoneWords.length < 15)
        .map(r => ({
            word: r.puzzle.keystoneWord,
            count: r.puzzle.cornerstoneWords.length
        }));

    return {
        summary: {
            totalPuzzles: total,
            validPuzzles: valid,
            invalidPuzzles: invalid,
            validationRate: Math.round((valid / total) * 100),
            averageQualityScore: avgQualityScore,
            averageWordsPerPuzzle: avgWordsPerPuzzle,
            averageCornerstoneWords: avgCornerstoneWords
        },
        issues: {
            mostCommonErrors: Object.entries(errorCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5),
            mostCommonWarnings: Object.entries(warningCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5),
            lowQualityPuzzles: lowQualityPuzzles,
            insufficientCornerstones: insufficientCornerstones
        },
        recommendations: generateGlobalRecommendations(validationResults),
        gameDataHealth: {
            keystoneWordsWithDefinitions: Object.keys(gameData.KEYSTONE_WORDS).filter(w => 
                gameData.KEYSTONE_WORDS[w].definition).length,
            totalDefinitions: Object.keys(gameData.COMMON_DEFINITIONS).length,
            wordsInDatabase: gameData.WORDS_DATABASE.length,
            commonWordsCoverage: Math.round((gameData.COMMON_WORDS_LIST.length / gameData.WORDS_DATABASE.length) * 100)
        }
    };
};

// Generate global recommendations
const generateGlobalRecommendations = (validationResults) => {
    const recommendations = [];
    
    const lowCornerstoneCount = validationResults.filter(r => r.puzzle.cornerstoneWords.length < 15).length;
    if (lowCornerstoneCount > 0) {
        recommendations.push(`${lowCornerstoneCount} puzzles have fewer than 15 cornerstone words - consider finding better Hamiltonian paths`);
    }

    const lowQualityCount = validationResults.filter(r => 
        r.validation.metrics.overall?.qualityScore < 70).length;
    if (lowQualityCount > 0) {
        recommendations.push(`${lowQualityCount} puzzles have quality scores below 70 - review word discovery and definitions`);
    }

    const definitionIssues = validationResults.filter(r => 
        r.validation.warnings.some(w => w.includes('definition'))).length;
    if (definitionIssues > 0) {
        recommendations.push(`${definitionIssues} puzzles have definition-related issues - consider fetching updated definitions`);
    }

    const validationFailures = validationResults.filter(r => !r.validation.isValid).length;
    if (validationFailures > validationResults.length * 0.1) {
        recommendations.push(`High validation failure rate (${Math.round((validationFailures / validationResults.length) * 100)}%) - review puzzle generation criteria`);
    }

    return recommendations;
};

// Print validation report to console
const printValidationReport = (report) => {
    console.log('\n🎯 VALIDATION REPORT');
    console.log('═'.repeat(60));
    
    console.log('📊 SUMMARY:');
    console.log(`   • Total puzzles validated: ${report.summary.totalPuzzles}`);
    console.log(`   • Valid puzzles: ${report.summary.validPuzzles} (${report.summary.validationRate}%)`);
    console.log(`   • Invalid puzzles: ${report.summary.invalidPuzzles}`);
    console.log(`   • Average quality score: ${report.summary.averageQualityScore}/100`);
    console.log(`   • Average words per puzzle: ${report.summary.averageWordsPerPuzzle}`);
    console.log(`   • Average cornerstone words: ${report.summary.averageCornerstoneWords}`);

    if (report.issues.mostCommonErrors.length > 0) {
        console.log('\n❌ MOST COMMON ERRORS:');
        report.issues.mostCommonErrors.forEach(([error, count]) => {
            console.log(`   • ${error}: ${count} occurrences`);
        });
    }

    if (report.issues.mostCommonWarnings.length > 0) {
        console.log('\n⚠️  MOST COMMON WARNINGS:');
        report.issues.mostCommonWarnings.forEach(([warning, count]) => {
            console.log(`   • ${warning}: ${count} occurrences`);
        });
    }

    if (report.issues.insufficientCornerstones.length > 0) {
        console.log('\n🔤 PUZZLES WITH LOW CORNERSTONE COUNTS:');
        report.issues.insufficientCornerstones.slice(0, 10).forEach(item => {
            console.log(`   • ${item.word}: ${item.count} cornerstone words`);
        });
        if (report.issues.insufficientCornerstones.length > 10) {
            console.log(`   ... and ${report.issues.insufficientCornerstones.length - 10} more`);
        }
    }

    if (report.issues.lowQualityPuzzles.length > 0) {
        console.log('\n⭐ LOW QUALITY PUZZLES (Score < 70):');
        report.issues.lowQualityPuzzles.slice(0, 10).forEach(word => {
            console.log(`   • ${word}`);
        });
        if (report.issues.lowQualityPuzzles.length > 10) {
            console.log(`   ... and ${report.issues.lowQualityPuzzles.length - 10} more`);
        }
    }

    console.log('\n🏥 GAME DATA HEALTH:');
    console.log(`   • Keystone words with definitions: ${report.gameDataHealth.keystoneWordsWithDefinitions}`);
    console.log(`   • Total definitions available: ${report.gameDataHealth.totalDefinitions}`);
    console.log(`   • Words in database: ${report.gameDataHealth.wordsInDatabase}`);
    console.log(`   • Common words coverage: ${report.gameDataHealth.commonWordsCoverage}%`);

    if (report.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:');
        report.recommendations.forEach(rec => {
            console.log(`   • ${rec}`);
        });
    }

    console.log('\n✨ Validation Complete!');
};

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    validateExistingPuzzles().catch(error => {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    });
}

export { validateExistingPuzzles };