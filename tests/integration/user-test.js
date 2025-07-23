const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 150,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  console.log('Loading Cornerstones game...');
  await page.goto('https://mamcisaac.github.io/Cornerstone/', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  
  // Wait for game to fully load
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('\nChecking game state...');
  const gameInfo = await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('.cell:not(.empty)'));
    const gridData = cells.map(cell => ({
      index: parseInt(cell.dataset.index),
      letter: cell.textContent,
      x: cell.offsetLeft + cell.offsetWidth / 2,
      y: cell.offsetTop + cell.offsetHeight / 2
    }));
    
    // Create visual grid
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
      wordsFound: document.querySelector('#wordsFound').textContent,
      currentWord: document.querySelector('#currentWord').textContent
    };
  });
  
  console.log('Grid layout:', gameInfo.visual);
  console.log(`\nGame status: ${gameInfo.wordsFound}/${gameInfo.totalWords} words found`);
  console.log('Current word display:', gameInfo.currentWord);
  
  // Test 1: Try to select "NETS" (N-E-T-S horizontally)
  console.log('\n--- Test 1: Selecting "NETS" (horizontal word) ---');
  
  const n_cell = gameInfo.cells.find(c => c.index === 8);
  const e_cell = gameInfo.cells.find(c => c.index === 9);
  const t_cell = gameInfo.cells.find(c => c.index === 10);
  const s_cell = gameInfo.cells.find(c => c.index === 11);
  
  if (n_cell && e_cell && t_cell && s_cell) {
    console.log('Found path: N(8) -> E(9) -> T(10) -> S(11)');
    
    // Click and drag from N to S
    await page.mouse.move(n_cell.x, n_cell.y);
    await page.mouse.down();
    await new Promise(r => setTimeout(r, 100));
    
    await page.mouse.move(e_cell.x, e_cell.y, { steps: 5 });
    await new Promise(r => setTimeout(r, 100));
    
    await page.mouse.move(t_cell.x, t_cell.y, { steps: 5 });
    await new Promise(r => setTimeout(r, 100));
    
    await page.mouse.move(s_cell.x, s_cell.y, { steps: 5 });
    await new Promise(r => setTimeout(r, 100));
    
    // Check current word while dragging
    const wordDuringDrag = await page.$eval('#currentWord', el => el.textContent);
    console.log('Word shown during drag:', wordDuringDrag);
    
    await page.mouse.up();
    await new Promise(r => setTimeout(r, 1000));
    
    // Check result
    const result1 = await page.evaluate(() => ({
      message: document.querySelector('#message').textContent,
      wordsFound: document.querySelector('#wordsFound').textContent,
      foundWordsList: Array.from(document.querySelectorAll('.found-word')).map(w => w.textContent)
    }));
    
    console.log('Result:', result1.message);
    console.log('Words found count:', result1.wordsFound);
    console.log('Found words:', result1.foundWordsList);
  }
  
  // Test 2: Try to select "CORE" (C-O-R-E)
  console.log('\n--- Test 2: Selecting "CORE" ---');
  
  const c_cell = gameInfo.cells.find(c => c.index === 1);
  const o_cell = gameInfo.cells.find(c => c.index === 5);
  const r_cell = gameInfo.cells.find(c => c.index === 4);
  const e2_cell = gameInfo.cells.find(c => c.index === 9);
  
  if (c_cell && o_cell && r_cell && e2_cell) {
    console.log('Found path: C(1) -> O(5) -> R(4) -> E(9)');
    
    await page.mouse.move(c_cell.x, c_cell.y);
    await page.mouse.down();
    await new Promise(r => setTimeout(r, 100));
    
    await page.mouse.move(o_cell.x, o_cell.y, { steps: 5 });
    await new Promise(r => setTimeout(r, 100));
    
    await page.mouse.move(r_cell.x, r_cell.y, { steps: 5 });
    await new Promise(r => setTimeout(r, 100));
    
    await page.mouse.move(e2_cell.x, e2_cell.y, { steps: 5 });
    await new Promise(r => setTimeout(r, 100));
    
    const wordDuringDrag = await page.$eval('#currentWord', el => el.textContent);
    console.log('Word shown during drag:', wordDuringDrag);
    
    await page.mouse.up();
    await new Promise(r => setTimeout(r, 1000));
    
    const result2 = await page.evaluate(() => ({
      message: document.querySelector('#message').textContent,
      wordsFound: document.querySelector('#wordsFound').textContent,
      foundWordsList: Array.from(document.querySelectorAll('.found-word')).map(w => w.textContent)
    }));
    
    console.log('Result:', result2.message);
    console.log('Words found count:', result2.wordsFound);
    console.log('Found words:', result2.foundWordsList);
  }
  
  // Test 3: Try an invalid word "XYZ" by selecting random cells
  console.log('\n--- Test 3: Testing invalid word ---');
  
  await page.mouse.move(gameInfo.cells[0].x, gameInfo.cells[0].y);
  await page.mouse.down();
  await page.mouse.move(gameInfo.cells[3].x, gameInfo.cells[3].y, { steps: 5 });
  await page.mouse.move(gameInfo.cells[5].x, gameInfo.cells[5].y, { steps: 5 });
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 1000));
  
  const invalidResult = await page.$eval('#message', el => el.textContent);
  console.log('Message for invalid word:', invalidResult);
  
  // Final check
  console.log('\n--- Final Game State ---');
  const finalState = await page.evaluate(() => ({
    wordsFound: document.querySelector('#wordsFound').textContent,
    totalWords: document.querySelector('#totalWords').textContent,
    foundWords: Array.from(document.querySelectorAll('.found-word')).map(w => w.textContent)
  }));
  
  console.log(`Words found: ${finalState.wordsFound}/${finalState.totalWords}`);
  console.log('List of found words:', finalState.foundWords);
  
  console.log('\nTest complete. Browser will close in 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
})();