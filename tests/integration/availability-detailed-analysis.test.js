// Detailed analysis of AVAILABILITY puzzle cornerstone words
const puppeteer = require('puppeteer');

describe('AVAILABILITY Detailed Analysis', () => {
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
    
    test('Detailed analysis of AVAILABILITY words', async () => {
        const analysis = await page.evaluate(async () => {
            // Switch to AVAILABILITY puzzle
            window.game.currentPuzzle = 'AVAILABILITY';
            window.game.foundWords.clear();
            window.game.generatePuzzle();
            
            // Get the grid letters
            const gridLetters = window.game.grid.filter(l => l).join('');
            const letterCounts = {};
            [...gridLetters].forEach(letter => {
                letterCounts[letter] = (letterCounts[letter] || 0) + 1;
            });
            
            // Find all possible words
            window.game.wordFinder.wordSet = window.COMPREHENSIVE_WORD_SET;
            const allWords = window.game.wordFinder.findAllWords(window.game.grid);
            
            // Analyze each word by length and cornerstone status
            const wordsByLength = {};
            const cornerstoneWords = [];
            const validWords = [];
            
            allWords.forEach(word => {
                const length = word.length;
                if (!wordsByLength[length]) wordsByLength[length] = [];
                
                const isCornerstone = window.CORNERSTONE_WORDS_SET.has(word.toLowerCase());
                const wordInfo = {
                    word: word,
                    length: length,
                    isCornerstone: isCornerstone
                };
                
                wordsByLength[length].push(wordInfo);
                
                if (isCornerstone) {
                    cornerstoneWords.push(wordInfo);
                } else {
                    validWords.push(wordInfo);
                }
            });
            
            // Sort within each length group
            Object.values(wordsByLength).forEach(lengthGroup => {
                lengthGroup.sort((a, b) => {
                    if (a.isCornerstone !== b.isCornerstone) {
                        return b.isCornerstone - a.isCornerstone; // cornerstone first
                    }
                    return a.word.localeCompare(b.word);
                });
            });
            
            // Check specific words that might seem like they should be cornerstone
            const potentialCornerstone = ['AVAIL', 'BAIL', 'TAIL', 'VITAL', 'VIAL', 'VILLA', 'LILY', 'LAVA', 'BABY', 'BALL'];
            const potentialAnalysis = potentialCornerstone.map(word => ({
                word: word,
                canBeFormed: allWords.has(word.toUpperCase()),
                inCommonWords: window.CORNERSTONE_WORDS_SET.has(word.toLowerCase())
            }));
            
            return {
                gridLetters: gridLetters,
                letterCounts: letterCounts,
                totalWords: allWords.size,
                cornerstoneCount: cornerstoneWords.length,
                validWordsCount: validWords.length,
                cornerstoneWords: cornerstoneWords.map(w => w.word),
                wordsByLength: wordsByLength,
                potentialAnalysis: potentialAnalysis,
                // Show some examples of words that could be formed but aren't cornerstone
                exampleValidWords: validWords.slice(0, 20).map(w => w.word)
            };
        });
        
        console.log('\n=== AVAILABILITY PUZZLE DETAILED ANALYSIS ===');
        console.log(`Grid letters: ${analysis.gridLetters}`);
        console.log(`Letter counts:`, analysis.letterCounts);
        console.log(`Total words possible: ${analysis.totalWords}`);
        console.log(`Cornerstone words: ${analysis.cornerstoneCount}`);
        console.log(`Other valid words: ${analysis.validWordsCount}`);
        
        console.log('\n=== CORNERSTONE WORDS FOUND ===');
        analysis.cornerstoneWords.forEach((word, i) => {
            console.log(`${i + 1}. ${word}`);
        });
        
        console.log('\n=== WORDS BY LENGTH ===');
        Object.entries(analysis.wordsByLength)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .forEach(([length, words]) => {
                console.log(`\n${length}-letter words (${words.length} total):`);
                words.forEach((wordInfo, i) => {
                    const status = wordInfo.isCornerstone ? '🏆 CORNERSTONE' : '   valid';
                    console.log(`  ${status}: ${wordInfo.word}`);
                });
            });
            
        console.log('\n=== POTENTIAL CORNERSTONE ANALYSIS ===');
        console.log('Checking words that might seem like they should be cornerstone:');
        analysis.potentialAnalysis.forEach(item => {
            const canForm = item.canBeFormed ? '✅' : '❌';
            const inCommon = item.inCommonWords ? '✅' : '❌';
            const status = item.canBeFormed && item.inCommonWords ? '🏆 SHOULD BE CORNERSTONE' : 
                          item.canBeFormed ? '   can form but not in common-words.js' :
                          '   cannot be formed from grid';
            console.log(`  ${item.word}: Can form ${canForm} | In common-words ${inCommon} - ${status}`);
        });
        
        console.log('\n=== EXAMPLE NON-CORNERSTONE WORDS ===');
        console.log('Some words that can be formed but are not in common-words.js:');
        analysis.exampleValidWords.forEach((word, i) => {
            console.log(`  ${i + 1}. ${word}`);
        });
        
        // Expectations
        expect(analysis.cornerstoneCount).toBe(3);
        expect(analysis.cornerstoneWords).toContain('AVAILABILITY');
        expect(analysis.cornerstoneWords).toContain('ABILITY');
        expect(analysis.cornerstoneWords).toContain('BALI');
    });
});