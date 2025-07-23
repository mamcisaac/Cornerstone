const https = require('https');

// Test Datamuse API
async function fetchDefinitionFromDatamuse(word) {
    return new Promise((resolve, reject) => {
        const url = `https://api.datamuse.com/words?sp=${encodeURIComponent(word.toLowerCase())}&md=d&max=1`;
        console.log(`Fetching: ${url}`);
        
        https.get(url, (res) => {
            let data = '';
            console.log(`Status: ${res.statusCode}`);
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    console.log(`Raw response: ${data}`);
                    
                    if (res.statusCode === 200) {
                        const parsed = JSON.parse(data);
                        console.log(`Parsed data:`, parsed);
                        
                        if (parsed && parsed.length > 0 && parsed[0].defs && parsed[0].defs.length > 0) {
                            const fullDef = parsed[0].defs[0];
                            const definition = fullDef.includes('\t') ? fullDef.split('\t')[1] : fullDef;
                            console.log(`Extracted definition: ${definition}`);
                            resolve(definition);
                        } else {
                            console.log('No valid definition found');
                            reject(new Error('No definition found'));
                        }
                    } else {
                        console.log(`HTTP error: ${res.statusCode}`);
                        reject(new Error(`HTTP ${res.statusCode}`));
                    }
                } catch (error) {
                    console.log(`Parse error:`, error.message);
                    reject(new Error('Failed to parse response'));
                }
            });
        }).on('error', (error) => {
            console.log(`Network error:`, error.message);
            reject(error);
        });
    });
}

// Test with problematic words
async function test() {
    const testWords = ['acer', 'relationship', 'conversation', 'acre'];
    
    for (const word of testWords) {
        console.log(`\n=== Testing word: ${word} ===`);
        try {
            const definition = await fetchDefinitionFromDatamuse(word);
            console.log(`✅ Success: ${definition}`);
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

test();