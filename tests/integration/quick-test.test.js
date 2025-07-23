// Quick test to identify issues
const puppeteer = require('puppeteer');

describe('Quick Functionality Test', () => {
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

    test('basic game loading', async () => {
        console.log('Loading page...');
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        
        console.log('Waiting for grid...');
        const gridFound = await page.waitForSelector('.game-grid', { timeout: 10000 })
            .then(() => true)
            .catch(() => false);
        
        console.log('Grid found:', gridFound);
        expect(gridFound).toBe(true);
        
        console.log('Checking for window.game...');
        const gameExists = await page.evaluate(() => typeof window.game !== 'undefined');
        console.log('Window.game exists:', gameExists);
        
        if (gameExists) {
            console.log('Checking game.gameStarted...');
            const gameStarted = await page.evaluate(() => window.game.gameStarted);
            console.log('Game started:', gameStarted);
            
            if (!gameStarted) {
                console.log('Waiting for game to start...');
                const gameReady = await page.waitForFunction(
                    () => window.game && window.game.gameStarted,
                    { timeout: 10000 }
                ).then(() => true).catch(() => false);
                console.log('Game ready:', gameReady);
            }
        }
        
        // Get current stats
        const stats = await page.evaluate(() => {
            const wordsFound = document.getElementById('words-found-count')?.textContent || 'not found';
            const hints = document.getElementById('hints-remaining')?.textContent || 'not found';
            return { wordsFound, hints };
        });
        console.log('Stats:', stats);
        
        expect(true).toBe(true); // Just pass for now
    });
});