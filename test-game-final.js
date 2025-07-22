const puppeteer = require('puppeteer');

async function testGame() {
    console.log('🚀 Starting Puppeteer test...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        slowMo: 300,
        devtools: true
    });
    
    const page = await browser.newPage();
    
    // Navigate to the live game
    console.log('📍 Navigating to game...');
    await page.goto('https://mamcisaac.github.io/Cornerstone', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
    });
    
    // Wait for game to load
    await page.waitForSelector('.cell', { timeout: 10000 });
    console.log('✅ Game loaded successfully');
    
    // Capture console logs from the game
    const consoleLogs = [];
    page.on('console', (msg) => {
        const text = msg.text();
        consoleLogs.push(text);
        console.log('🖥️  BROWSER:', text);
    });
    
    // Wait for game initialization
    await page.waitForTimeout(2000);
    
    // Get grid data
    const gridData = await page.evaluate(() => {
        const cells = {};
        document.querySelectorAll('.cell:not(.empty)').forEach(cell => {
            const index = parseInt(cell.dataset.index);
            cells[index] = {
                letter: cell.textContent.trim(),
                position: { 
                    x: cell.offsetLeft, 
                    y: cell.offsetTop 
                }
            };
        });
        return cells;
    });
    
    console.log('📋 Grid data:', gridData);
    
    // Test 1: Check if CORNERSTONES path exists
    console.log('\n🔍 Test 1: Checking CORNERSTONES path...');
    const cornerstonesPath = [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11];
    const cornerstonesLetters = cornerstonesPath.map(pos => gridData[pos]?.letter || '?').join('');
    console.log(`Expected: CORNERSTONES`);
    console.log(`Actual:   ${cornerstonesLetters}`);
    console.log(`Match: ${cornerstonesLetters === 'CORNERSTONES' ? '✅' : '❌'}`);
    
    // Test 2: Try to trace CORNERSTONES
    console.log('\n🔍 Test 2: Tracing CORNERSTONES...');
    try {
        await tracePath(page, cornerstonesPath, gridData);
        await page.waitForTimeout(1000);
        
        const result = await checkForWordFeedback(page);
        console.log(`CORNERSTONES result: ${result}`);
    } catch (error) {
        console.log('❌ Error tracing CORNERSTONES:', error.message);
    }
    
    // Test 3: Find and trace CORES
    console.log('\n🔍 Test 3: Testing CORES...');
    const coresPath = findWordPath(gridData, 'CORES');
    if (coresPath) {
        console.log(`CORES path found: [${coresPath.join(', ')}]`);
        try {
            await tracePath(page, coresPath, gridData);
            await page.waitForTimeout(1000);
            
            const result = await checkForWordFeedback(page);
            console.log(`CORES result: ${result}`);
        } catch (error) {
            console.log('❌ Error tracing CORES:', error.message);
        }
    } else {
        console.log('❌ Could not find valid path for CORES');
    }
    
    // Test 4: Find and trace STONE
    console.log('\n🔍 Test 4: Testing STONE...');
    const stonePath = findWordPath(gridData, 'STONE');
    if (stonePath) {
        console.log(`STONE path found: [${stonePath.join(', ')}]`);
        try {
            await tracePath(page, stonePath, gridData);
            await page.waitForTimeout(1000);
            
            const result = await checkForWordFeedback(page);
            console.log(`STONE result: ${result}`);
        } catch (error) {
            console.log('❌ Error tracing STONE:', error.message);
        }
    } else {
        console.log('❌ Could not find valid path for STONE');
    }
    
    // Get final game state
    const finalState = await page.evaluate(() => {
        const scoreElement = document.querySelector('.score-info, .stats');
        const foundWordsElements = document.querySelectorAll('.found-word');
        
        return {
            scoreText: scoreElement ? scoreElement.textContent : 'Score not found',
            foundWordCount: foundWordsElements.length,
            foundWords: Array.from(foundWordsElements).map(el => el.textContent.trim())
        };
    });
    
    console.log('\n📊 Final Results:');
    console.log(`Score/Stats: ${finalState.scoreText}`);
    console.log(`Words found: ${finalState.foundWordCount}`);
    console.log(`Found words: ${finalState.foundWords.join(', ')}`);
    
    // Show relevant console logs
    console.log('\n📝 Key console logs:');
    consoleLogs.forEach(log => {
        if (log.includes('PUZZLE DEBUG') || log.includes('Found') || log.includes('possible words')) {
            console.log('   ', log);
        }
    });
    
    await page.waitForTimeout(5000); // Keep browser open for visual inspection
    await browser.close();
}

async function tracePath(page, path, gridData) {
    if (path.length === 0) return;
    
    // Get the cell element for the first position
    const firstCell = await page.$(`[data-index="${path[0]}"]`);
    if (!firstCell) throw new Error(`Could not find cell at position ${path[0]}`);
    
    // Start dragging from first cell
    const firstBox = await firstCell.boundingBox();
    await page.mouse.move(firstBox.x + firstBox.width/2, firstBox.y + firstBox.height/2);
    await page.mouse.down();
    
    // Move through each subsequent cell
    for (let i = 1; i < path.length; i++) {
        const cell = await page.$(`[data-index="${path[i]}"]`);
        if (!cell) throw new Error(`Could not find cell at position ${path[i]}`);
        
        const box = await cell.boundingBox();
        await page.mouse.move(box.x + box.width/2, box.y + box.height/2, { steps: 3 });
        await page.waitForTimeout(100);
    }
    
    // Release mouse
    await page.mouse.up();
}

async function checkForWordFeedback(page) {
    try {
        // Wait for any feedback
        await page.waitForTimeout(500);
        
        // Check for various feedback elements
        const feedback = await page.evaluate(() => {
            // Look for different possible feedback elements
            const selectors = [
                '.message', '.feedback', '.word-feedback', '.toast',
                '.success', '.error', '.notification'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    return element.textContent.trim();
                }
            }
            
            // Check if word was added to found words list
            const foundWords = document.querySelectorAll('.found-word');
            const lastFound = foundWords[foundWords.length - 1];
            if (lastFound) {
                return `Added: ${lastFound.textContent.trim()}`;
            }
            
            return 'No feedback detected';
        });
        
        return feedback;
    } catch (error) {
        return 'Error checking feedback';
    }
}

function findWordPath(gridData, targetWord) {
    // Adjacency map for cross-shaped grid
    const adjacency = {
        1: [2, 5, 6],
        2: [1, 5, 6, 7],
        4: [5, 8, 9],
        5: [1, 2, 4, 6, 8, 9, 10],
        6: [1, 2, 5, 7, 9, 10, 11],
        7: [2, 6, 10, 11],
        8: [4, 5, 9, 13],
        9: [4, 5, 6, 8, 10, 13, 14],
        10: [5, 6, 7, 9, 11, 13, 14],
        11: [6, 7, 10, 14],
        13: [8, 9, 10, 14],
        14: [9, 10, 11, 13]
    };
    
    // DFS to find path
    function dfs(currentPath, remainingWord) {
        if (remainingWord.length === 0) {
            return currentPath;
        }
        
        const lastPos = currentPath[currentPath.length - 1];
        const nextLetter = remainingWord[0].toUpperCase();
        
        for (const neighbor of adjacency[lastPos] || []) {
            if (!currentPath.includes(neighbor) && gridData[neighbor]?.letter === nextLetter) {
                const result = dfs([...currentPath, neighbor], remainingWord.slice(1));
                if (result) return result;
            }
        }
        
        return null;
    }
    
    // Try starting from each position with the first letter
    const firstLetter = targetWord[0].toUpperCase();
    for (const [pos, data] of Object.entries(gridData)) {
        if (data.letter === firstLetter) {
            const path = dfs([parseInt(pos)], targetWord.slice(1));
            if (path) return path;
        }
    }
    
    return null;
}

testGame().catch(console.error);