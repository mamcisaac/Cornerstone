// Debug test to see what's actually loading
const puppeteer = require('puppeteer');

describe('Debug Game Loading', () => {
    let browser;
    let page;
    const BASE_URL = 'http://localhost:8003';
    
    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: false,
            slowMo: 500,
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

    test('debug what loads on the page', async () => {
        console.log('Going to:', BASE_URL);
        
        // Listen for console messages
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        
        // Wait a bit for loading
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check what's on the page
        const title = await page.title();
        console.log('Page title:', title);
        
        // Check body content
        const bodyContent = await page.evaluate(() => document.body.innerHTML);
        console.log('Body content length:', bodyContent.length);
        
        // Look for specific elements
        const hasGrid = await page.$('.game-grid');
        console.log('Has .game-grid:', !!hasGrid);
        
        const hasGridId = await page.$('#grid');
        console.log('Has #grid:', !!hasGridId);
        
        // Check what classes exist
        const allClasses = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            const classes = new Set();
            elements.forEach(el => {
                if (el.className) {
                    el.className.split(' ').forEach(cls => classes.add(cls));
                }
            });
            return Array.from(classes).sort();
        });
        console.log('All CSS classes on page:', allClasses);
        
        // Check for any divs with grid in the id
        const gridElements = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('*')).filter(el => {
                return el.id && el.id.includes('grid');
            }).map(el => ({ id: el.id, className: el.className, tagName: el.tagName }));
        });
        console.log('Grid-related elements:', gridElements);
        
        // Check if JavaScript loaded
        const hasGame = await page.evaluate(() => typeof window.game !== 'undefined');
        console.log('Window.game exists:', hasGame);
        
        // Check for errors in the browser
        const errors = await page.evaluate(() => {
            return window.jsErrors || [];
        });
        console.log('JS Errors:', errors);
        
        // Just pass the test for now - we're debugging
        expect(title).toBeTruthy();
    });
});