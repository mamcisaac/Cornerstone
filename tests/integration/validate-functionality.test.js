// Validate core functionality works by calling methods directly
const puppeteer = require('puppeteer');

describe('Validate Core Functionality', () => {
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

    test('✅ Game initialization is perfect', async () => {
        const gameState = await page.evaluate(() => ({
            gameExists: typeof window.game !== 'undefined',
            gameStarted: window.game ? window.game.gameStarted : false,
            hintsAvailable: window.game ? window.game.hintSystem.availableHints : 0,
            cornerstoneWords: window.game ? window.game.cornerstoneWords.length : 0,
            validWords: window.game ? window.game.validWords.length : 0,
            hasRevealWordMethod: window.game ? typeof window.game.revealWord === 'function' : false,
            hasRevealLetterMethod: window.game ? typeof window.game.revealLetter === 'function' : false
        }));
        
        expect(gameState.gameExists).toBe(true);
        expect(gameState.gameStarted).toBe(true);
        expect(gameState.hintsAvailable).toBe(3);
        expect(gameState.cornerstoneWords).toBeGreaterThan(0);
        expect(gameState.validWords).toBeGreaterThan(0);
        expect(gameState.hasRevealWordMethod).toBe(true);
        expect(gameState.hasRevealLetterMethod).toBe(true);
    });

    test('✅ Hint system works by direct method call', async () => {
        // Test reveal word by calling method directly
        const beforeReveal = await page.evaluate(() => ({
            hints: window.game.hintSystem.availableHints,
            wordsFound: window.game.foundWords.size,
            cornerstoneFoundCount: window.game.cornerstoneWords.filter(w => w.found).length
        }));
        
        expect(beforeReveal.hints).toBe(3);
        expect(beforeReveal.wordsFound).toBe(0);
        expect(beforeReveal.cornerstoneFoundCount).toBe(0);
        
        // Call reveal word directly
        const revealResult = await page.evaluate(() => {
            const result = window.game.revealWord();
            return {
                success: result !== null,
                hintsAfter: window.game.hintSystem.availableHints,
                wordsFoundAfter: window.game.foundWords.size,
                cornerstoneFoundAfter: window.game.cornerstoneWords.filter(w => w.found).length
            };
        });
        
        expect(revealResult.success).toBe(true);
        expect(revealResult.hintsAfter).toBe(2); // Should decrease by 1
        expect(revealResult.cornerstoneFoundAfter).toBeGreaterThan(beforeReveal.cornerstoneFoundCount);
        
        // Verify UI updated
        const uiState = await page.evaluate(() => ({
            hintsDisplay: document.getElementById('hints-remaining').textContent,
            wordsDisplay: document.getElementById('words-found-count').textContent,
            cornerstoneDisplay: document.getElementById('cornerstone-count').textContent
        }));
        
        expect(uiState.hintsDisplay).toBe('2');
        expect(parseInt(uiState.cornerstoneDisplay)).toBeGreaterThan(0);
    });

    test('✅ Tab switching works with proper selectors', async () => {
        // Check initial state
        const initialState = await page.evaluate(() => ({
            gameTabActive: !!document.querySelector('#game-tab.active'),
            cornerstoneTabActive: !!document.querySelector('#cornerstone-tab.active')
        }));
        
        expect(initialState.gameTabActive).toBe(true);
        expect(initialState.cornerstoneTabActive).toBe(false);
        
        // Switch tabs by calling the function directly with proper element
        const switchResult = await page.evaluate(() => {
            const cornerstoneBtn = document.querySelector('button[data-tab="cornerstone"]');
            if (cornerstoneBtn && window.switchTab) {
                window.switchTab('cornerstone', cornerstoneBtn);
                return {
                    buttonFound: true,
                    functionExists: typeof window.switchTab === 'function'
                };
            }
            return { buttonFound: false, functionExists: typeof window.switchTab === 'function' };
        });
        
        expect(switchResult.buttonFound).toBe(true);
        expect(switchResult.functionExists).toBe(true);
        
        // Wait for tab switch animation
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Check state after switch
        const afterSwitch = await page.evaluate(() => ({
            gameTabActive: !!document.querySelector('#game-tab.active'),
            cornerstoneTabActive: !!document.querySelector('#cornerstone-tab.active'),
            cornerstoneTabMobile: !!document.querySelector('#cornerstone-tab.mobile-view')
        }));
        
        expect(afterSwitch.gameTabActive).toBe(false);
        expect(afterSwitch.cornerstoneTabActive).toBe(true);
    });

    test('✅ Instructions popup works perfectly', async () => {
        // Show instructions by calling function directly
        const showResult = await page.evaluate(() => {
            if (window.showInstructions) {
                window.showInstructions();
                return { functionExists: true };
            }
            return { functionExists: false };
        });
        
        expect(showResult.functionExists).toBe(true);
        
        // Wait for popup to show
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check popup is visible
        const popupVisible = await page.evaluate(() => ({
            instructionsShown: !!document.querySelector('#instructions-popup.show'),
            overlayShown: !!document.querySelector('#overlay.show'),
            title: document.querySelector('#instructions-popup h2')?.textContent
        }));
        
        expect(popupVisible.instructionsShown).toBe(true);
        expect(popupVisible.overlayShown).toBe(true);
        expect(popupVisible.title).toBe('How to Play Cornerstones');
        
        // Hide instructions
        const hideResult = await page.evaluate(() => {
            if (window.hideInstructions) {
                window.hideInstructions();
                return true;
            }
            return false;
        });
        
        expect(hideResult).toBe(true);
        
        // Wait for popup to hide
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check popup is hidden
        const popupHidden = await page.evaluate(() => ({
            instructionsHidden: !document.querySelector('#instructions-popup.show'),
            overlayHidden: !document.querySelector('#overlay.show')
        }));
        
        expect(popupHidden.instructionsHidden).toBe(true);
        expect(popupHidden.overlayHidden).toBe(true);
    });

    test('✅ All UI elements are present and accessible', async () => {
        const uiElements = await page.evaluate(() => {
            const elements = {
                gameGrid: !!document.querySelector('.game-grid'),
                cells: document.querySelectorAll('.cell:not(.empty)').length,
                statsContainer: !!document.querySelector('.stats-container'),
                wordsFoundCount: !!document.getElementById('words-found-count'),
                cornerstoneCount: !!document.getElementById('cornerstone-count'),
                totalWordsCount: !!document.getElementById('total-words-count'),
                hintsRemaining: !!document.getElementById('hints-remaining'),
                currentWord: !!document.getElementById('current-word'),
                message: !!document.getElementById('message'),
                helpButton: !!document.getElementById('help-button'),
                switchPuzzleButton: !!document.getElementById('switch-puzzle-btn'),
                tabButtons: document.querySelectorAll('.tab-button').length,
                mobileTabs: !!document.querySelector('.mobile-tabs'),
                foundWordsList: !!document.getElementById('found-words-list'),
                instructionsPopup: !!document.getElementById('instructions-popup'),
                definitionPopup: !!document.getElementById('definition-popup'),
                overlay: !!document.getElementById('overlay')
            };
            return elements;
        });
        
        expect(uiElements.gameGrid).toBe(true);
        expect(uiElements.cells).toBe(12); // 4x4 grid minus 4 corners
        expect(uiElements.statsContainer).toBe(true);
        expect(uiElements.wordsFoundCount).toBe(true);
        expect(uiElements.cornerstoneCount).toBe(true);
        expect(uiElements.totalWordsCount).toBe(true);
        expect(uiElements.hintsRemaining).toBe(true);
        expect(uiElements.currentWord).toBe(true);
        expect(uiElements.message).toBe(true);
        expect(uiElements.helpButton).toBe(true);
        expect(uiElements.switchPuzzleButton).toBe(true);
        expect(uiElements.tabButtons).toBeGreaterThanOrEqual(2);
        expect(uiElements.mobileTabs).toBe(true);
        expect(uiElements.foundWordsList).toBe(true);
        expect(uiElements.instructionsPopup).toBe(true);
        expect(uiElements.definitionPopup).toBe(true);
        expect(uiElements.overlay).toBe(true);
    });
});