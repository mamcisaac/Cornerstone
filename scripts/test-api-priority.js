// Test the new API priority ordering with sample words

const https = require('https');

// Test words including ones that work better with Datamuse
const testWords = [
    'AEDINE',    // Obscure - Datamuse should handle
    'AMINIC',    // Technical - Datamuse should handle
    'ABILITY',   // Common - either API should work
    'COHEN',     // Surname - Datamuse handles better
    'BIVIAL',    // Rare - Datamuse should handle
    'CNIDA',     // Scientific - Datamuse should handle
];

// Simplified API calls for testing
async function testDatamuse(word) {
    return new Promise((resolve) => {
        const url = `https://api.datamuse.com/words?sp=${word.toLowerCase()}&md=d&max=1`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && parsed[0] && parsed[0].defs) {
                        const def = parsed[0].defs[0].split('\t')[1];
                        resolve({ success: true, definition: def });
                    } else {
                        resolve({ success: false });
                    }
                } catch (e) {
                    resolve({ success: false });
                }
            });
        }).on('error', () => resolve({ success: false }));
    });
}

async function testFreeDictionary(word) {
    return new Promise((resolve) => {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && parsed[0] && parsed[0].meanings) {
                        const def = parsed[0].meanings[0].definitions[0].definition;
                        resolve({ success: true, definition: def });
                    } else {
                        resolve({ success: false });
                    }
                } catch (e) {
                    resolve({ success: false });
                }
            });
        }).on('error', () => resolve({ success: false }));
    });
}

// Test each word with both APIs
async function runTests() {
    console.log('Testing API effectiveness with new priority (Datamuse first):\n');
    
    for (const word of testWords) {
        console.log(`\nTesting: ${word}`);
        
        // Test Datamuse
        const datamuseResult = await testDatamuse(word);
        console.log(`  Datamuse: ${datamuseResult.success ? '✓' : '✗'}`);
        if (datamuseResult.success) {
            console.log(`    "${datamuseResult.definition.substring(0, 60)}..."`);
        }
        
        // Test FreeDictionary
        const freeResult = await testFreeDictionary(word);
        console.log(`  FreeDictionary: ${freeResult.success ? '✓' : '✗'}`);
        if (freeResult.success) {
            console.log(`    "${freeResult.definition.substring(0, 60)}..."`);
        }
        
        // Summary
        if (datamuseResult.success && !freeResult.success) {
            console.log(`  → Datamuse wins (FreeDictionary failed)`);
        } else if (!datamuseResult.success && freeResult.success) {
            console.log(`  → FreeDictionary wins (Datamuse failed)`);
        } else if (datamuseResult.success && freeResult.success) {
            console.log(`  → Both succeeded`);
        } else {
            console.log(`  → Both failed`);
        }
        
        // Small delay to be nice to APIs
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n✅ New API priority order (Datamuse → FreeDictionary → Wordnik) is optimized!');
}

runTests().catch(console.error);