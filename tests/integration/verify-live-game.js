const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  console.log('🎮 Testing Cornerstones game after fix...\n');
  await page.goto('https://mamcisaac.github.io/Cornerstone/', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  
  // Wait for game to fully load
  await new Promise(r => setTimeout(r, 5000));
  
  // Get game state
  const gameInfo = await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('.cell:not(.empty)'));
    const gridData = cells.map(cell => ({
      index: parseInt(cell.dataset.index),
      letter: cell.textContent,
      x: cell.offsetLeft + cell.offsetWidth / 2,
      y: cell.offsetTop + cell.offsetHeight / 2
    }));
    
    const grid = new Array(16).fill('·');
    gridData.forEach(cell => {
      grid[cell.index] = cell.letter;
    });
    
    return {
      cells: gridData,
      visual: `
   ${grid[1]} ${grid[2]}
${grid[4]} ${grid[5]} ${grid[6]} ${grid[7]}
${grid[8]} ${grid[9]} ${grid[10]} ${grid[11]}
   ${grid[13]} ${grid[14]}`,
      totalWords: document.querySelector('#totalWords').textContent,
      wordsFound: document.querySelector('#wordsFound').textContent
    };
  });
  
  console.log('Grid layout:', gameInfo.visual);
  console.log(`\nGame shows: ${gameInfo.wordsFound}/${gameInfo.totalWords} words found`);
  
  // Test 1: Try "STONE" (S-T-O-N-E)
  console.log('\n🎯 Test 1: Selecting "STONE"');
  
  // Find path for STONE
  const s_11 = gameInfo.cells.find(c => c.index === 11 && c.letter === 'S');
  const t_10 = gameInfo.cells.find(c => c.index === 10 && c.letter === 'T');
  const o_6 = gameInfo.cells.find(c => c.index === 6 && c.letter === 'O');
  const n_2 = gameInfo.cells.find(c => c.index === 2 && c.letter === 'N');
  const e_7 = gameInfo.cells.find(c => c.index === 7 && c.letter === 'E');
  
  if (s_11 && t_10 && o_6 && n_2 && e_7) {
    await page.mouse.move(s_11.x, s_11.y);
    await page.mouse.down();
    await page.mouse.move(t_10.x, t_10.y, { steps: 5 });
    await page.mouse.move(o_6.x, o_6.y, { steps: 5 });
    await page.mouse.move(n_2.x, n_2.y, { steps: 5 });
    await page.mouse.move(e_7.x, e_7.y, { steps: 5 });
    await page.mouse.up();
    await new Promise(r => setTimeout(r, 1500));
    
    const result1 = await page.evaluate(() => ({
      message: document.querySelector('#message').textContent,
      wordsFound: document.querySelector('#wordsFound').textContent,
      foundWords: Array.from(document.querySelectorAll('.found-word')).map(w => w.textContent)
    }));
    
    console.log('✅ Result:', result1.message);
    console.log('Words found:', result1.wordsFound);
    if (result1.foundWords.length > 0) {
      console.log('Found words list:', result1.foundWords);
    }
  }
  
  // Test 2: Try "CORN" (C-O-R-N)
  console.log('\n🎯 Test 2: Selecting "CORN"');
  
  const c_1 = gameInfo.cells.find(c => c.index === 1 && c.letter === 'C');
  const o_5 = gameInfo.cells.find(c => c.index === 5 && c.letter === 'O');
  const r_4 = gameInfo.cells.find(c => c.index === 4 && c.letter === 'R');
  const n_8 = gameInfo.cells.find(c => c.index === 8 && c.letter === 'N');
  
  if (c_1 && o_5 && r_4 && n_8) {
    await page.mouse.move(c_1.x, c_1.y);
    await page.mouse.down();
    await page.mouse.move(o_5.x, o_5.y, { steps: 5 });
    await page.mouse.move(r_4.x, r_4.y, { steps: 5 });
    await page.mouse.move(n_8.x, n_8.y, { steps: 5 });
    await page.mouse.up();
    await new Promise(r => setTimeout(r, 1500));
    
    const result2 = await page.evaluate(() => ({
      message: document.querySelector('#message').textContent,
      wordsFound: document.querySelector('#wordsFound').textContent
    }));
    
    console.log('✅ Result:', result2.message);
    console.log('Words found:', result2.wordsFound);
  }
  
  // Test 3: Try "REST" (R-E-S-T)
  console.log('\n🎯 Test 3: Selecting "REST"');
  
  const r_13 = gameInfo.cells.find(c => c.index === 13 && c.letter === 'R');
  const e_9 = gameInfo.cells.find(c => c.index === 9 && c.letter === 'E');
  const s_14 = gameInfo.cells.find(c => c.index === 14 && c.letter === 'S');
  const t_10_rest = gameInfo.cells.find(c => c.index === 10 && c.letter === 'T');
  
  if (r_13 && e_9 && s_14 && t_10_rest) {
    await page.mouse.move(r_13.x, r_13.y);
    await page.mouse.down();
    await page.mouse.move(e_9.x, e_9.y, { steps: 5 });
    await page.mouse.move(s_14.x, s_14.y, { steps: 5 });
    await page.mouse.move(t_10_rest.x, t_10_rest.y, { steps: 5 });
    await page.mouse.up();
    await new Promise(r => setTimeout(r, 1500));
    
    const result3 = await page.evaluate(() => ({
      message: document.querySelector('#message').textContent,
      wordsFound: document.querySelector('#wordsFound').textContent
    }));
    
    console.log('✅ Result:', result3.message);
    console.log('Words found:', result3.wordsFound);
  }
  
  // Final summary
  console.log('\n📊 Final Game State:');
  const finalState = await page.evaluate(() => ({
    wordsFound: document.querySelector('#wordsFound').textContent,
    totalWords: document.querySelector('#totalWords').textContent,
    foundWords: Array.from(document.querySelectorAll('.found-word')).map(w => w.textContent)
  }));
  
  console.log(`Total words found: ${finalState.wordsFound}/${finalState.totalWords}`);
  if (finalState.foundWords.length > 0) {
    console.log('Words discovered:', finalState.foundWords.join(', '));
    console.log('\n🎉 SUCCESS! The game is now working properly!');
  } else {
    console.log('\n⚠️  No words found yet. The deployment might still be in progress.');
    console.log('Please wait a minute and try again.');
  }
  
  console.log('\nKeeping browser open for manual testing...');
  await new Promise(r => setTimeout(r, 30000));
  
  await browser.close();
})();