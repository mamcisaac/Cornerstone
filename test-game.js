const puppeteer = require('puppeteer');

async function testGame() {
    const browser = await puppeteer.launch({ 
        headless: false, // Show browser for debugging
        slowMo: 500 // Slow down for visibility
    });
    
    const page = await browser.newPage();
    
    // Navigate to the live game
    await page.goto('https://mamcisaac.github.io/Cornerstone');
    
    // Wait for page to load
    await page.waitForSelector('.grid-container');
    
    console.log('Page loaded successfully');
    
    // Check console logs for debugging info
    page.on('console', (msg) => {
        console.log('BROWSER LOG:', msg.text());
    });
    
    // Wait a bit for any initialization
    await page.waitForTimeout(2000);
    
    // Get the current puzzle info
    const puzzleInfo = await page.evaluate(() => {
        const totalElement = document.querySelector('.score-info');
        return totalElement ? totalElement.textContent : 'Score info not found';
    });
    
    console.log('Puzzle info:', puzzleInfo);
    
    // Get all the letters in the grid
    const gridLetters = await page.evaluate(() => {
        const cells = document.querySelectorAll('.grid-cell:not(.empty)');
        const letters = {};
        cells.forEach((cell, index) => {
            const position = parseInt(cell.dataset.position);
            letters[position] = cell.textContent.trim();
        });
        return letters;
    });
    
    console.log('Grid letters:', gridLetters);
    
    // Test 1: Try to trace CORNERSTONES
    console.log('\n=== Testing CORNERSTONES ===');
    try {
        // Path for CORNERSTONES: [1, 2, 6, 4, 5, 9, 8, 7, 13, 10, 11, 14]
        const cornerstonesPath = [1, 2, 6, 4, 5, 9, 8, 7, 13, 10, 11, 14];
        const cornerstonesWord = cornerstonesPath.map(pos => gridLetters[pos]).join('');
        console.log('CORNERSTONES path spells:', cornerstonesWord);
        
        await tracePath(page, cornerstonesPath);
        await page.waitForTimeout(1000);
        
        const result1 = await checkWordResult(page);
        console.log('CORNERSTONES result:', result1);
    } catch (error) {
        console.log('Error testing CORNERSTONES:', error.message);
    }
    
    // Test 2: Try CORES
    console.log('\n=== Testing CORES ===');
    try {
        // Find a path that spells CORES
        const coresPath = findWordPath(gridLetters, 'CORES');
        if (coresPath) {
            console.log('CORES path found:', coresPath);
            await tracePath(page, coresPath);
            await page.waitForTimeout(1000);
            
            const result2 = await checkWordResult(page);
            console.log('CORES result:', result2);
        } else {
            console.log('Could not find path for CORES');
        }
    } catch (error) {
        console.log('Error testing CORES:', error.message);
    }
    
    // Test 3: Try STONE
    console.log('\n=== Testing STONE ===');
    try {
        const stonePath = findWordPath(gridLetters, 'STONE');
        if (stonePath) {
            console.log('STONE path found:', stonePath);
            await tracePath(page, stonePath);
            await page.waitForTimeout(1000);
            
            const result3 = await checkWordResult(page);
            console.log('STONE result:', result3);
        } else {
            console.log('Could not find path for STONE');
        }
    } catch (error) {
        console.log('Error testing STONE:', error.message);
    }
    
    // Get final score and word count
    const finalInfo = await page.evaluate(() => {
        const scoreElement = document.querySelector('.score-info');
        const foundWords = document.querySelectorAll('.found-word');
        return {
            scoreText: scoreElement ? scoreElement.textContent : 'Not found',
            foundWordCount: foundWords.length,
            foundWords: Array.from(foundWords).map(el => el.textContent.trim())
        };
    });
    
    console.log('\n=== Final Results ===');
    console.log('Score info:', finalInfo.scoreText);
    console.log('Words found:', finalInfo.foundWordCount);
    console.log('Found words:', finalInfo.foundWords);
    
    await browser.close();
}

async function tracePath(page, path) {
    // Start from first cell
    const firstCell = `[data-position="${path[0]}"]`;
    await page.hover(firstCell);
    await page.mouse.down();
    
    // Move through each subsequent cell
    for (let i = 1; i < path.length; i++) {
        const cell = `[data-position="${path[i]}"]`;
        await page.hover(cell);
        await page.waitForTimeout(100);
    }
    
    // Release mouse
    await page.mouse.up();
}

async function checkWordResult(page) {
    try {
        // Wait for any feedback message
        await page.waitForTimeout(500);
        
        // Check for success/error messages
        const feedback = await page.evaluate(() => {
            const messageElement = document.querySelector('.message, .feedback, .word-feedback');
            return messageElement ? messageElement.textContent : 'No feedback message';
        });
        
        return feedback;
    } catch (error) {
        return 'No result detected';
    }
}

function findWordPath(gridLetters, targetWord) {
    // Simple adjacency map for cross-shaped grid
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
    
    // DFS to find path that spells the target word
    function dfs(currentPath, remainingWord) {
        if (remainingWord.length === 0) {
            return currentPath;
        }
        
        const lastPos = currentPath[currentPath.length - 1];
        const nextLetter = remainingWord[0];
        
        for (const neighbor of adjacency[lastPos] || []) {
            if (!currentPath.includes(neighbor) && gridLetters[neighbor] === nextLetter) {
                const result = dfs([...currentPath, neighbor], remainingWord.slice(1));
                if (result) return result;
            }
        }
        
        return null;
    }
    
    // Try starting from each position that has the first letter
    const firstLetter = targetWord[0];
    for (const [pos, letter] of Object.entries(gridLetters)) {
        if (letter === firstLetter) {
            const path = dfs([parseInt(pos)], targetWord.slice(1));
            if (path) return path;
        }
    }
    
    return null;
}

testGame().catch(console.error);