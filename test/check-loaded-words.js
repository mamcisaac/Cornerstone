const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('PAGE LOG:', msg.text());
    }
  });
  
  console.log('Loading game and checking word list...');
  await page.goto('https://mamcisaac.github.io/Cornerstone/', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  
  // Wait for words to load
  await new Promise(r => setTimeout(r, 5000));
  
  // Check what words are actually loaded in the game
  const wordInfo = await page.evaluate(() => {
    // Access the game's word validator
    if (window.wordValidator && window.wordValidator.words) {
      const allWords = Array.from(window.wordValidator.words);
      const sampleWords = allWords.slice(0, 50); // First 50 words
      const hasCommonWords = {
        corn: window.wordValidator.isValidWord('CORN'),
        stone: window.wordValidator.isValidWord('STONE'),
        core: window.wordValidator.isValidWord('CORE'),
        nets: window.wordValidator.isValidWord('NETS'),
        nest: window.wordValidator.isValidWord('NEST'),
        test: window.wordValidator.isValidWord('TEST'),
        rest: window.wordValidator.isValidWord('REST'),
        tone: window.wordValidator.isValidWord('TONE')
      };
      
      return {
        totalWords: allWords.length,
        sampleWords: sampleWords,
        commonWordsValid: hasCommonWords,
        // Check if the words are the old malformed ones
        hasAAA: allWords.includes('aaa'),
        hasAAH: allWords.includes('aah')
      };
    }
    return null;
  });
  
  console.log('\n--- Word List Analysis ---');
  console.log('Total words loaded:', wordInfo.totalWords);
  console.log('\nFirst 50 words:', wordInfo.sampleWords.join(', '));
  console.log('\nCommon words validation:');
  Object.entries(wordInfo.commonWordsValid).forEach(([word, valid]) => {
    console.log(`  ${word.toUpperCase()}: ${valid ? '✓ Valid' : '✗ Invalid'}`);
  });
  console.log('\nContains malformed entries:');
  console.log(`  'aaa': ${wordInfo.hasAAA ? 'Yes' : 'No'}`);
  console.log(`  'aah': ${wordInfo.hasAAH ? 'Yes' : 'No'}`);
  
  await browser.close();
})();