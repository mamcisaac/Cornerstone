// Test cornerstone word identification for AVAILABILITY puzzle
const fs = require('fs');
const path = require('path');

// Read and parse the common words file
function loadCommonWords() {
    const filePath = path.join(__dirname, 'src/data/common-words.js');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract the array content
    const match = content.match(/const COMMON_WORDS_LIST = \[([\s\S]*?)\];/);
    if (!match) {
        throw new Error('Could not parse COMMON_WORDS_LIST');
    }
    
    // Parse the array elements
    const arrayContent = match[1];
    const words = [];
    const lines = arrayContent.split('\n');
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('"') && trimmed.endsWith('",')) {
            const word = trimmed.slice(1, -2); // Remove quotes and comma
            words.push(word);
        } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            const word = trimmed.slice(1, -1); // Remove quotes
            words.push(word);
        }
    }
    
    return new Set(words.map(w => w.toLowerCase()));
}

// Simulate the grid generation and word finding for AVAILABILITY
function testAvailabilityCornerstone() {
    console.log('=== Testing AVAILABILITY Cornerstone Word Identification ===\n');
    
    // Load common words
    const commonWordsSet = loadCommonWords();
    console.log(`Loaded ${commonWordsSet.size} common words`);
    
    // Words that can be found in AVAILABILITY puzzle based on our debug output
    const foundWords = [
        'AVAILABILITY',
        'ABILITY', 
        'ALBA',
        'ALBI',
        'AVAIL',
        'BAIL',
        'BALI',
        'LAVA',
        'LILY',
        'TILY',
        'VAIL',
        'VIAL',
        'VILA'
    ];
    
    console.log('\\nClassifying found words as cornerstone or regular:');
    console.log('='.repeat(60));
    
    const cornerstoneWords = [];
    const regularWords = [];
    
    foundWords.forEach(word => {
        const isCommon = commonWordsSet.has(word.toLowerCase());
        if (isCommon) {
            cornerstoneWords.push(word);
            console.log(`✓ ${word.padEnd(15)} - CORNERSTONE (common word)`);
        } else {
            regularWords.push(word);
            console.log(`  ${word.padEnd(15)} - regular word`);
        }
    });
    
    console.log('\\n' + '='.repeat(60));
    console.log(`SUMMARY:`);
    console.log(`Total words found: ${foundWords.length}`);
    console.log(`Cornerstone words: ${cornerstoneWords.length}`);
    console.log(`Regular words: ${regularWords.length}`);
    
    console.log('\\nCornerstone words:');
    cornerstoneWords.forEach(word => console.log(`  - ${word}`));
    
    if (cornerstoneWords.length === 0) {
        console.log('\\n🚨 ERROR: No cornerstone words found! This explains the missing cornerstone words issue.');
    } else if (cornerstoneWords.length < 3) {
        console.log('\\n⚠️  WARNING: Very few cornerstone words found. Expected more for a good puzzle experience.');
    } else {
        console.log('\\n✅ SUCCESS: Found cornerstone words. The puzzle should work correctly.');
    }
    
    // Test specific common words that should be cornerstone
    console.log('\\nTesting specific expected cornerstone words:');
    const expectedCornerstone = ['availability', 'ability', 'tail'];
    expectedCornerstone.forEach(word => {
        const isCommon = commonWordsSet.has(word.toLowerCase());
        const isFound = foundWords.map(w => w.toLowerCase()).includes(word.toLowerCase());
        
        let status = '';
        if (isFound && isCommon) {
            status = '✅ FOUND & COMMON (cornerstone)';
        } else if (isFound && !isCommon) {
            status = '⚠️  FOUND but NOT COMMON (regular word)';
        } else if (!isFound && isCommon) {
            status = '❌ NOT FOUND but IS COMMON (missing cornerstone)';
        } else {
            status = '❌ NOT FOUND and NOT COMMON';
        }
        
        console.log(`  ${word.padEnd(15)} - ${status}`);
    });
}

try {
    testAvailabilityCornerstone();
} catch (error) {
    console.error('Error running test:', error.message);
}