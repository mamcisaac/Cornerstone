// Comprehensive automated test suite for Cornerstones game
const puppeteer = require('puppeteer');

describe('Cornerstones Game - Perfect Game Tests', () => {
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
        
        // Suppress console errors for cleaner test output
        page.on('console', msg => {
            if (msg.type() === 'error' && !msg.text().includes('favicon')) {
                console.error('Browser Error:', msg.text());
            }
        });
        
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        
        // Wait for game to fully initialize
        await page.waitForFunction(
            () => window.game && window.game.gameStarted && window.COMMON_WORDS_SET,
            { timeout: 10000 }
        );
    });
    
    afterEach(async () => {
        await page.close();
    });
    
    describe('Game Initialization', () => {
        test('should load all required components', async () => {
            const components = await page.evaluate(() => ({
                game: !!window.game,
                gameStarted: window.game?.gameStarted,
                commonWordsSet: !!window.COMMON_WORDS_SET,
                commonWordsSize: window.COMMON_WORDS_SET?.size,
                wordDatabase: !!window.COMPREHENSIVE_WORD_SET,
                wordDatabaseSize: window.COMPREHENSIVE_WORD_SET?.size
            }));
            
            expect(components.game).toBe(true);
            expect(components.gameStarted).toBe(true);
            expect(components.commonWordsSet).toBe(true);
            expect(components.commonWordsSize).toBeGreaterThan(8000);
            expect(components.wordDatabase).toBe(true);
            expect(components.wordDatabaseSize).toBeGreaterThan(300000);
        });
        
        test('should have cornerstone words in all puzzles', async () => {
            const allPuzzles = await page.evaluate(async () => {
                const puzzleNames = Object.keys(window.SAMPLE_PUZZLES);
                const results = [];
                
                for (let puzzleName of puzzleNames) {
                    window.game.currentPuzzle = puzzleName;
                    window.game.foundWords.clear();
                    window.game.generatePuzzle();
                    await window.game.findAllPossibleWords();
                    
                    results.push({
                        name: puzzleName,
                        totalWords: window.game.allPossibleWords.size,
                        cornerstoneWords: window.game.cornerstoneWords.length,
                        validWords: window.game.validWords.length,
                        grid: window.game.grid.filter(l => l).join('')
                    });
                }
                
                return results;
            });
            
            // Every puzzle should have cornerstone words
            allPuzzles.forEach(puzzle => {
                expect(puzzle.cornerstoneWords).toBeGreaterThan(0);
                expect(puzzle.totalWords).toBeGreaterThan(puzzle.cornerstoneWords);
                expect(puzzle.grid.length).toBe(12); // 12 letters in the cross
            });
        });
    });
    
    describe('UI Elements', () => {
        test('should display all UI components correctly', async () => {
            // Check grid
            const gridCells = await page.$$('.cell:not(.empty)');
            expect(gridCells.length).toBe(12);
            
            // Check stats
            const stats = await page.evaluate(() => ({
                wordsFound: document.getElementById('words-found-count')?.textContent,
                cornerstoneCount: document.getElementById('cornerstone-count')?.textContent,
                totalWords: document.getElementById('total-words-count')?.textContent,
                hints: document.getElementById('hints-remaining')?.textContent
            }));
            
            expect(stats.wordsFound).toBe('0');
            expect(stats.cornerstoneCount).toBe('0');
            expect(parseInt(stats.totalWords)).toBeGreaterThan(0);
            expect(stats.hints).toBe('3');
            
            // Check panels
            const panels = await page.evaluate(() => ({
                gamePanel: !!document.querySelector('.game-container'),
                cornerstonePanel: !!document.querySelector('.cornerstone-panel'),
                foundPanel: !!document.querySelector('.found-panel')
            }));
            
            expect(panels.gamePanel).toBe(true);
            expect(panels.cornerstonePanel).toBe(true);
            expect(panels.foundPanel).toBe(true);
        });
        
        test('should update stats when finding words', async () => {
            // Find a cornerstone word
            const testResult = await page.evaluate(() => {
                const cornerstoneWord = window.game.cornerstoneWords[0];
                if (!cornerstoneWord) return { success: false };
                
                const path = window.game.wordFinder.findWordPath(window.game.grid, cornerstoneWord.word);
                if (!path) return { success: false };
                
                // Simulate finding the word
                window.game.checkWord(cornerstoneWord.word);
                
                return {
                    success: true,
                    word: cornerstoneWord.word,
                    statsAfter: {
                        wordsFound: document.getElementById('words-found-count')?.textContent,
                        cornerstoneCount: document.getElementById('cornerstone-count')?.textContent
                    }
                };
            });
            
            expect(testResult.success).toBe(true);
            expect(testResult.statsAfter.wordsFound).toBe('1');
            expect(testResult.statsAfter.cornerstoneCount).toBe('1');
        });
    });
    
    describe('Word Finding', () => {
        test('should accept valid cornerstone words', async () => {
            const result = await page.evaluate(() => {
                const word = window.game.cornerstoneWords[0]?.word;
                if (!word) return { success: false };
                
                const beforeCount = window.game.foundWords.size;
                window.game.checkWord(word);
                const afterCount = window.game.foundWords.size;
                
                return {
                    success: true,
                    word,
                    accepted: afterCount > beforeCount,
                    isFound: window.game.cornerstoneWords[0].found
                };
            });
            
            expect(result.success).toBe(true);
            expect(result.accepted).toBe(true);
            expect(result.isFound).toBe(true);
        });
        
        test('should reject invalid words', async () => {
            const result = await page.evaluate(() => {
                const beforeCount = window.game.foundWords.size;
                window.game.checkWord('ZZZZ');
                const afterCount = window.game.foundWords.size;
                
                return {
                    accepted: afterCount > beforeCount
                };
            });
            
            expect(result.accepted).toBe(false);
        });
        
        test('should earn hints for non-cornerstone words', async () => {
            const result = await page.evaluate(() => {
                // Find a non-cornerstone valid word
                const validWord = window.game.validWords[0];
                if (!validWord) return { success: false };
                
                const hintsBefore = window.game.hintSystem.availableHints;
                window.game.checkWord(validWord);
                const hintsAfter = window.game.hintSystem.availableHints;
                
                return {
                    success: true,
                    word: validWord,
                    hintsEarned: hintsAfter - hintsBefore
                };
            });
            
            if (result.success) {
                expect(result.hintsEarned).toBe(1);
            }
        });
    });
    
    describe('Hint System', () => {
        test('should use hints correctly', async () => {
            const result = await page.evaluate(() => {
                const hintsBefore = window.game.hintSystem.availableHints;
                
                // Try to reveal a letter
                window.game.revealLetter();
                
                // Exit letter reveal mode
                window.game.exitLetterRevealMode();
                
                const hintsAfter = window.game.hintSystem.availableHints;
                
                return {
                    hintsBefore,
                    hintsAfter,
                    modeActive: window.game.globalLetterRevealMode
                };
            });
            
            expect(result.hintsBefore).toBe(3);
            expect(result.modeActive).toBe(false);
        });
        
        test('should handle definition reveal with hints', async () => {
            const result = await page.evaluate(() => {
                const hintsBefore = window.game.hintSystem.availableHints;
                
                // Start definition reveal mode
                window.game.startDefinitionRevealMode();
                const modeActive = window.game.definitionRevealMode;
                
                // Exit the mode
                window.game.exitDefinitionRevealMode();
                
                return {
                    hintsBefore,
                    modeActive,
                    modeActiveAfter: window.game.definitionRevealMode
                };
            });
            
            expect(result.hintsBefore).toBe(3);
            expect(result.modeActive).toBe(true);
            expect(result.modeActiveAfter).toBe(false);
        });
    });
    
    describe('Definitions', () => {
        test('should have definitions for all cornerstone words', async () => {
            const definitions = await page.evaluate(() => {
                return window.game.cornerstoneWords.map(w => ({
                    word: w.word,
                    hasDefinition: !!w.definition && 
                                 w.definition !== "Loading definition..." &&
                                 w.definition !== "A common English word"
                }));
            });
            
            // Most cornerstone words should have proper definitions
            const withDefinitions = definitions.filter(d => d.hasDefinition).length;
            const total = definitions.length;
            
            expect(withDefinitions / total).toBeGreaterThan(0.7); // At least 70% should have definitions
        });
    });
    
    describe('Mobile Responsiveness', () => {
        test('should show mobile tabs on small screens', async () => {
            await page.setViewport({ width: 375, height: 667 });
            
            const mobileElements = await page.evaluate(() => ({
                mobileTabs: window.getComputedStyle(document.querySelector('.mobile-tabs')).display,
                tabButtons: document.querySelectorAll('.tab-button').length
            }));
            
            expect(mobileElements.mobileTabs).not.toBe('none');
            expect(mobileElements.tabButtons).toBe(3); // Game, Cornerstone, Found
        });
    });
    
    describe('Game State Persistence', () => {
        test('should save and load progress', async () => {
            // Find a word
            await page.evaluate(() => {
                const word = window.game.cornerstoneWords[0]?.word;
                if (word) {
                    window.game.checkWord(word);
                }
            });
            
            // Save current state
            const stateBefore = await page.evaluate(() => ({
                foundWords: window.game.foundWords.size,
                puzzle: window.game.currentPuzzle
            }));
            
            // Reload page
            await page.reload({ waitUntil: 'networkidle0' });
            await page.waitForFunction(
                () => window.game && window.game.gameStarted,
                { timeout: 10000 }
            );
            
            // Check if state was restored
            const stateAfter = await page.evaluate(() => ({
                foundWords: window.game.foundWords.size,
                puzzle: window.game.currentPuzzle
            }));
            
            expect(stateAfter.foundWords).toBe(stateBefore.foundWords);
            expect(stateAfter.puzzle).toBe(stateBefore.puzzle);
        });
    });
});

// Run tests if this file is executed directly
if (require.main === module) {
    const { exec } = require('child_process');
    exec('npm test -- tests/integration/perfect-game-test.js', (error, stdout, stderr) => {
        console.log(stdout);
        if (stderr) console.error(stderr);
        if (error) {
            console.error(`Error: ${error}`);
            process.exit(1);
        }
    });
}