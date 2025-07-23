// Specific test for AVAILABILITY puzzle debugging
const puppeteer = require('puppeteer');

describe('AVAILABILITY Puzzle Debug', () => {
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
    
    test('AVAILABILITY puzzle detailed analysis', async () => {
        const availabilityDetails = await page.evaluate(async () => {
            // Switch to AVAILABILITY puzzle
            window.game.currentPuzzle = 'AVAILABILITY';
            window.game.foundWords.clear();
            window.game.generatePuzzle();
            await window.game.findAllPossibleWords();
            
            // Get detailed information
            const result = {
                puzzleName: window.game.currentPuzzle,
                grid: window.game.grid.filter(l => l).join(''),
                seedWord: window.SAMPLE_PUZZLES.AVAILABILITY.seedWord,
                pathIndex: window.SAMPLE_PUZZLES.AVAILABILITY.pathIndex,
                totalWords: window.game.allPossibleWords.size,
                cornerstoneCount: window.game.cornerstoneWords.length,
                validWordsCount: window.game.validWords.length,
                cornerstoneWords: window.game.cornerstoneWords.map(w => ({
                    word: w.word,
                    definition: w.definition,
                    hasDefinition: w.definition && w.definition !== "Loading definition..." && w.definition !== "A common English word"
                })),
                validWords: window.game.validWords.slice(0, 10), // First 10 for brevity
                commonWordsSetSize: window.CORNERSTONE_WORDS_SET.size,
                comprehensiveSetSize: window.COMPREHENSIVE_WORD_SET.size,
                availabilityInCommon: window.CORNERSTONE_WORDS_SET.has('availability'),
                abilityInCommon: window.CORNERSTONE_WORDS_SET.has('ability'),
                baliInCommon: window.CORNERSTONE_WORDS_SET.has('bali'),
                availInCommon: window.CORNERSTONE_WORDS_SET.has('avail'),
                vailInCommon: window.CORNERSTONE_WORDS_SET.has('vail'),
                bailInCommon: window.CORNERSTONE_WORDS_SET.has('bail'),
                availabilityDefinition: window.getDefinitionSync ? window.getDefinitionSync('AVAILABILITY') : 'No getDefinitionSync'
            };
            
            return result;
        });
        
        console.log('\n=== AVAILABILITY PUZZLE ANALYSIS ===');
        console.log(`Puzzle: ${availabilityDetails.puzzleName}`);
        console.log(`Grid letters: ${availabilityDetails.grid}`);
        console.log(`Seed word: ${availabilityDetails.seedWord}`);
        console.log(`Path index: ${availabilityDetails.pathIndex}`);
        console.log(`Total words found: ${availabilityDetails.totalWords}`);
        console.log(`Cornerstone words: ${availabilityDetails.cornerstoneCount}`);
        console.log(`Valid words: ${availabilityDetails.validWordsCount}`);
        console.log(`Common words set size: ${availabilityDetails.commonWordsSetSize}`);
        console.log(`Comprehensive set size: ${availabilityDetails.comprehensiveSetSize}`);
        
        console.log('\n=== CORNERSTONE WORDS ===');
        availabilityDetails.cornerstoneWords.forEach((word, index) => {
            console.log(`${index + 1}. ${word.word} - Definition: "${word.definition}" (Has proper def: ${word.hasDefinition})`);
        });
        
        console.log('\n=== WORD SET CHECKS ===');
        console.log(`"availability" in CORNERSTONE_WORDS_SET: ${availabilityDetails.availabilityInCommon}`);
        console.log(`"ability" in CORNERSTONE_WORDS_SET: ${availabilityDetails.abilityInCommon}`);
        console.log(`"bali" in CORNERSTONE_WORDS_SET: ${availabilityDetails.baliInCommon}`);
        console.log(`"avail" in CORNERSTONE_WORDS_SET: ${availabilityDetails.availInCommon}`);
        console.log(`"vail" in CORNERSTONE_WORDS_SET: ${availabilityDetails.vailInCommon}`);
        console.log(`"bail" in CORNERSTONE_WORDS_SET: ${availabilityDetails.bailInCommon}`);
        
        console.log('\n=== DEFINITION CHECK ===');
        console.log(`AVAILABILITY definition: "${availabilityDetails.availabilityDefinition}"`);
        
        // Assertions
        expect(availabilityDetails.puzzleName).toBe('AVAILABILITY');
        expect(availabilityDetails.grid).toBe('AVAILABILITY'); // 12 letters
        expect(availabilityDetails.cornerstoneCount).toBeGreaterThan(0);
        expect(availabilityDetails.totalWords).toBeGreaterThan(availabilityDetails.cornerstoneCount);
        expect(availabilityDetails.availabilityInCommon).toBe(true);
        
        // At least some cornerstone words should have proper definitions
        const wordsWithDefs = availabilityDetails.cornerstoneWords.filter(w => w.hasDefinition).length;
        expect(wordsWithDefs).toBeGreaterThan(0);
    });
});