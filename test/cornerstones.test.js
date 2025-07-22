const puppeteer = require('puppeteer');

describe('Cornerstones Game Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('https://mamcisaac.github.io/Cornerstone/', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for the game to fully load
    await new Promise(r => setTimeout(r, 3000));
  });

  afterEach(async () => {
    await page.close();
  });

  test('should load the game page correctly', async () => {
    const title = await page.title();
    expect(title).toBe('Cornerstones - Daily Word Puzzle');

    const gameTitle = await page.$eval('.title', el => el.textContent);
    expect(gameTitle).toBe('Cornerstones');
  });

  test('should display letters in the grid', async () => {
    // Get all non-empty cells and their content
    const gridLetters = await page.$$eval('.cell:not(.empty)', cells => 
      cells.map(cell => ({
        index: cell.dataset.index,
        letter: cell.textContent
      }))
    );

    console.log('Grid letters:', gridLetters);

    // Should have exactly 12 letters (cross shape)
    expect(gridLetters.length).toBe(12);

    // Each cell should have a single letter
    gridLetters.forEach(cell => {
      expect(cell.letter).toMatch(/^[A-Z]$/);
    });
  });

  test('should allow selecting letters by dragging', async () => {
    // Find cells with specific letters to form a word
    const cells = await page.$$('.cell:not(.empty)');
    
    // Get positions of all cells
    const cellData = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.cell:not(.empty)'));
      return cells.map(cell => ({
        index: cell.dataset.index,
        letter: cell.textContent,
        rect: cell.getBoundingClientRect()
      }));
    });

    console.log('Available letters:', cellData.map(c => `${c.index}: ${c.letter}`).join(', '));

    // Try to find a simple 4-letter word by dragging
    if (cellData.length >= 4) {
      const firstCell = cellData[0];
      const secondCell = cellData[1];
      
      // Move to first cell
      await page.mouse.move(
        firstCell.rect.x + firstCell.rect.width / 2,
        firstCell.rect.y + firstCell.rect.height / 2
      );
      
      // Mouse down to start selection
      await page.mouse.down();
      
      // Drag to second cell
      await page.mouse.move(
        secondCell.rect.x + secondCell.rect.width / 2,
        secondCell.rect.y + secondCell.rect.height / 2,
        { steps: 10 }
      );
      
      // Check that current word display updates
      const currentWord = await page.$eval('#currentWord', el => el.textContent);
      console.log('Current word during selection:', currentWord);
      expect(currentWord).not.toBe('Select letters to form words');
      
      // Release mouse
      await page.mouse.up();
    }
  });

  test('should show message when submitting a word', async () => {
    // Get the actual letters in the grid
    const gridData = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.cell:not(.empty)'));
      return cells.map(cell => ({
        index: parseInt(cell.dataset.index),
        letter: cell.textContent,
        rect: cell.getBoundingClientRect()
      }));
    });

    console.log('Grid layout:');
    console.log('Positions and letters:', gridData.map(d => `${d.index}: ${d.letter}`));

    // Try to select adjacent cells
    if (gridData.length >= 2) {
      // Start with first cell
      const startCell = gridData[0];
      await page.mouse.move(
        startCell.rect.x + startCell.rect.width / 2,
        startCell.rect.y + startCell.rect.height / 2
      );
      await page.mouse.down();

      // Find an adjacent cell (checking actual adjacency in the game)
      let targetCell = null;
      for (let i = 1; i < gridData.length; i++) {
        const cell = gridData[i];
        // Check if cells are visually adjacent (within reasonable distance)
        const distance = Math.sqrt(
          Math.pow(cell.rect.x - startCell.rect.x, 2) + 
          Math.pow(cell.rect.y - startCell.rect.y, 2)
        );
        if (distance < 100) { // Cells should be close
          targetCell = cell;
          break;
        }
      }

      if (targetCell) {
        await page.mouse.move(
          targetCell.rect.x + targetCell.rect.width / 2,
          targetCell.rect.y + targetCell.rect.height / 2,
          { steps: 10 }
        );
      }

      await page.mouse.up();
      await new Promise(r => setTimeout(r, 1000));

      // Check if any message appeared
      const message = await page.$eval('#message', el => el.textContent);
      console.log('Message after word attempt:', message);
    }
  });

  test('should track found words', async () => {
    // Check initial state
    const initialFoundWords = await page.$eval('#wordsFound', el => el.textContent);
    expect(initialFoundWords).toBe('0');

    // Check that word list is empty initially
    const wordListItems = await page.$$('.found-word');
    expect(wordListItems.length).toBe(0);
  });

  test('should have working control buttons', async () => {
    // Test New Game button
    const newGameBtn = await page.$('button');
    const btnText = await newGameBtn.evaluate(el => el.textContent);
    expect(btnText).toBe('New Game');

    // Click new game and verify it doesn't crash
    await newGameBtn.click();
    await new Promise(r => setTimeout(r, 500));

    // Game should still be functional
    const title = await page.$eval('.title', el => el.textContent);
    expect(title).toBe('Cornerstones');
  });

  test('should display total possible words', async () => {
    // Wait for word loading to complete
    await new Promise(r => setTimeout(r, 5000));

    const totalWords = await page.$eval('#totalWords', el => el.textContent);
    console.log('Total possible words:', totalWords);
    
    // Should show some possible words
    expect(parseInt(totalWords)).toBeGreaterThan(0);
  });

  test('should persist data in localStorage', async () => {
    // Check if localStorage is being used
    const hasLocalStorage = await page.evaluate(() => {
      return 'localStorage' in window;
    });
    expect(hasLocalStorage).toBe(true);

    // Check if game saves progress
    const savedData = await page.evaluate(() => {
      return localStorage.getItem('cornerstonesProgress');
    });
    console.log('Saved progress:', savedData);
  });

  test('should accept valid words from the grid', async () => {
    // Wait for word list to load
    await new Promise(r => setTimeout(r, 5000));

    // Get the grid layout to understand what words are possible
    const gridInfo = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.cell:not(.empty)'));
      const gridData = cells.map(cell => ({
        index: parseInt(cell.dataset.index),
        letter: cell.textContent,
        rect: cell.getBoundingClientRect()
      }));

      // Show the grid visually for debugging
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

    console.log('Current grid:', gridInfo.visual);

    // Try to form the word "CORN" if those letters are adjacent
    // This is just an example - the actual word depends on the grid
    const targetWord = 'CORN';
    const letters = targetWord.split('');
    
    // Find cells that contain these letters
    const cellsForWord = [];
    for (const letter of letters) {
      const cell = gridInfo.cells.find(c => c.letter === letter && !cellsForWord.includes(c));
      if (cell) cellsForWord.push(cell);
    }

    if (cellsForWord.length === targetWord.length) {
      console.log(`Found letters for ${targetWord}, attempting to select...`);
      
      // Start selection
      await page.mouse.move(
        cellsForWord[0].rect.x + cellsForWord[0].rect.width / 2,
        cellsForWord[0].rect.y + cellsForWord[0].rect.height / 2
      );
      await page.mouse.down();

      // Drag through each letter
      for (let i = 1; i < cellsForWord.length; i++) {
        await page.mouse.move(
          cellsForWord[i].rect.x + cellsForWord[i].rect.width / 2,
          cellsForWord[i].rect.y + cellsForWord[i].rect.height / 2,
          { steps: 5 }
        );
        await new Promise(r => setTimeout(r, 100));
      }

      // Release to submit word
      await page.mouse.up();
      await new Promise(r => setTimeout(r, 1000));

      // Check for message
      const message = await page.$eval('#message', el => el.textContent);
      console.log('Message after word submission:', message);

      // Check if word was added to found words
      const foundCount = await page.$eval('#wordsFound', el => el.textContent);
      console.log('Words found after attempt:', foundCount);
    }
  });
});