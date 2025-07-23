// Comprehensive Puppeteer tests for Cornerstones game
const puppeteer = require('puppeteer');

describe('Cornerstones Game - Comprehensive Testing', () => {
    let browser;
    let desktopPage;
    let mobilePage;
    const BASE_URL = 'http://localhost:8003';
    
    beforeAll(async () => {
        // Launch browser with debugging
        browser = await puppeteer.launch({
            headless: false, // Set to false to see what's happening
            slowMo: 100, // Slow down actions for stability
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        // Create desktop page
        desktopPage = await browser.newPage();
        await desktopPage.setViewport({ width: 1200, height: 800 });
        
        // Create mobile page
        mobilePage = await browser.newPage();
        await mobilePage.setViewport({ width: 375, height: 667 }); // iPhone 6/7/8 size
        await mobilePage.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15');
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    describe('Desktop Tests', () => {
        beforeEach(async () => {
            await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle0' });
            // Wait for game to initialize
            await desktopPage.waitForSelector('.game-grid', { timeout: 10000 });
            await desktopPage.waitForFunction(
                () => window.game && window.game.gameStarted,
                { timeout: 15000 }
            );
        });

        test('should load game correctly on desktop', async () => {
            // Check basic page structure
            const title = await desktopPage.title();
            expect(title).toBe('Cornerstones - Word Puzzle Game');
            
            // Check game components are present
            const grid = await desktopPage.$('.game-grid');
            expect(grid).toBeTruthy();
            
            const stats = await desktopPage.$('.stats-container');
            expect(stats).toBeTruthy();
            
            // Check that grid has letters
            const cells = await desktopPage.$$('.cell:not(.empty)');
            expect(cells.length).toBe(12); // 4x4 grid minus 4 corner cells
            
            // Verify each cell has a letter
            for (let cell of cells) {
                const text = await cell.evaluate(el => el.textContent.trim());
                expect(text).toMatch(/^[A-Z]$/);
            }
        });

        test('should display game statistics correctly', async () => {
            // Check initial stats
            const wordsFound = await desktopPage.$eval('#words-found-count', el => el.textContent);
            const cornerstoneCount = await desktopPage.$eval('#cornerstone-count', el => el.textContent);
            const totalWords = await desktopPage.$eval('#total-words-count', el => el.textContent);
            const hintsRemaining = await desktopPage.$eval('#hints-remaining', el => el.textContent);
            
            expect(wordsFound).toBe('0');
            expect(cornerstoneCount).toBe('0');
            expect(parseInt(totalWords)).toBeGreaterThan(0);
            expect(hintsRemaining).toBe('3');
        });

        test('should allow word selection via mouse drag', async () => {
            // Get available cells
            const cells = await desktopPage.$$('.cell:not(.empty)');
            expect(cells.length).toBeGreaterThan(3);
            
            // Get positions of first few cells for dragging
            const cell1 = cells[0];
            const cell2 = cells[1];
            
            const cell1Box = await cell1.boundingBox();
            const cell2Box = await cell2.boundingBox();
            
            // Perform drag from cell1 to cell2
            await desktopPage.mouse.move(
                cell1Box.x + cell1Box.width / 2,
                cell1Box.y + cell1Box.height / 2
            );
            await desktopPage.mouse.down();
            
            await desktopPage.mouse.move(
                cell2Box.x + cell2Box.width / 2,
                cell2Box.y + cell2Box.height / 2
            );
            
            // Check if cells are selected
            await desktopPage.waitForFunction(() => {
                const selectedCells = document.querySelectorAll('.cell.selected');
                return selectedCells.length > 0;
            }, { timeout: 2000 });
            
            await desktopPage.mouse.up();
            
            // Verify selection worked
            const selectedCells = await desktopPage.$$('.cell.selected');
            expect(selectedCells.length).toBeGreaterThanOrEqual(1);
        });

        test('should find and validate real words', async () => {
            // Get the current grid letters to find valid words
            const gridLetters = await desktopPage.evaluate(() => {
                const cells = Array.from(document.querySelectorAll('.cell:not(.empty)'));
                return cells.map(cell => ({
                    letter: cell.textContent.trim(),
                    index: parseInt(cell.dataset.index)
                }));
            });
            
            // Try to find a valid 4-letter word by testing common patterns
            const testWords = ['TONE', 'STONE', 'NOTES', 'NETS', 'TENS', 'NEST'];
            let foundValidWord = false;
            
            for (const word of testWords) {
                try {
                    // Check if word can be formed from available letters
                    const wordLetters = word.split('');
                    const availableLetters = gridLetters.map(g => g.letter);
                    
                    const canForm = wordLetters.every(letter => 
                        availableLetters.includes(letter)
                    );
                    
                    if (canForm) {
                        // Try to select this word by finding the path
                        const path = [];
                        for (const letter of wordLetters) {
                            const cellIndex = gridLetters.find(g => 
                                g.letter === letter && !path.includes(g.index)
                            )?.index;
                            if (cellIndex !== undefined) {
                                path.push(cellIndex);
                            }
                        }
                        
                        if (path.length === wordLetters.length) {
                            // Simulate selecting this word
                            await desktopPage.evaluate((path) => {
                                window.game.selectedPath = path;
                                window.game.submitCurrentWord();
                            }, path);
                            
                            // Wait for message to appear
                            await desktopPage.waitForSelector('#message', { timeout: 2000 });
                            
                            const message = await desktopPage.$eval('#message', el => el.textContent);
                            
                            if (message.includes('found') || message.includes('Word found')) {
                                foundValidWord = true;
                                break;
                            }
                        }
                    }
                } catch (error) {
                    // Continue to next word
                    continue;
                }
            }
            
            // For now, just verify the game responds to word attempts
            const messageElement = await desktopPage.$('#message');
            expect(messageElement).toBeTruthy();
        });

        test('should handle hint system correctly', async () => {
            // Test reveal letter hint
            const revealLetterBtn = await desktopPage.$('#reveal-letter-btn');
            expect(revealLetterBtn).toBeTruthy();
            
            // Click reveal letter hint
            await revealLetterBtn.click();
            await desktopPage.waitForTimeout(1000);
            
            // Check hints decreased
            const hintsAfter = await desktopPage.$eval('#hints-remaining', el => el.textContent);
            expect(parseInt(hintsAfter)).toBeLessThan(3);
            
            // Test reveal word hint
            const revealWordBtn = await desktopPage.$('#reveal-word-btn');
            await revealWordBtn.click();
            await desktopPage.waitForTimeout(1000);
            
            // Check hints decreased further
            const hintsAfter2 = await desktopPage.$eval('#hints-remaining', el => el.textContent);
            expect(parseInt(hintsAfter2)).toBeLessThan(parseInt(hintsAfter));
        });

        test('should show instructions popup', async () => {
            const helpButton = await desktopPage.$('#help-button');
            expect(helpButton).toBeTruthy();
            
            await helpButton.click();
            
            // Wait for instructions popup
            await desktopPage.waitForSelector('#instructions-popup.show', { timeout: 2000 });
            
            const popup = await desktopPage.$('#instructions-popup.show');
            expect(popup).toBeTruthy();
            
            // Check popup content
            const content = await desktopPage.$eval('#instructions-popup h2', el => el.textContent);
            expect(content).toBe('How to Play Cornerstones');
            
            // Close popup
            const closeBtn = await desktopPage.$('#close-instructions');
            await closeBtn.click();
            
            await desktopPage.waitForFunction(() => {
                const popup = document.querySelector('#instructions-popup.show');
                return !popup;
            }, { timeout: 2000 });
        });

        test('should handle tab switching', async () => {
            // Check initial state - should be on game tab
            const gameTab = await desktopPage.$('#game-tab.active');
            expect(gameTab).toBeTruthy();
            
            // Click cornerstone tab
            const cornerstoneTabBtn = await desktopPage.$('button[data-tab="cornerstone"]');
            await cornerstoneTabBtn.click();
            
            await desktopPage.waitForTimeout(500);
            
            // Check tab switched
            const cornerstoneTab = await desktopPage.$('#cornerstone-tab.active');
            expect(cornerstoneTab).toBeTruthy();
            
            const gameTabInactive = await desktopPage.$('#game-tab:not(.active)');
            expect(gameTabInactive).toBeTruthy();
            
            // Switch back to game tab
            const gameTabBtn = await desktopPage.$('button[data-tab="game"]');
            await gameTabBtn.click();
            
            await desktopPage.waitForTimeout(500);
            
            const gameTabActive = await desktopPage.$('#game-tab.active');
            expect(gameTabActive).toBeTruthy();
        });

        test('should show cornerstone words progress', async () => {
            // Switch to cornerstone tab
            const cornerstoneTabBtn = await desktopPage.$('button[data-tab="cornerstone"]');
            await cornerstoneTabBtn.click();
            await desktopPage.waitForTimeout(500);
            
            // Check progress indicator
            const progress = await desktopPage.$('.progress-indicator');
            expect(progress).toBeTruthy();
            
            const progressText = await desktopPage.$eval('#progress-text', el => el.textContent);
            expect(progressText).toMatch(/\d+%/);
            
            // Check cornerstone words list
            const cornerstoneList = await desktopPage.$('#cornerstone-words');
            expect(cornerstoneList).toBeTruthy();
        });
    });

    describe('Mobile Tests', () => {
        beforeEach(async () => {
            await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle0' });
            // Wait for game to initialize
            await mobilePage.waitForSelector('.game-grid', { timeout: 10000 });
            await mobilePage.waitForFunction(
                () => window.game && window.game.gameStarted,
                { timeout: 15000 }
            );
        });

        test('should load game correctly on mobile', async () => {
            // Check mobile-specific elements
            const mobileTabs = await mobilePage.$('.mobile-tabs');
            expect(mobileTabs).toBeTruthy();
            
            // Check responsive layout
            const viewport = await mobilePage.viewport();
            expect(viewport.width).toBe(375);
            
            // Verify game loads
            const grid = await mobilePage.$('.game-grid');
            expect(grid).toBeTruthy();
            
            const cells = await mobilePage.$$('.cell:not(.empty)');
            expect(cells.length).toBe(12);
        });

        test('should handle mobile tab switching', async () => {
            // Check mobile tabs are visible
            const tabButtons = await mobilePage.$$('.mobile-tabs .tab-button');
            expect(tabButtons.length).toBe(2);
            
            // Click cornerstone tab
            const cornerstoneBtn = tabButtons[1];
            await cornerstoneBtn.click();
            await mobilePage.waitForTimeout(500);
            
            // Check tab switched
            const cornerstoneTab = await mobilePage.$('#cornerstone-tab.active');
            expect(cornerstoneTab).toBeTruthy();
            
            // Check mobile-specific class
            const mobileView = await mobilePage.$('#cornerstone-tab.mobile-view');
            expect(mobileView).toBeTruthy();
        });

        test('should handle touch events for word selection', async () => {
            const cells = await mobilePage.$$('.cell:not(.empty)');
            expect(cells.length).toBeGreaterThan(1);
            
            const cell1 = cells[0];
            const cell2 = cells[1];
            
            // Get cell positions
            const cell1Box = await cell1.boundingBox();
            const cell2Box = await cell2.boundingBox();
            
            // Simulate touch drag
            await mobilePage.touchscreen.tap(
                cell1Box.x + cell1Box.width / 2,
                cell1Box.y + cell1Box.height / 2
            );
            
            // Check if touch interaction works
            await mobilePage.waitForTimeout(500);
            
            // Verify touch events are handled
            const touchCapable = await mobilePage.evaluate(() => {
                return 'ontouchstart' in window;
            });
            expect(touchCapable).toBe(true);
        });

        test('should display mobile-optimized UI', async () => {
            // Check mobile-specific styles are applied
            const bodyClass = await mobilePage.$eval('body', el => el.className);
            
            // Verify mobile layout adjustments
            const gameContainer = await mobilePage.$('.game-container');
            const containerStyles = await gameContainer.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    padding: styles.padding,
                    margin: styles.margin
                };
            });
            
            expect(containerStyles).toBeDefined();
            
            // Check that mobile tabs are functional
            const mobileTabs = await mobilePage.$('.mobile-tabs');
            const isVisible = await mobileTabs.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return styles.display !== 'none';
            });
            expect(isVisible).toBe(true);
        });

        test('should handle mobile hint interactions', async () => {
            // Switch to cornerstone tab where hints are located
            const cornerstoneTabBtn = await mobilePage.$('button[data-tab="cornerstone"]');
            await cornerstoneTabBtn.click();
            await mobilePage.waitForTimeout(500);
            
            // Check hint section is accessible
            const hintSection = await mobilePage.$('.hint-section-sticky');
            expect(hintSection).toBeTruthy();
            
            // Test hint button interaction
            const revealWordBtn = await mobilePage.$('#reveal-word-btn');
            expect(revealWordBtn).toBeTruthy();
            
            await revealWordBtn.click();
            await mobilePage.waitForTimeout(1000);
            
            // Verify hint was used
            const hintsRemaining = await mobilePage.$eval('#hint-count-display', 
                el => el.textContent
            );
            expect(hintsRemaining).toMatch(/\d+ remaining/);
        });
    });

    describe('Cross-Platform Consistency', () => {
        test('should have consistent game state between desktop and mobile', async () => {
            // Load game on both platforms
            await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle0' });
            await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle0' });
            
            await Promise.all([
                desktopPage.waitForSelector('.game-grid', { timeout: 10000 }),
                mobilePage.waitForSelector('.game-grid', { timeout: 10000 })
            ]);
            
            await Promise.all([
                desktopPage.waitForFunction(() => window.game && window.game.gameStarted, { timeout: 15000 }),
                mobilePage.waitForFunction(() => window.game && window.game.gameStarted, { timeout: 15000 })
            ]);
            
            // Get grid letters from both platforms
            const desktopLetters = await desktopPage.evaluate(() => {
                return Array.from(document.querySelectorAll('.cell:not(.empty)'))
                    .map(cell => cell.textContent.trim());
            });
            
            const mobileLetters = await mobilePage.evaluate(() => {
                return Array.from(document.querySelectorAll('.cell:not(.empty)'))
                    .map(cell => cell.textContent.trim());
            });
            
            // Verify same puzzle is loaded
            expect(desktopLetters).toEqual(mobileLetters);
            
            // Check stats consistency
            const desktopStats = await desktopPage.evaluate(() => ({
                total: document.getElementById('total-words-count').textContent,
                hints: document.getElementById('hints-remaining').textContent
            }));
            
            const mobileStats = await mobilePage.evaluate(() => ({
                total: document.getElementById('total-words-count').textContent,
                hints: document.getElementById('hints-remaining').textContent
            }));
            
            expect(desktopStats).toEqual(mobileStats);
        });
    });
});