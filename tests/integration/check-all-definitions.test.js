// Check definitions for all words in all puzzles
const puppeteer = require('puppeteer');

describe('All Puzzles Definitions Check', () => {
    let browser;
    let page;
    const BASE_URL = 'http://localhost:8080';
    
    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    });
    
    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });
    
    beforeEach(async () => {
        page = await browser.newPage();
        await page.setViewport({ width: 1400, height: 900 });
        
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        
        // Wait for game to fully initialize
        await page.waitForFunction(
            () => window.game && window.game.gameStarted && window.CORNERSTONE_WORDS_SET,
            { timeout: 10000 }
        );
    });
    
    afterEach(async () => {
        await page.close();
    });
    
    test('Check definitions for all words in all puzzles', async () => {
        const allPuzzleDefinitions = await page.evaluate(async () => {
            const puzzleNames = Object.keys(window.SAMPLE_PUZZLES);
            const results = [];
            
            for (let puzzleName of puzzleNames) {
                // Switch to puzzle
                window.game.currentPuzzle = puzzleName;
                window.game.foundWords.clear();
                window.game.generatePuzzle();
                await window.game.findAllPossibleWords();
                
                // Wait for definitions to load
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check cornerstone word definitions
                const cornerstoneAnalysis = window.game.cornerstoneWords.map(w => ({
                    word: w.word,
                    definition: w.definition,
                    hasProperDef: w.definition && 
                                 w.definition !== "Loading definition..." && 
                                 w.definition !== "A common English word" &&
                                 w.definition !== "A valid English word" &&
                                 w.definition.length > 5
                }));
                
                // Check valid word definitions (sample of first 10)
                const validWordsSample = window.game.validWords.slice(0, 10);
                const validWordsAnalysis = [];
                
                for (let word of validWordsSample) {
                    let definition = "No definition";
                    if (window.game.wordDefinitions && window.game.wordDefinitions.has(word.toUpperCase())) {
                        definition = window.game.wordDefinitions.get(word.toUpperCase());
                    } else if (window.getDefinitionSync) {
                        definition = window.getDefinitionSync(word);
                    }
                    
                    validWordsAnalysis.push({
                        word: word,
                        definition: definition,
                        hasProperDef: definition && 
                                     definition !== "Loading definition..." && 
                                     definition !== "A common English word" &&
                                     definition !== "A valid English word" &&
                                     definition.length > 5
                    });
                }
                
                const cornerstoneWithDefs = cornerstoneAnalysis.filter(w => w.hasProperDef).length;
                const validWithDefs = validWordsAnalysis.filter(w => w.hasProperDef).length;
                
                results.push({
                    puzzle: puzzleName,
                    totalWords: window.game.allPossibleWords.size,
                    cornerstoneWords: {
                        total: window.game.cornerstoneWords.length,
                        withProperDefs: cornerstoneWithDefs,
                        percentage: Math.round((cornerstoneWithDefs / window.game.cornerstoneWords.length) * 100),
                        missing: cornerstoneAnalysis.filter(w => !w.hasProperDef)
                    },
                    validWords: {
                        total: window.game.validWords.length,
                        sampledCount: validWordsSample.length,
                        sampledWithDefs: validWithDefs,
                        sampledPercentage: Math.round((validWithDefs / validWordsSample.length) * 100),
                        sampleMissing: validWordsAnalysis.filter(w => !w.hasProperDef)
                    }
                });
            }
            
            return results;
        });
        
        console.log('\n=== DEFINITIONS CHECK FOR ALL PUZZLES ===\n');
        
        let totalCornerstoneWords = 0;
        let totalCornerstoneWithDefs = 0;
        let puzzlesWithIssues = [];
        
        allPuzzleDefinitions.forEach((puzzle, index) => {
            console.log(`${index + 1}. ${puzzle.puzzle}`);
            console.log(`   Total words: ${puzzle.totalWords}`);
            
            // Cornerstone words
            console.log(`   Cornerstone words: ${puzzle.cornerstoneWords.total}`);
            console.log(`     - With definitions: ${puzzle.cornerstoneWords.withProperDefs} (${puzzle.cornerstoneWords.percentage}%)`);
            if (puzzle.cornerstoneWords.missing.length > 0) {
                console.log(`     - Missing definitions:`);
                puzzle.cornerstoneWords.missing.forEach(w => {
                    console.log(`       • ${w.word}: "${w.definition}"`);
                });
                puzzlesWithIssues.push(puzzle.puzzle);
            }
            
            // Valid words (sample)
            console.log(`   Valid words: ${puzzle.validWords.total} total`);
            console.log(`     - Sample of ${puzzle.validWords.sampledCount}: ${puzzle.validWords.sampledWithDefs} have definitions (${puzzle.validWords.sampledPercentage}%)`);
            if (puzzle.validWords.sampleMissing.length > 0) {
                console.log(`     - Sample missing definitions:`);
                puzzle.validWords.sampleMissing.slice(0, 3).forEach(w => {
                    console.log(`       • ${w.word}: "${w.definition}"`);
                });
                if (puzzle.validWords.sampleMissing.length > 3) {
                    console.log(`       ... and ${puzzle.validWords.sampleMissing.length - 3} more`);
                }
            }
            
            totalCornerstoneWords += puzzle.cornerstoneWords.total;
            totalCornerstoneWithDefs += puzzle.cornerstoneWords.withProperDefs;
            
            console.log('');
        });
        
        const overallCornerstonePercentage = Math.round((totalCornerstoneWithDefs / totalCornerstoneWords) * 100);
        
        console.log('=== OVERALL SUMMARY ===');
        console.log(`Total cornerstone words across all puzzles: ${totalCornerstoneWords}`);
        console.log(`Cornerstone words with proper definitions: ${totalCornerstoneWithDefs} (${overallCornerstonePercentage}%)`);
        console.log(`Puzzles with missing cornerstone definitions: ${puzzlesWithIssues.length > 0 ? puzzlesWithIssues.join(', ') : 'NONE ✅'}`);
        
        // Assertions
        allPuzzleDefinitions.forEach(puzzle => {
            // All cornerstone words should have definitions
            expect(puzzle.cornerstoneWords.percentage).toBe(100);
            
            // At least some valid words should have definitions
            expect(puzzle.validWords.sampledPercentage).toBeGreaterThan(0);
        });
        
        // Overall cornerstone definition coverage should be 100%
        expect(overallCornerstonePercentage).toBe(100);
    });
});