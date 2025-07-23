const https = require('https');

// Test the API fetching function
async function fetchDefinitionFromAPI(word) {
    return new Promise((resolve, reject) => {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`;
        console.log(`Fetching: ${url}`);
        
        https.get(url, (res) => {
            let data = '';
            console.log(`Status: ${res.statusCode}`);
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    console.log(`Raw response: ${data.substring(0, 200)}...`);
                    
                    if (res.statusCode === 200) {
                        const parsed = JSON.parse(data);
                        console.log(`Parsed data:`, parsed[0]?.meanings?.[0]?.definitions?.[0]);
                        
                        if (parsed && parsed.length > 0 && parsed[0].meanings && parsed[0].meanings.length > 0) {
                            const firstMeaning = parsed[0].meanings[0];
                            const definition = firstMeaning.definitions[0]?.definition || 'No definition available';
                            console.log(`Extracted definition: ${definition}`);
                            resolve(definition);
                        } else {
                            console.log('No valid structure found');
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

// Test with a few words
async function test() {
    const testWords = ['relationship', 'conversation', 'development'];
    
    for (const word of testWords) {
        console.log(`\n=== Testing word: ${word} ===`);
        try {
            const definition = await fetchDefinitionFromAPI(word);
            console.log(`✅ Success: ${definition}`);
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

test();