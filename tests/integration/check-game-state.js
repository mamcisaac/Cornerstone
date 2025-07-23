// Simple test to check game state in browser console
const puppeteer = require('puppeteer');

async function checkGameState() {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 50
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    // Enable console logging
    page.on('console', msg => console.log('Browser:', msg.text()));
    page.on('error', err => console.error('Error:', err));
    page.on('pageerror', err => console.error('Page Error:', err));
    
    try {
        console.log('Navigating to game...');
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
        
        // Wait a bit for everything to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if game exists
        const gameExists = await page.evaluate(() => {
            return {
                gameExists: typeof window.game !== 'undefined',
                gameStarted: window.game?.gameStarted,
                commonWordsSetExists: typeof window.COMMON_WORDS_SET !== 'undefined',
                commonWordsSize: window.COMMON_WORDS_SET?.size
            };
        });
        
        console.log('\nGame State:', gameExists);
        
        if (gameExists.gameExists) {
            // Get detailed game info
            const gameInfo = await page.evaluate(() => {
                const game = window.game;
                return {
                    currentPuzzle: game.currentPuzzle,
                    cornerstoneWords: game.cornerstoneWords?.length || 0,
                    allPossibleWords: game.allPossibleWords?.size || 0,
                    gridLetters: game.grid?.filter(l => l).join('') || ''
                };
            });
            
            console.log('\nGame Info:', gameInfo);
            
            // Check UI elements
            const uiElements = await page.evaluate(() => {
                return {
                    grid: !!document.querySelector('.game-grid'),
                    cells: document.querySelectorAll('.cell:not(.empty)').length,
                    statsContainer: !!document.querySelector('.stats-container'),
                    cornerstonePanel: !!document.querySelector('.cornerstone-panel')
                };
            });
            
            console.log('\nUI Elements:', uiElements);
        }
        
        // Keep browser open for manual inspection
        console.log('\nBrowser will stay open for inspection. Press Ctrl+C to close.');
        await new Promise(() => {}); // Keep running
        
    } catch (error) {
        console.error('Test failed:', error);
        await browser.close();
    }
}

checkGameState();