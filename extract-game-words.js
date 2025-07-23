// Script to extract all 208 words directly from the game's own functions
const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractGameWords() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Load the game
        const filePath = 'file://' + require('path').resolve('index.html');
        await page.goto(filePath);
        
        // Wait for game to load
        await page.waitForSelector('#gameGrid', { timeout: 10000 });
        
        // Extract all words using the game's own function
        const allWords = await page.evaluate(() => {
            // Access the game's allPossibleWords set
            if (window.game && window.game.allPossibleWords) {
                return Array.from(window.game.allPossibleWords).sort();
            }
            return [];
        });
        
        console.log(`Extracted ${allWords.length} words from the game:`);
        
        // Save to file
        const output = `// All ${allWords.length} words from Cornerstones puzzle
// Extracted directly from the game's allPossibleWords set

const ALL_CORNERSTONES_WORDS = ${JSON.stringify(allWords, null, 2)};

module.exports = { ALL_CORNERSTONES_WORDS };
`;
        
        fs.writeFileSync('all-cornerstones-words.js', output);
        console.log(`Saved ${allWords.length} words to all-cornerstones-words.js`);
        
        return allWords;
        
    } finally {
        await browser.close();
    }
}

// Run if called directly
if (require.main === module) {
    extractGameWords().catch(console.error);
}

module.exports = { extractGameWords };