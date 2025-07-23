const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    devtools: true
  });

  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  await page.goto('https://mamcisaac.github.io/Cornerstone/', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  console.log('Page loaded. Waiting for game to initialize...');
  await new Promise(r => setTimeout(r, 5000));

  // Check if word validator is loaded
  const validatorStatus = await page.evaluate(() => {
    return {
      exists: typeof window.wordValidator !== 'undefined',
      loaded: window.wordValidator?.loaded || false,
      wordSetSize: window.wordValidator?.wordSet?.size || 0
    };
  });
  console.log('Word validator status:', validatorStatus);

  // Check game state
  const gameState = await page.evaluate(() => {
    return {
      foundWords: Array.from(game.foundWords || []),
      possibleWords: game.allPossibleWords?.size || 0,
      wordDefinitions: game.wordDefinitions?.size || 0,
      gridLetters: game.grid
    };
  });
  console.log('Game state:', gameState);

  // Get grid visual
  const gridInfo = await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('.cell:not(.empty)'));
    const gridData = cells.map(cell => ({
      index: parseInt(cell.dataset.index),
      letter: cell.textContent
    }));

    const grid = new Array(16).fill('·');
    gridData.forEach(cell => {
      grid[cell.index] = cell.letter;
    });

    return {
      cells: gridData,
      visual: `   ${grid[1]} ${grid[2]}
${grid[4]} ${grid[5]} ${grid[6]} ${grid[7]}
${grid[8]} ${grid[9]} ${grid[10]} ${grid[11]}
   ${grid[13]} ${grid[14]}`
    };
  });
  console.log('\nGrid layout:');
  console.log(gridInfo.visual);

  // Try to check a specific word
  console.log('\nTesting word validation directly...');
  const wordTests = await page.evaluate(() => {
    const tests = [];
    
    // Test if wordValidator works
    const testWords = ['CORN', 'STONE', 'CORE', 'TEST', 'ZZZZ'];
    for (const word of testWords) {
      const isValid = window.wordValidator?.isValidWord(word);
      tests.push({ word, isValid });
    }
    
    return tests;
  });
  console.log('Word validation tests:', wordTests);

  // Check if CORN is in allPossibleWords
  const cornCheck = await page.evaluate(() => {
    return {
      inPossibleWords: game.allPossibleWords?.has('CORN'),
      allPossibleArray: Array.from(game.allPossibleWords || []).slice(0, 20)
    };
  });
  console.log('\nCORN in possible words?', cornCheck.inPossibleWords);
  console.log('Sample possible words:', cornCheck.allPossibleArray);

  // Try to manually trigger word check
  console.log('\nManually checking word CORN...');
  const checkResult = await page.evaluate(() => {
    // Store original showMessage to capture result
    const originalShowMessage = game.showMessage;
    let capturedMessage = null;
    game.showMessage = (text, type) => {
      capturedMessage = { text, type };
      originalShowMessage.call(game, text, type);
    };
    
    game.checkWord('CORN');
    
    // Restore original
    game.showMessage = originalShowMessage;
    
    return {
      message: capturedMessage,
      foundWordsAfter: Array.from(game.foundWords || [])
    };
  });
  console.log('Check result:', checkResult);

  // Keep browser open for inspection
  console.log('\nBrowser will stay open for inspection. Press Ctrl+C to close.');
})();