// Comprehensive test to identify and fix all game issues
const puppeteer = require('puppeteer');

async function testGame() {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 50,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    // Enable console logging
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
            console.error('Browser Error:', text);
        } else if (type === 'warning') {
            console.warn('Browser Warning:', text);
        } else if (text.includes('Found') || text.includes('COMMON_WORDS_SET') || text.includes('cornerstone')) {
            console.log('Browser Log:', text);
        }
    });
    
    // Enable error logging
    page.on('error', err => {
        console.error('Page Error:', err);
    });
    
    page.on('pageerror', err => {
        console.error('Page Error:', err);
    });
    
    try {
        console.log('🚀 Starting comprehensive game test...\n');
        
        // Navigate to game
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
        
        // Wait for game to fully initialize
        await page.waitForSelector('.game-grid', { timeout: 10000 });
        
        // Wait for game object to be ready
        await page.waitForFunction(
            () => window.game && window.game.gameStarted && window.COMMON_WORDS_SET,
            { timeout: 15000 }
        );
        
        console.log('✅ Game loaded successfully\n');
        
        // Test 1: Check if COMMON_WORDS_SET is loaded
        const commonWordsInfo = await page.evaluate(() => {
            return {
                loaded: !!window.COMMON_WORDS_SET,
                size: window.COMMON_WORDS_SET ? window.COMMON_WORDS_SET.size : 0,
                sampleWords: window.COMMON_WORDS_SET ? Array.from(window.COMMON_WORDS_SET).slice(0, 10) : []
            };
        });
        
        console.log('📚 Common Words Set Status:');
        console.log(`  - Loaded: ${commonWordsInfo.loaded}`);
        console.log(`  - Size: ${commonWordsInfo.size}`);
        console.log(`  - Sample words: ${commonWordsInfo.sampleWords.join(', ')}`);
        console.log('');
        
        // Test 2: Check game state
        const gameState = await page.evaluate(() => {
            const game = window.game;
            return {
                currentPuzzle: game.currentPuzzle,
                totalWordsFound: game.allPossibleWords ? game.allPossibleWords.size : 0,
                cornerstoneWordsCount: game.cornerstoneWords ? game.cornerstoneWords.length : 0,
                validWordsCount: game.validWords ? game.validWords.length : 0,
                grid: game.grid.filter(cell => cell !== '').join(''),
                sampleCornerstoneWords: game.cornerstoneWords ? game.cornerstoneWords.slice(0, 5).map(w => w.word) : [],
                foundWords: Array.from(game.foundWords || [])
            };
        });
        
        console.log('🎮 Game State:');
        console.log(`  - Current puzzle: ${gameState.currentPuzzle}`);
        console.log(`  - Grid letters: ${gameState.grid}`);
        console.log(`  - Total possible words: ${gameState.totalWordsFound}`);
        console.log(`  - Cornerstone words: ${gameState.cornerstoneWordsCount}`);
        console.log(`  - Other valid words: ${gameState.validWordsCount}`);
        console.log(`  - Sample cornerstone words: ${gameState.sampleCornerstoneWords.join(', ')}`);
        console.log('');
        
        // Test 3: Check UI elements
        const uiState = await page.evaluate(() => {
            return {
                wordsFoundDisplay: document.getElementById('words-found-count')?.textContent,
                cornerstoneDisplay: document.getElementById('cornerstone-count')?.textContent,
                totalWordsDisplay: document.getElementById('total-words-count')?.textContent,
                hintsDisplay: document.getElementById('hints-remaining')?.textContent,
                cornerstoneProgressText: document.getElementById('cornerstone-progress')?.textContent,
                cornerstoneListChildren: document.getElementById('cornerstone-words')?.children.length
            };
        });
        
        console.log('🖥️  UI State:');
        console.log(`  - Words found display: ${uiState.wordsFoundDisplay}`);
        console.log(`  - Cornerstone display: ${uiState.cornerstoneDisplay}`);
        console.log(`  - Total words display: ${uiState.totalWordsDisplay}`);
        console.log(`  - Hints remaining: ${uiState.hintsDisplay}`);
        console.log(`  - Cornerstone progress: ${uiState.cornerstoneProgressText}`);
        console.log(`  - Cornerstone list items: ${uiState.cornerstoneListChildren}`);
        console.log('');
        
        // Test 4: Check definitions
        const definitionsState = await page.evaluate(() => {
            const game = window.game;
            let withDefinitions = 0;
            let withoutDefinitions = 0;
            let loadingDefinitions = 0;
            
            if (game.cornerstoneWords) {
                game.cornerstoneWords.forEach(word => {
                    if (word.definition === "Loading definition...") {
                        loadingDefinitions++;
                    } else if (word.definition && word.definition !== "A common English word") {
                        withDefinitions++;
                    } else {
                        withoutDefinitions++;
                    }
                });
            }
            
            return {
                total: game.cornerstoneWords ? game.cornerstoneWords.length : 0,
                withDefinitions,
                withoutDefinitions,
                loadingDefinitions,
                getDefinitionExists: !!window.getDefinition,
                getDefinitionSyncExists: !!window.getDefinitionSync
            };
        });
        
        console.log('📖 Definitions State:');
        console.log(`  - Total cornerstone words: ${definitionsState.total}`);
        console.log(`  - With proper definitions: ${definitionsState.withDefinitions}`);
        console.log(`  - Without definitions: ${definitionsState.withoutDefinitions}`);
        console.log(`  - Still loading: ${definitionsState.loadingDefinitions}`);
        console.log(`  - getDefinition exists: ${definitionsState.getDefinitionExists}`);
        console.log(`  - getDefinitionSync exists: ${definitionsState.getDefinitionSyncExists}`);
        console.log('');
        
        // Test 5: Try finding a word
        console.log('🔍 Testing word finding...');
        
        // Find a simple 4-letter word by looking at the grid
        const testWord = await page.evaluate(() => {
            const game = window.game;
            // Try to find "CORN" if it exists
            const testWords = ['CORN', 'STONE', 'CORE', 'TONE', 'NEST'];
            
            for (let word of testWords) {
                const path = game.wordFinder.findWordPath(game.grid, word);
                if (path) {
                    return { word, path, found: true };
                }
            }
            
            // If none of the test words exist, find any 4-letter word
            const allWords = Array.from(game.allPossibleWords || []);
            const fourLetterWords = allWords.filter(w => w.length === 4);
            if (fourLetterWords.length > 0) {
                const word = fourLetterWords[0];
                const path = game.wordFinder.findWordPath(game.grid, word);
                return { word, path, found: true };
            }
            
            return { found: false };
        });
        
        if (testWord.found) {
            console.log(`  - Found word "${testWord.word}" with path: [${testWord.path.join(', ')}]`);
            
            // Try to select this word
            const cells = await page.$$('.cell:not(.empty)');
            for (let i = 0; i < testWord.path.length; i++) {
                const cellIndex = testWord.path[i];
                const cell = await page.$(`.cell[data-index="${cellIndex}"]`);
                if (cell) {
                    if (i === 0) {
                        await cell.click();
                    }
                    await page.mouse.move(
                        (await cell.boundingBox()).x + 30,
                        (await cell.boundingBox()).y + 30
                    );
                }
            }
            
            // Release mouse to submit word
            await page.mouse.up();
            await page.waitForTimeout(1000);
            
            // Check if word was accepted
            const foundWordsAfter = await page.evaluate(() => window.game.foundWords.size);
            console.log(`  - Words found after attempt: ${foundWordsAfter}`);
        } else {
            console.log('  - Could not find any valid words to test');
        }
        console.log('');
        
        // Test 6: Check all puzzles
        console.log('🧩 Checking all puzzles for cornerstone words...');
        const allPuzzles = await page.evaluate(async () => {
            const puzzleNames = Object.keys(window.SAMPLE_PUZZLES);
            const results = [];
            
            for (let puzzleName of puzzleNames) {
                window.game.currentPuzzle = puzzleName;
                window.game.foundWords.clear();
                window.game.generatePuzzle();
                await window.game.findAllPossibleWords();
                
                results.push({
                    name: puzzleName,
                    totalWords: window.game.allPossibleWords.size,
                    cornerstoneWords: window.game.cornerstoneWords.length,
                    validWords: window.game.validWords.length
                });
            }
            
            return results;
        });
        
        allPuzzles.forEach(puzzle => {
            const status = puzzle.cornerstoneWords === 0 ? '❌' : '✅';
            console.log(`  ${status} ${puzzle.name}: ${puzzle.cornerstoneWords} cornerstone, ${puzzle.validWords} other (${puzzle.totalWords} total)`);
        });
        
        console.log('\n✨ Test complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
testGame().catch(console.error);