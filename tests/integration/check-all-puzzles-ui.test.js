// Check UI display for all puzzles
const puppeteer = require('puppeteer');

describe('All Puzzles UI Display Check', () => {
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
    
    test('Check UI stats for all puzzles', async () => {
        const puzzleStats = await page.evaluate(async () => {
            const puzzleNames = Object.keys(window.SAMPLE_PUZZLES);
            const results = [];
            
            for (let puzzleName of puzzleNames) {
                // Switch to puzzle
                window.game.currentPuzzle = puzzleName;
                window.game.foundWords.clear();
                window.game.generatePuzzle();
                await window.game.findAllPossibleWords();
                
                // Update the UI stats (this was missing!)
                window.game.updateStats();
                window.game.updateCornerstoneDisplay();
                
                // Wait for UI to update
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Get UI values
                const foundCount = document.getElementById('words-found-count')?.textContent || '0';
                const cornerstoneCount = document.getElementById('cornerstone-count')?.textContent || '0';
                const totalWords = document.getElementById('total-words-count')?.textContent || '0';
                const cornerstoneProgress = document.getElementById('cornerstone-progress')?.textContent || '0/0';
                
                // Get actual game values
                const actualCornerstone = window.game.cornerstoneWords.length;
                const actualTotal = window.game.allPossibleWords.size;
                const actualFound = window.game.foundWords.size;
                
                results.push({
                    puzzle: puzzleName,
                    gridLetters: window.game.grid.filter(l => l).join(''),
                    ui: {
                        found: foundCount,
                        cornerstone: cornerstoneCount,
                        total: totalWords,
                        progress: cornerstoneProgress
                    },
                    actual: {
                        found: actualFound,
                        cornerstone: actualCornerstone,
                        total: actualTotal
                    },
                    mismatch: {
                        cornerstone: cornerstoneCount !== actualCornerstone.toString(),
                        total: totalWords !== actualTotal.toString(),
                        found: foundCount !== actualFound.toString()
                    }
                });
            }
            
            return results;
        });
        
        console.log('\n=== UI STATS CHECK FOR ALL PUZZLES ===\n');
        
        let hasErrors = false;
        
        puzzleStats.forEach((puzzle, index) => {
            console.log(`${index + 1}. ${puzzle.puzzle}`);
            console.log(`   Grid: ${puzzle.gridLetters}`);
            console.log(`   UI Display: ${puzzle.ui.found} found, ${puzzle.ui.cornerstone} cornerstone, ${puzzle.ui.total} total`);
            console.log(`   Actual Game: ${puzzle.actual.found} found, ${puzzle.actual.cornerstone} cornerstone, ${puzzle.actual.total} total`);
            console.log(`   Progress: ${puzzle.ui.progress}`);
            
            if (puzzle.mismatch.cornerstone || puzzle.mismatch.total || puzzle.mismatch.found) {
                console.log(`   ❌ MISMATCH DETECTED!`);
                if (puzzle.mismatch.cornerstone) console.log(`      - Cornerstone: UI shows ${puzzle.ui.cornerstone}, actual is ${puzzle.actual.cornerstone}`);
                if (puzzle.mismatch.total) console.log(`      - Total: UI shows ${puzzle.ui.total}, actual is ${puzzle.actual.total}`);
                if (puzzle.mismatch.found) console.log(`      - Found: UI shows ${puzzle.ui.found}, actual is ${puzzle.actual.found}`);
                hasErrors = true;
            } else {
                console.log(`   ✅ UI matches game state`);
            }
            console.log('');
        });
        
        console.log('=== SUMMARY ===');
        console.log(`Puzzles checked: ${puzzleStats.length}`);
        console.log(`Errors found: ${hasErrors ? 'YES ❌' : 'NO ✅'}`);
        
        // Assertions
        puzzleStats.forEach(puzzle => {
            expect(puzzle.mismatch.cornerstone).toBe(false);
            expect(puzzle.mismatch.total).toBe(false);
            expect(puzzle.mismatch.found).toBe(false);
            expect(parseInt(puzzle.ui.cornerstone)).toBeGreaterThan(0);
            expect(parseInt(puzzle.ui.total)).toBeGreaterThan(parseInt(puzzle.ui.cornerstone));
        });
    });
});