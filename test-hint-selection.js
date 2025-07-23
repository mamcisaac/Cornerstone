const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    try {
        // Navigate to the game
        const filePath = 'file://' + path.resolve('index.html');
        console.log('Loading:', filePath);
        await page.goto(filePath, { waitUntil: 'networkidle0' });
        
        // Wait for game to load
        await page.waitForSelector('#gameGrid', { timeout: 10000 });
        console.log('✓ Game loaded successfully');
        
        // Check if cornerstone words are displayed
        const cornerstoneWords = await page.$$('.cornerstone-word');
        console.log(`✓ Found ${cornerstoneWords.length} cornerstone words`);
        
        // Check available hints
        const hintsText = await page.$eval('#hintCount', el => el.textContent);
        console.log(`✓ Available hints: ${hintsText}`);
        
        // If no hints, we need to find a non-cornerstone word first
        if (hintsText === '0 Available') {
            console.log('\nFinding a non-cornerstone word to earn hints...');
            
            // Simulate finding a word by calling checkWord directly
            const wordFound = await page.evaluate(() => {
                // Find a valid non-cornerstone word
                const nonCornerstoneWords = game.validWords.filter(word => 
                    !game.cornerstoneWords.some(cw => cw.word === word)
                );
                
                if (nonCornerstoneWords.length > 0) {
                    const word = nonCornerstoneWords[0];
                    // Call checkWord to properly process the word
                    game.checkWord(word);
                    return word;
                }
                return null;
            });
            
            if (wordFound) {
                console.log(`✓ Found word: ${wordFound}`);
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const newHints = await page.$eval('#hintCount', el => el.textContent);
                console.log(`✓ Hints after finding word: ${newHints}`);
                
                // Force update of cornerstone display to make words clickable
                await page.evaluate(() => {
                    game.updateCornerstoneDisplay();
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        // Find an unrevealed cornerstone word
        const unrevealedWord = await page.evaluateHandle(() => {
            const words = document.querySelectorAll('.cornerstone-word');
            console.log('Looking for clickable words among', words.length, 'cornerstone words');
            for (const word of words) {
                const isClickable = word.classList.contains('clickable-hint');
                const hasDefinition = word.querySelector('.word-definition') !== null;
                const isFound = word.classList.contains('found');
                console.log('Word:', word.textContent.trim(), 'clickable:', isClickable, 'hasDefinition:', hasDefinition, 'found:', isFound);
                
                if (isClickable && !isFound) {
                    return word;
                }
            }
            return null;
        });
        
        if (unrevealedWord && await unrevealedWord.evaluate(el => el !== null)) {
            console.log('✓ Found clickable unrevealed word');
            
            // Click on the word to show hint menu
            await unrevealedWord.click();
            console.log('✓ Clicked on cornerstone word');
            
            // Wait for hint menu to appear
            await page.waitForSelector('#hintOptionsMenu.show', { timeout: 2000 });
            console.log('✓ Hint options menu appeared');
            
            // Check if both buttons are present
            const letterButton = await page.$('#hintRevealLetterOption');
            const definitionButton = await page.$('#hintRevealDefinitionOption');
            
            if (letterButton) console.log('✓ "Reveal a Letter" button found');
            if (definitionButton) console.log('✓ "Show Definition" button found');
            
            // Test clicking "Show Definition"
            console.log('\nTesting "Show Definition" option...');
            await definitionButton.click();
            console.log('✓ Clicked "Show Definition"');
            
            // Wait a moment for the action to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if definition was revealed
            const definitionRevealed = await page.evaluate(() => {
                const messages = Array.from(document.querySelectorAll('.message'));
                return messages.some(msg => msg.textContent.includes('Definition revealed'));
            });
            
            if (definitionRevealed) {
                console.log('✓ Definition revealed successfully!');
            } else {
                console.log('✗ Definition may not have been revealed - check console logs');
            }
            
            // Check updated hints count
            const newHintsText = await page.$eval('#hintCount', el => el.textContent);
            console.log(`✓ Updated hints: ${newHintsText}`);
            
            // Now test "Reveal a Letter" on another word
            console.log('\nTesting "Reveal a Letter" option...');
            
            // Find another unrevealed word
            const anotherWord = await page.evaluateHandle(() => {
                const words = document.querySelectorAll('.cornerstone-word');
                for (const word of words) {
                    if (word.classList.contains('clickable-hint') && 
                        !word.querySelector('.found') && 
                        !Array.from(word.querySelectorAll('.letter')).some(l => l.classList.contains('revealed'))) {
                        return word;
                    }
                }
                return null;
            });
            
            if (anotherWord && await anotherWord.evaluate(el => el !== null)) {
                await anotherWord.click();
                await page.waitForSelector('#hintOptionsMenu.show', { timeout: 2000 });
                console.log('✓ Opened hint menu for another word');
                
                const letterButton2 = await page.$('#hintRevealLetterOption');
                await letterButton2.click();
                console.log('✓ Clicked "Reveal a Letter"');
                
                // Wait for letter selection mode
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check if we're in letter selection mode
                const inLetterMode = await page.evaluate(() => {
                    const messages = Array.from(document.querySelectorAll('.message'));
                    return messages.some(msg => msg.textContent.includes('Click on a letter position'));
                });
                
                if (inLetterMode) {
                    console.log('✓ Entered letter selection mode successfully!');
                    
                    // Try clicking on a letter position
                    const clickableLetter = await page.$('.clickable-letter');
                    if (clickableLetter) {
                        await clickableLetter.click();
                        console.log('✓ Clicked on a letter position');
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        const letterRevealed = await page.evaluate(() => {
                            return document.querySelector('.letter.revealed') !== null;
                        });
                        
                        if (letterRevealed) {
                            console.log('✓ Letter revealed successfully!');
                        }
                    }
                }
            }
            
        } else {
            console.log('✗ No clickable unrevealed words found');
        }
        
        console.log('\nTest completed! Check the browser window.');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
})();