// Debug cornerstone word detection logic
const puppeteer = require('puppeteer');

describe('Cornerstone Word Detection Debug', () => {
    let browser;
    let page;
    const BASE_URL = 'http://localhost:8080';
    
    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    });
    
    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });
    
    beforeEach(async () => {
        page = await browser.newPage();
        await page.setViewport({ width: 1400, height: 900 });
        
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        
        // Wait for game to fully initialize
        await page.waitForFunction(
            () => window.game && window.game.gameStarted && window.CORNERSTONE_WORDS_SET,
            { timeout: 10000 }
        );
    });
    
    afterEach(async () => {
        await page.close();
    });
    
    test('Debug AVAILABILITY puzzle cornerstone detection', async () => {
        const details = await page.evaluate(async () => {
            // Switch to AVAILABILITY puzzle
            window.game.currentPuzzle = 'AVAILABILITY';
            window.game.foundWords.clear();
            window.game.generatePuzzle();
            
            // Log the grid
            const grid = window.game.grid;
            const gridLetters = grid.filter(l => l).join('');
            
            // Manually find all possible words using WordFinder
            window.game.wordFinder.wordSet = window.COMPREHENSIVE_WORD_SET;
            const allWords = window.game.wordFinder.findAllWords(grid);
            
            // Check each word against CORNERSTONE_WORDS_SET
            const wordAnalysis = [];
            allWords.forEach(word => {
                const isInCommon = window.CORNERSTONE_WORDS_SET.has(word.toLowerCase());
                wordAnalysis.push({
                    word: word,
                    isCornerstone: isInCommon,
                    length: word.length
                });
            });
            
            // Sort by cornerstone status and then alphabetically
            wordAnalysis.sort((a, b) => {
                if (a.isCornerstone !== b.isCornerstone) {
                    return b.isCornerstone - a.isCornerstone; // cornerstone first
                }
                return a.word.localeCompare(b.word);
            });
            
            const cornerstoneWords = wordAnalysis.filter(w => w.isCornerstone);
            const validWords = wordAnalysis.filter(w => !w.isCornerstone);
            
            return {
                puzzleName: 'AVAILABILITY',
                gridLetters: gridLetters,
                totalWordsFound: allWords.size,
                cornerstoneCount: cornerstoneWords.length,
                validWordsCount: validWords.length,
                cornerstoneWords: cornerstoneWords.map(w => w.word),
                validWords: validWords.slice(0, 10).map(w => w.word), // First 10 for brevity
                allWordsAnalysis: wordAnalysis.slice(0, 20) // First 20 for detailed view
            };
        });
        
        console.log('\n=== AVAILABILITY PUZZLE CORNERSTONE DEBUG ===');
        console.log(`Grid letters: ${details.gridLetters}`);
        console.log(`Total words that can be formed: ${details.totalWordsFound}`);
        console.log(`Cornerstone words (in common-words.js): ${details.cornerstoneCount}`);
        console.log(`Valid words (not in common-words.js): ${details.validWordsCount}`);
        
        console.log('\n=== CORNERSTONE WORDS ===');
        details.cornerstoneWords.forEach((word, i) => {
            console.log(`${i + 1}. ${word}`);
        });
        
        console.log('\n=== FIRST 10 VALID WORDS ===');
        details.validWords.forEach((word, i) => {
            console.log(`${i + 1}. ${word}`);
        });
        
        console.log('\n=== DETAILED ANALYSIS (first 20 words) ===');
        details.allWordsAnalysis.forEach((item, i) => {
            const status = item.isCornerstone ? 'CORNERSTONE' : 'VALID';
            console.log(`${i + 1}. ${item.word} (${item.length} letters) - ${status}`);
        });
        
        // The cornerstone count should be reasonable (not 30 for every puzzle)
        expect(details.cornerstoneCount).toBeGreaterThan(0);
        expect(details.cornerstoneCount).toBeLessThan(15); // Should be much less than 30
        expect(details.totalWordsFound).toBe(details.cornerstoneCount + details.validWordsCount);
    });
});