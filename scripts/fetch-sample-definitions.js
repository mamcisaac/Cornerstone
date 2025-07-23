// Test with just a few words to verify the API works correctly
const https = require('https');

async function fetchDefinitionFromAPI(word) {
    return new Promise((resolve, reject) => {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const parsed = JSON.parse(data);
                        if (parsed && parsed.length > 0 && parsed[0].meanings && parsed[0].meanings.length > 0) {
                            const firstMeaning = parsed[0].meanings[0];
                            const definition = firstMeaning.definitions[0]?.definition;
                            if (definition && definition.length > 10) {
                                resolve(definition);
                                return;
                            }
                        }
                    }
                    reject(new Error(`No definition found for ${word}`));
                } catch (error) {
                    reject(new Error(`Parse error for ${word}: ${error.message}`));
                }
            });
        }).on('error', (error) => {
            reject(new Error(`Network error for ${word}: ${error.message}`));
        });
    });
}

async function testSampleWords() {
    const testWords = [
        'RELATIONSHIP', 'CONVERSATION', 'DEVELOPMENT', 'TECHNOLOGY', 
        'UNIVERSITY', 'EXPERIMENT', 'BREAKTHROUGH', 'CORNERSTONE'
    ];
    
    console.log('Testing API with sample words from our puzzles:\n');
    
    const results = {};
    
    for (const word of testWords) {
        try {
            const definition = await fetchDefinitionFromAPI(word);
            results[word] = definition;
            console.log(`✅ ${word}: ${definition}`);
        } catch (error) {
            results[word] = `Failed: ${error.message}`;
            console.log(`❌ ${word}: ${error.message}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('\n=== RESULTS ===');
    console.log('Real definitions fetched:');
    
    Object.entries(results).forEach(([word, def]) => {
        if (!def.startsWith('Failed:')) {
            console.log(`"${word}": "${def}"`);
        }
    });
    
    const successCount = Object.values(results).filter(def => !def.startsWith('Failed:')).length;
    console.log(`\n✅ Successfully fetched ${successCount}/${testWords.length} definitions`);
}

testSampleWords();