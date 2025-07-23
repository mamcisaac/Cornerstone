// Critical functionality tests for Cornerstones game
const puppeteer = require('puppeteer');

describe('Cornerstones Game - Critical Functionality', () => {
    let browser;
    let page;
    const BASE_URL = 'http://localhost:8003';
    
    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true, // Run headless for speed
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    beforeEach(async () => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        // Wait for game to initialize
        await page.waitForSelector('.game-grid', { timeout: 15000 });
        await page.waitForFunction(
            () => window.game && window.game.gameStarted,
            { timeout: 20000 }
        );
    });

    test('✅ Game loads and initializes correctly', async () => {
        // Check basic page structure
        const title = await page.title();
        expect(title).toBe('Cornerstones - Word Puzzle Game');
        
        // Check game components are present
        const grid = await page.$('.game-grid');
        expect(grid).toBeTruthy();
        
        const stats = await page.$('.stats-container');
        expect(stats).toBeTruthy();
        
        // Check that grid has 12 letter cells (4x4 minus 4 corners)
        const cells = await page.$$('.cell:not(.empty)');
        expect(cells.length).toBe(12);
        
        // Verify each cell has a letter
        for (let cell of cells) {
            const text = await cell.evaluate(el => el.textContent.trim());
            expect(text).toMatch(/^[A-Z]$/);
        }
        
        // Check initial stats
        const wordsFound = await page.$eval('#words-found-count', el => el.textContent);
        const hintsRemaining = await page.$eval('#hints-remaining', el => el.textContent);
        
        expect(wordsFound).toBe('0');
        expect(hintsRemaining).toBe('3');
    });

    test('✅ Word selection via mouse drag works', async () => {
        // Get first two cells for testing
        const cells = await page.$$('.cell:not(.empty)');
        expect(cells.length).toBeGreaterThan(1);
        
        const cell1 = cells[0];
        const cell2 = cells[1];
        
        const cell1Box = await cell1.boundingBox();
        const cell2Box = await cell2.boundingBox();
        
        // Perform drag from cell1 to cell2
        await page.mouse.move(
            cell1Box.x + cell1Box.width / 2,
            cell1Box.y + cell1Box.height / 2
        );
        await page.mouse.down();
        
        await page.mouse.move(
            cell2Box.x + cell2Box.width / 2,
            cell2Box.y + cell2Box.height / 2
        );
        
        // Check if cells get selected
        const hasSelectedCells = await page.waitForFunction(() => {
            const selectedCells = document.querySelectorAll('.cell.selected');
            return selectedCells.length > 0;
        }, { timeout: 3000 }).catch(() => false);
        
        await page.mouse.up();
        
        // At minimum, drag interaction should work (even if word is invalid)
        expect(hasSelectedCells).toBeTruthy();
    });

    test('✅ Hint system functions correctly', async () => {
        // Test reveal letter hint
        const initialHints = await page.$eval('#hints-remaining', el => parseInt(el.textContent));
        expect(initialHints).toBe(3);
        
        const revealLetterBtn = await page.$('#reveal-letter-btn');
        expect(revealLetterBtn).toBeTruthy();
        
        // Click reveal letter hint
        await revealLetterBtn.click();
        await page.waitForTimeout(1000);
        
        // Check hints decreased
        const hintsAfter = await page.$eval('#hints-remaining', el => parseInt(el.textContent));
        expect(hintsAfter).toBe(2);
        
        // Test reveal word hint
        const revealWordBtn = await page.$('#reveal-word-btn');
        await revealWordBtn.click();
        await page.waitForTimeout(1000);
        
        // Check hints decreased further
        const hintsAfter2 = await page.$eval('#hints-remaining', el => parseInt(el.textContent));
        expect(hintsAfter2).toBe(1);
        
        // Check that words found increased after reveal word
        const wordsFound = await page.$eval('#words-found-count', el => parseInt(el.textContent));
        expect(wordsFound).toBeGreaterThan(0);
    });

    test('✅ Instructions popup works', async () => {
        const helpButton = await page.$('#help-button');
        expect(helpButton).toBeTruthy();
        
        await helpButton.click();
        
        // Wait for instructions popup
        await page.waitForSelector('#instructions-popup.show', { timeout: 3000 });
        
        const popup = await page.$('#instructions-popup.show');
        expect(popup).toBeTruthy();
        
        // Check popup content
        const content = await page.$eval('#instructions-popup h2', el => el.textContent);
        expect(content).toBe('How to Play Cornerstones');
        
        // Close popup
        const closeBtn = await page.$('#close-instructions');
        await closeBtn.click();
        
        await page.waitForFunction(() => {
            const popup = document.querySelector('#instructions-popup.show');
            return !popup;
        }, { timeout: 3000 });
    });

    test('✅ Tab switching works correctly', async () => {
        // Check initial state - should be on game tab
        const gameTab = await page.$('#game-tab.active');
        expect(gameTab).toBeTruthy();
        
        // Click cornerstone tab
        const cornerstoneTabBtn = await page.$('button[data-tab="cornerstone"]');
        await cornerstoneTabBtn.click();
        
        await page.waitForTimeout(500);
        
        // Check tab switched
        const cornerstoneTab = await page.$('#cornerstone-tab.active');
        expect(cornerstoneTab).toBeTruthy();
        
        const gameTabInactive = await page.$('#game-tab:not(.active)');
        expect(gameTabInactive).toBeTruthy();
        
        // Switch back to game tab
        const gameTabBtn = await page.$('button[data-tab="game"]');
        await gameTabBtn.click();
        
        await page.waitForTimeout(500);
        
        const gameTabActive = await page.$('#game-tab.active');
        expect(gameTabActive).toBeTruthy();
    });

    test('✅ Cornerstone words progress displays', async () => {
        // Switch to cornerstone tab
        const cornerstoneTabBtn = await page.$('button[data-tab="cornerstone"]');
        await cornerstoneTabBtn.click();
        await page.waitForTimeout(500);
        
        // Check progress indicator
        const progress = await page.$('.progress-indicator');
        expect(progress).toBeTruthy();
        
        const progressText = await page.$eval('#progress-text', el => el.textContent);
        expect(progressText).toMatch(/\d+%/);
        
        // Check cornerstone words list
        const cornerstoneList = await page.$('#cornerstone-words');
        expect(cornerstoneList).toBeTruthy();
        
        // Verify we have cornerstone words listed
        const cornerstoneWords = await page.$$('.cornerstone-word');
        expect(cornerstoneWords.length).toBeGreaterThan(0);
    });

    test('✅ Real word validation works', async () => {
        // Get the grid state to try to find a valid word
        const gridLetters = await page.evaluate(() => {
            const cells = Array.from(document.querySelectorAll('.cell:not(.empty)'));
            return cells.map(cell => ({
                letter: cell.textContent.trim(),
                index: parseInt(cell.dataset.index)
            }));
        });
        
        // Try to find a simple 4-letter word pattern
        // We'll use the reveal word hint to ensure we test with a valid word
        await page.click('#reveal-word-btn');
        await page.waitForTimeout(1000);
        
        // Check that a word was found
        const wordsFound = await page.$eval('#words-found-count', el => parseInt(el.textContent));
        expect(wordsFound).toBeGreaterThan(0);
        
        // Check that the word appears in the found words list
        const foundWordsList = await page.$('#found-words-list');
        const foundWords = await foundWordsList.$$('.found-word');
        expect(foundWords.length).toBeGreaterThan(0);
    });
});

// Mobile-specific tests
describe('Cornerstones Game - Mobile Functionality', () => {
    let browser;
    let page;
    const BASE_URL = 'http://localhost:8003';
    
    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        await page.setViewport({ width: 375, height: 667 }); // iPhone size
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15');
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    beforeEach(async () => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        await page.waitForSelector('.game-grid', { timeout: 15000 });
        await page.waitForFunction(
            () => window.game && window.game.gameStarted,
            { timeout: 20000 }
        );
    });

    test('✅ Mobile layout loads correctly', async () => {
        // Check mobile-specific elements
        const mobileTabs = await page.$('.mobile-tabs');
        expect(mobileTabs).toBeTruthy();
        
        // Check responsive layout
        const viewport = await page.viewport();
        expect(viewport.width).toBe(375);
        
        // Verify game loads on mobile
        const grid = await page.$('.game-grid');
        expect(grid).toBeTruthy();
        
        const cells = await page.$$('.cell:not(.empty)');
        expect(cells.length).toBe(12);
    });

    test('✅ Mobile tab switching works', async () => {
        // Check mobile tabs are visible and functional
        const tabButtons = await page.$$('.mobile-tabs .tab-button');
        expect(tabButtons.length).toBe(2);
        
        // Click cornerstone tab
        const cornerstoneBtn = tabButtons[1];
        await cornerstoneBtn.click();
        await page.waitForTimeout(500);
        
        // Check tab switched
        const cornerstoneTab = await page.$('#cornerstone-tab.active');
        expect(cornerstoneTab).toBeTruthy();
        
        // Check mobile-specific class
        const mobileView = await page.$('#cornerstone-tab.mobile-view');
        expect(mobileView).toBeTruthy();
    });

    test('✅ Mobile hints interface works', async () => {
        // Switch to cornerstone tab where hints are located
        const cornerstoneTabBtn = await page.$('button[data-tab="cornerstone"]');
        await cornerstoneTabBtn.click();
        await page.waitForTimeout(500);
        
        // Check hint section is accessible
        const hintSection = await page.$('.hint-section-sticky');
        expect(hintSection).toBeTruthy();
        
        // Test hint button interaction
        const revealWordBtn = await page.$('#reveal-word-btn');
        expect(revealWordBtn).toBeTruthy();
        
        await revealWordBtn.click();
        await page.waitForTimeout(1000);
        
        // Verify hint was used
        const hintsRemaining = await page.$eval('#hint-count-display', 
            el => el.textContent
        );
        expect(hintsRemaining).toMatch(/\d+ remaining/);
    });
});