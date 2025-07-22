const puppeteer = require('puppeteer');

async function testGame() {
    const browser = await puppeteer.launch({ 
        headless: false,
        slowMo: 250
    });
    
    const page = await browser.newPage();
    
    console.log('Navigating to game...');
    await page.goto('https://mamcisaac.github.io/Cornerstone');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    console.log('Page loaded, checking content...');
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if any grid elements exist
    const gridExists = await page.evaluate(() => {
        return {
            hasGrid: !!document.querySelector('.grid'),
            hasGame: !!document.querySelector('.game'),
            hasBody: !!document.body,
            bodyContent: document.body.innerHTML.substring(0, 500)
        };
    });
    
    console.log('Grid check:', gridExists);
    
    // Listen for console logs
    page.on('console', (msg) => {
        console.log('BROWSER:', msg.text());
    });
    
    // Wait and capture any error or console output
    await page.waitForTimeout(5000);
    
    // Get all found words if any
    const gameInfo = await page.evaluate(() => {
        // Try different selectors to find the game elements
        const possibleSelectors = [
            '.found-words',
            '.score',
            '.grid',
            '.puzzle',
            '#game',
            '[class*="grid"]',
            '[class*="word"]',
            '[class*="score"]'
        ];
        
        const found = {};
        possibleSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                found[selector] = elements.length;
            }
        });
        
        return {
            url: window.location.href,
            foundElements: found,
            hasScript: !!document.querySelector('script'),
            allClasses: Array.from(document.querySelectorAll('*'))
                .map(el => el.className)
                .filter(c => c)
                .slice(0, 20)
        };
    });
    
    console.log('Game info:', gameInfo);
    
    await browser.close();
}

testGame().catch(console.error);