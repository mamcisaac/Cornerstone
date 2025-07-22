const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100
  });
  
  const page = await browser.newPage();
  
  console.log('Loading game...');
  await page.goto('https://mamcisaac.github.io/Cornerstone/', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  
  // Wait for game to fully load
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Getting grid letters...');
  const gridInfo = await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('.cell:not(.empty)'));
    const gridData = cells.map(cell => ({
      index: parseInt(cell.dataset.index),
      letter: cell.textContent,
      rect: cell.getBoundingClientRect()
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
   ${grid[13]} ${grid[14]}`
    };
  });
  
  console.log('Grid layout:', gridInfo.visual);
  
  // Try to select the word "STONE" - S at index 11, T at 10, O at 5/6, N at 8/2, E at 9/7
  console.log('\nAttempting to select the word STONE...');
  
  // Find the S at position 11
  const s_cell = gridInfo.cells.find(c => c.index === 11);
  const t_cell = gridInfo.cells.find(c => c.index === 10);
  const o_cell = gridInfo.cells.find(c => c.index === 6);
  const n_cell = gridInfo.cells.find(c => c.index === 2);
  const e_cell = gridInfo.cells.find(c => c.index === 7);
  
  if (s_cell && t_cell && o_cell && n_cell && e_cell) {
    console.log('Found all letters for STONE');
    
    // Start at S
    await page.mouse.move(
      s_cell.rect.x + s_cell.rect.width / 2,
      s_cell.rect.y + s_cell.rect.height / 2
    );
    await page.mouse.down();
    
    // Move to T
    await page.mouse.move(
      t_cell.rect.x + t_cell.rect.width / 2,
      t_cell.rect.y + t_cell.rect.height / 2,
      { steps: 10 }
    );
    await new Promise(r => setTimeout(r, 200));
    
    // Move to O
    await page.mouse.move(
      o_cell.rect.x + o_cell.rect.width / 2,
      o_cell.rect.y + o_cell.rect.height / 2,
      { steps: 10 }
    );
    await new Promise(r => setTimeout(r, 200));
    
    // Move to N
    await page.mouse.move(
      n_cell.rect.x + n_cell.rect.width / 2,
      n_cell.rect.y + n_cell.rect.height / 2,
      { steps: 10 }
    );
    await new Promise(r => setTimeout(r, 200));
    
    // Move to E
    await page.mouse.move(
      e_cell.rect.x + e_cell.rect.width / 2,
      e_cell.rect.y + e_cell.rect.height / 2,
      { steps: 10 }
    );
    await new Promise(r => setTimeout(r, 200));
    
    // Release to submit
    await page.mouse.up();
    
    // Wait for result
    await new Promise(r => setTimeout(r, 1000));
    
    // Check result
    const message = await page.$eval('#message', el => el.textContent);
    const wordsFound = await page.$eval('#wordsFound', el => el.textContent);
    const currentWord = await page.$eval('#currentWord', el => el.textContent);
    
    console.log('\nResult:');
    console.log('Message:', message);
    console.log('Words found:', wordsFound);
    console.log('Current word display:', currentWord);
    
    // Check if word was added to found list
    const foundWords = await page.$$eval('.found-word', words => 
      words.map(w => w.textContent)
    );
    console.log('Found words list:', foundWords);
  }
  
  // Try a simpler word - "NET" (N at 8, E at 9, T at 10)
  console.log('\n\nAttempting to select the word NET...');
  
  const n2_cell = gridInfo.cells.find(c => c.index === 8);
  const e2_cell = gridInfo.cells.find(c => c.index === 9);
  const t2_cell = gridInfo.cells.find(c => c.index === 10);
  
  if (n2_cell && e2_cell && t2_cell) {
    console.log('Found all letters for NET');
    
    // Start at N
    await page.mouse.move(
      n2_cell.rect.x + n2_cell.rect.width / 2,
      n2_cell.rect.y + n2_cell.rect.height / 2
    );
    await page.mouse.down();
    
    // Move to E
    await page.mouse.move(
      e2_cell.rect.x + e2_cell.rect.width / 2,
      e2_cell.rect.y + e2_cell.rect.height / 2,
      { steps: 10 }
    );
    await new Promise(r => setTimeout(r, 200));
    
    // Move to T
    await page.mouse.move(
      t2_cell.rect.x + t2_cell.rect.width / 2,
      t2_cell.rect.y + t2_cell.rect.height / 2,
      { steps: 10 }
    );
    await new Promise(r => setTimeout(r, 200));
    
    // Release to submit
    await page.mouse.up();
    
    // Wait for result
    await new Promise(r => setTimeout(r, 1000));
    
    // Check result
    const message = await page.$eval('#message', el => el.textContent);
    const wordsFound = await page.$eval('#wordsFound', el => el.textContent);
    
    console.log('\nResult:');
    console.log('Message:', message);
    console.log('Words found:', wordsFound);
  }
  
  // Keep browser open for 10 seconds to observe
  console.log('\nKeeping browser open for observation...');
  await new Promise(r => setTimeout(r, 10000));
  
  await browser.close();
})();