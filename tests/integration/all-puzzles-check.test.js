// Comprehensive test for all puzzles
const puppeteer = require('puppeteer');

describe('All Puzzles Comprehensive Check', () => {
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
    
    test('All puzzles should have cornerstone words and definitions', async () => {
        const allPuzzleResults = await page.evaluate(async () => {
            const puzzleNames = Object.keys(window.SAMPLE_PUZZLES);
            const results = [];
            
            for (let puzzleName of puzzleNames) {
                window.game.currentPuzzle = puzzleName;
                window.game.foundWords.clear();
                window.game.generatePuzzle();
                await window.game.findAllPossibleWords();
                
                // Wait a bit for definitions to load
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const cornerstoneWords = window.game.cornerstoneWords.map(w => ({
                    word: w.word,
                    definition: w.definition,
                    hasProperDefinition: w.definition && 
                                       w.definition !== "Loading definition..." && 
                                       w.definition !== "A common English word" &&
                                       w.definition !== "A valid English word" &&
                                       w.definition.length > 10
                }));
                
                const properDefinitionsCount = cornerstoneWords.filter(w => w.hasProperDefinition).length;
                
                results.push({
                    name: puzzleName,
                    seedWord: window.SAMPLE_PUZZLES[puzzleName].seedWord,
                    pathIndex: window.SAMPLE_PUZZLES[puzzleName].pathIndex,
                    grid: window.game.grid.filter(l => l).join(''),
                    totalWords: window.game.allPossibleWords.size,
                    cornerstoneCount: window.game.cornerstoneWords.length,
                    validWordsCount: window.game.validWords.length,
                    cornerstoneWords: cornerstoneWords,
                    properDefinitionsCount: properDefinitionsCount,
                    definitionCoverage: Math.round((properDefinitionsCount / cornerstoneWords.length) * 100),
                    status: cornerstoneWords.length > 0 ? 'WORKING' : 'BROKEN'
                });
            }
            
            return results;
        });
        
        console.log('\n=== ALL PUZZLES COMPREHENSIVE ANALYSIS ===\n');
        
        let allPerfect = true;
        let totalCornerstone = 0;
        let totalProperDefs = 0;
        
        allPuzzleResults.forEach((puzzle, index) => {
            console.log(`${index + 1}. ${puzzle.name}`);
            console.log(`   Seed: ${puzzle.seedWord} | Path: ${puzzle.pathIndex} | Status: ${puzzle.status}`);
            console.log(`   Grid: ${puzzle.grid}`);
            console.log(`   Words: ${puzzle.totalWords} total (${puzzle.cornerstoneCount} cornerstone, ${puzzle.validWordsCount} valid)`);
            console.log(`   Definitions: ${puzzle.properDefinitionsCount}/${puzzle.cornerstoneCount} proper (${puzzle.definitionCoverage}%)`);
            
            if (puzzle.cornerstoneWords.length > 0) {
                console.log(`   Cornerstone words:`);
                puzzle.cornerstoneWords.forEach((word, i) => {
                    const status = word.hasProperDefinition ? '✅' : '❌';
                    console.log(`     ${i + 1}. ${word.word} ${status} - "${word.definition}"`);
                });
            } else {
                console.log(`   ❌ NO CORNERSTONE WORDS FOUND!`);
                allPerfect = false;
            }
            
            totalCornerstone += puzzle.cornerstoneCount;
            totalProperDefs += puzzle.properDefinitionsCount;
            
            if (puzzle.status !== 'WORKING' || puzzle.cornerstoneCount === 0) {
                allPerfect = false;
            }
            
            console.log('');
        });
        
        console.log('=== SUMMARY ===');
        console.log(`Total puzzles: ${allPuzzleResults.length}`);
        console.log(`Working puzzles: ${allPuzzleResults.filter(p => p.status === 'WORKING').length}`);
        console.log(`Broken puzzles: ${allPuzzleResults.filter(p => p.status === 'BROKEN').length}`);
        console.log(`Total cornerstone words: ${totalCornerstone}`);
        console.log(`Proper definitions: ${totalProperDefs}/${totalCornerstone} (${Math.round((totalProperDefs/totalCornerstone)*100)}%)`);
        console.log(`All puzzles perfect: ${allPerfect ? 'YES ✅' : 'NO ❌'}`);
        
        // Assertions
        allPuzzleResults.forEach(puzzle => {
            expect(puzzle.status).toBe('WORKING');
            expect(puzzle.cornerstoneCount).toBeGreaterThan(0);
            expect(puzzle.totalWords).toBeGreaterThan(puzzle.cornerstoneCount);
            // At least 50% of cornerstone words should have proper definitions
            expect(puzzle.definitionCoverage).toBeGreaterThanOrEqual(50);
        });
        
        expect(allPerfect).toBe(true);
    });
});