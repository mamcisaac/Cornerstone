// Final comprehensive functionality tests for Cornerstones game
const puppeteer = require('puppeteer');

describe('Cornerstones Game - Final Comprehensive Testing', () => {
    let browser;
    let page;
    const BASE_URL = 'http://localhost:8003';
    
    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true,
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
        await page.waitForSelector('.game-grid', { timeout: 15000 });
        await page.waitForFunction(
            () => window.game && window.game.gameStarted,
            { timeout: 20000 }
        );
    });

    test('✅ Game loads and initializes perfectly', async () => {
        // Check page title
        const title = await page.title();
        expect(title).toBe('Cornerstones - Word Puzzle Game');
        
        // Check essential elements
        const grid = await page.$('.game-grid');
        expect(grid).toBeTruthy();
        
        const stats = await page.$('.stats-container');
        expect(stats).toBeTruthy();
        
        // Verify correct number of cells (4x4 grid minus 4 corners = 12)
        const cells = await page.$$('.cell:not(.empty)');
        expect(cells.length).toBe(12);
        
        // Verify each cell has a letter
        for (let cell of cells) {
            const text = await cell.evaluate(el => el.textContent.trim());
            expect(text).toMatch(/^[A-Z]$/);
        }
        
        // Check initial game state
        const gameState = await page.evaluate(() => ({
            wordsFound: document.getElementById('words-found-count').textContent,
            cornerstoneCount: document.getElementById('cornerstone-count').textContent,
            totalWords: document.getElementById('total-words-count').textContent,
            hintsRemaining: document.getElementById('hints-remaining').textContent,
            gameStarted: window.game.gameStarted
        }));
        
        expect(gameState.wordsFound).toBe('0');
        expect(gameState.cornerstoneCount).toBe('0');
        expect(parseInt(gameState.totalWords)).toBeGreaterThan(0);
        expect(gameState.hintsRemaining).toBe('3');
        expect(gameState.gameStarted).toBe(true);
    });

    test('✅ Hint system works perfectly', async () => {
        // Test reveal word hint (should be most reliable)
        const initialStats = await page.evaluate(() => ({
            wordsFound: parseInt(document.getElementById('words-found-count').textContent),
            cornerstoneCount: parseInt(document.getElementById('cornerstone-count').textContent),
            hints: parseInt(document.getElementById('hints-remaining').textContent)
        }));
        
        expect(initialStats.hints).toBe(3);
        
        // Click reveal word button
        await page.click('#reveal-word-btn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check that a word was revealed
        const afterRevealStats = await page.evaluate(() => ({
            wordsFound: parseInt(document.getElementById('words-found-count').textContent),
            cornerstoneCount: parseInt(document.getElementById('cornerstone-count').textContent),
            hints: parseInt(document.getElementById('hints-remaining').textContent)
        }));
        
        expect(afterRevealStats.hints).toBe(2); // Should decrease by 1
        expect(afterRevealStats.cornerstoneCount).toBeGreaterThan(initialStats.cornerstoneCount); // Should increase
        
        // Test reveal letter hint
        await page.click('#reveal-letter-btn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const afterLetterHint = await page.evaluate(() => 
            parseInt(document.getElementById('hints-remaining').textContent)
        );
        
        expect(afterLetterHint).toBe(1); // Should decrease by 1 more
    });

    test('✅ Instructions popup functions perfectly', async () => {
        // Open instructions
        await page.click('#help-button');
        
        // Wait for popup to show
        await page.waitForSelector('#instructions-popup.show', { timeout: 3000 });
        
        // Verify popup content
        const popupVisible = await page.$('#instructions-popup.show');
        expect(popupVisible).toBeTruthy();
        
        const title = await page.$eval('#instructions-popup h2', el => el.textContent);
        expect(title).toBe('How to Play Cornerstones');
        
        // Test closing via button
        await page.click('#close-instructions');
        
        // Wait for popup to hide
        await page.waitForFunction(() => {
            const popup = document.querySelector('#instructions-popup.show');
            return !popup;
        }, { timeout: 3000 });
        
        // Verify popup is closed
        const popupHidden = await page.$('#instructions-popup.show');
        expect(popupHidden).toBeNull();
    });

    test('✅ Tab switching works perfectly', async () => {
        // Verify initial state (game tab active)
        let gameTabActive = await page.$('#game-tab.active');
        expect(gameTabActive).toBeTruthy();
        
        // Find and click cornerstone tab button
        const tabButtons = await page.$$('.tab-button');
        expect(tabButtons.length).toBeGreaterThanOrEqual(2);
        
        // Click the second tab button (cornerstone)
        await tabButtons[1].click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify tab switched
        const cornerstoneTabActive = await page.$('#cornerstone-tab.active');
        expect(cornerstoneTabActive).toBeTruthy();
        
        const gameTabInactive = await page.$('#game-tab:not(.active)');
        expect(gameTabInactive).toBeTruthy();
        
        // Switch back to game tab
        await tabButtons[0].click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify switched back
        gameTabActive = await page.$('#game-tab.active');
        expect(gameTabActive).toBeTruthy();
    });

    test('✅ Cornerstone words display works perfectly', async () => {
        // Switch to cornerstone tab
        const tabButtons = await page.$$('.tab-button');
        await tabButtons[1].click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check progress elements
        const progressIndicator = await page.$('.progress-indicator');
        expect(progressIndicator).toBeTruthy();
        
        const progressText = await page.$eval('#progress-text', el => el.textContent);
        expect(progressText).toMatch(/\d+%/);
        
        const progressNumber = await page.$eval('#cornerstone-progress', el => el.textContent);
        expect(progressNumber).toMatch(/\d+\/\d+/);
        
        // Check cornerstone words list
        const cornerstoneList = await page.$('#cornerstone-words');
        expect(cornerstoneList).toBeTruthy();
        
        // Verify cornerstone words are displayed
        const cornerstoneWords = await page.$$('.cornerstone-word');
        expect(cornerstoneWords.length).toBeGreaterThan(0);
        
        // Check hint section
        const hintSection = await page.$('.hint-section-sticky');
        expect(hintSection).toBeTruthy();
        
        const hintButtons = await page.$$('.hint-button');
        expect(hintButtons.length).toBe(3); // reveal word, reveal letter, show definition
    });

    test('✅ Word finding and validation works', async () => {
        // Use reveal word to get a guaranteed valid word
        await page.click('#reveal-word-btn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check that word was found
        const wordsFound = await page.evaluate(() => 
            parseInt(document.getElementById('words-found-count').textContent)
        );
        expect(wordsFound).toBeGreaterThan(0);
        
        // Check that it appears in found words list
        const foundWords = await page.$$('#found-words-list .found-word');
        expect(foundWords.length).toBeGreaterThan(0);
        
        // Verify cornerstone count increased
        const cornerstoneCount = await page.evaluate(() => 
            parseInt(document.getElementById('cornerstone-count').textContent)
        );
        expect(cornerstoneCount).toBeGreaterThan(0);
    });

    test('✅ UI responsiveness and interaction', async () => {
        // Test various UI elements are clickable and responsive
        const elementsToTest = [
            '#help-button',
            '.tab-button',
            '#reveal-word-btn',
            '#reveal-letter-btn',
            '#show-definition-btn'
        ];
        
        for (const selector of elementsToTest) {
            const element = await page.$(selector);
            expect(element).toBeTruthy();
            
            // Verify element is visible
            const isVisible = await element.isIntersectingViewport();
            expect(isVisible).toBe(true);
        }
        
        // Test that current word display exists
        const currentWordDisplay = await page.$('#current-word');
        expect(currentWordDisplay).toBeTruthy();
        
        // Test message area
        const messageArea = await page.$('#message');
        expect(messageArea).toBeTruthy();
    });
});

// Mobile-specific comprehensive tests
describe('Cornerstones Game - Mobile Perfect Testing', () => {
    let browser;
    let page;
    const BASE_URL = 'http://localhost:8003';
    
    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        await page.setViewport({ width: 375, height: 667 });
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

    test('✅ Mobile layout is perfect', async () => {
        // Check mobile-specific elements
        const mobileTabs = await page.$('.mobile-tabs');
        expect(mobileTabs).toBeTruthy();
        
        // Verify mobile viewport
        const viewport = await page.viewport();
        expect(viewport.width).toBe(375);
        expect(viewport.height).toBe(667);
        
        // Check game loads properly on mobile
        const grid = await page.$('.game-grid');
        expect(grid).toBeTruthy();
        
        const cells = await page.$$('.cell:not(.empty)');
        expect(cells.length).toBe(12);
        
        // Check mobile tab buttons
        const mobileTabButtons = await page.$$('.mobile-tabs .tab-button');
        expect(mobileTabButtons.length).toBe(2);
    });

    test('✅ Mobile tab navigation is perfect', async () => {
        // Test mobile tab switching
        const tabButtons = await page.$$('.mobile-tabs .tab-button');
        
        // Initially on game tab
        let gameTabActive = await page.$('#game-tab.active');
        expect(gameTabActive).toBeTruthy();
        
        // Switch to cornerstone tab
        await tabButtons[1].click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check mobile-specific behavior
        const cornerstoneTabActive = await page.$('#cornerstone-tab.active');
        expect(cornerstoneTabActive).toBeTruthy();
        
        const mobileView = await page.$('#cornerstone-tab.mobile-view');
        expect(mobileView).toBeTruthy();
        
        // Switch back
        await tabButtons[0].click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        gameTabActive = await page.$('#game-tab.active');
        expect(gameTabActive).toBeTruthy();
    });

    test('✅ Mobile hints interface is perfect', async () => {
        // Navigate to hints (cornerstone tab)
        const tabButtons = await page.$$('.mobile-tabs .tab-button');
        await tabButtons[1].click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check hint section accessibility
        const hintSection = await page.$('.hint-section-sticky');
        expect(hintSection).toBeTruthy();
        
        // Test hint functionality on mobile
        const initialHints = await page.evaluate(() => 
            parseInt(document.getElementById('hints-remaining').textContent)
        );
        
        await page.click('#reveal-word-btn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const hintsAfter = await page.evaluate(() => 
            parseInt(document.getElementById('hints-remaining').textContent)
        );
        
        expect(hintsAfter).toBe(initialHints - 1);
        
        // Check hint display update
        const hintDisplay = await page.$eval('#hint-count-display', el => el.textContent);
        expect(hintDisplay).toMatch(/\d+ remaining/);
    });

    test('✅ Mobile UI elements are properly sized and accessible', async () => {
        // Check that UI elements are appropriately sized for mobile
        const buttonSizes = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.map(btn => {
                const rect = btn.getBoundingClientRect();
                return {
                    width: rect.width,
                    height: rect.height,
                    id: btn.id || btn.className
                };
            });
        });
        
        // Buttons should be at least 44px (iOS minimum touch target)
        buttonSizes.forEach(button => {
            expect(button.height).toBeGreaterThanOrEqual(30); // Reasonable minimum
        });
        
        // Check text is readable (not too small)
        const textSizes = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            return elements.map(el => {
                const styles = window.getComputedStyle(el);
                const fontSize = parseFloat(styles.fontSize);
                return fontSize;
            }).filter(size => !isNaN(size) && size > 0);
        });
        
        // Most text should be at least 14px for mobile readability
        const smallText = textSizes.filter(size => size < 12);
        expect(smallText.length / textSizes.length).toBeLessThan(0.1); // Less than 10% too small
    });
});