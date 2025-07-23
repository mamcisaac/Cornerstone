// Debug specific issues found in testing
const puppeteer = require('puppeteer');

describe('Debug Issues', () => {
    let browser;
    let page;
    const BASE_URL = 'http://localhost:8003';
    
    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: false, // Show browser to see what's happening
            slowMo: 1000,
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
        // Add console logging
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    });

    test('debug hint button issue', async () => {
        console.log('=== DEBUGGING HINT SYSTEM ===');
        
        // Check initial hints
        const initialHints = await page.evaluate(() => {
            const hintsEl = document.getElementById('hints-remaining');
            return {
                text: hintsEl ? hintsEl.textContent : 'not found',
                gameHints: window.game ? window.game.hintSystem.availableHints : 'no game'
            };
        });
        console.log('Initial hints:', initialHints);
        
        // Find reveal word button
        const revealWordBtn = await page.$('#reveal-word-btn');
        console.log('Reveal word button found:', !!revealWordBtn);
        
        if (revealWordBtn) {
            const isVisible = await revealWordBtn.isIntersectingViewport();
            console.log('Button is visible:', isVisible);
            
            // Try to click it
            console.log('Clicking reveal word button...');
            await revealWordBtn.click();
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check hints after
            const afterHints = await page.evaluate(() => {
                const hintsEl = document.getElementById('hints-remaining');
                return {
                    text: hintsEl ? hintsEl.textContent : 'not found',
                    gameHints: window.game ? window.game.hintSystem.availableHints : 'no game',
                    wordsFound: document.getElementById('words-found-count')?.textContent,
                    cornerstoneCount: document.getElementById('cornerstone-count')?.textContent
                };
            });
            console.log('After hints:', afterHints);
        }
        
        expect(true).toBe(true); // Just debug for now
    });

    test('debug tab switching issue', async () => {
        console.log('=== DEBUGGING TAB SWITCHING ===');
        
        // Find all tab buttons
        const allButtons = await page.$$('button');
        console.log('Total buttons found:', allButtons.length);
        
        const tabButtons = await page.$$('.tab-button');
        console.log('Tab buttons found:', tabButtons.length);
        
        for (let i = 0; i < tabButtons.length; i++) {
            const buttonInfo = await tabButtons[i].evaluate((el, index) => ({
                index,
                text: el.textContent.trim(),
                className: el.className,
                dataTab: el.getAttribute('data-tab'),
                visible: el.offsetParent !== null
            }), i);
            console.log(`Button ${i}:`, buttonInfo);
        }
        
        // Try to switch to cornerstone tab
        if (tabButtons.length > 1) {
            console.log('Attempting to click cornerstone tab...');
            try {
                await tabButtons[1].click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const tabState = await page.evaluate(() => ({
                    gameTabActive: !!document.querySelector('#game-tab.active'),
                    cornerstoneTabActive: !!document.querySelector('#cornerstone-tab.active')
                }));
                console.log('Tab state after click:', tabState);
            } catch (error) {
                console.log('Click error:', error.message);
            }
        }
        
        expect(true).toBe(true);
    });
});