// Script to fetch definitions for missing words in Cornerstones puzzle
const fs = require('fs');
const https = require('https');
const { findAllCornerstonesWords } = require('./get-cornerstones-words.js');

// Get current definitions from common-definitions.js
const COMMON_DEFINITIONS = require('./common-definitions.js').COMMON_DEFINITIONS || {};

// Function to fetch definition from Dictionary API
function fetchDefinitionFromAPI(word) {
    return new Promise((resolve, reject) => {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    
                    if (jsonData && Array.isArray(jsonData) && jsonData.length > 0) {
                        const entry = jsonData[0];
                        if (entry.meanings && entry.meanings.length > 0) {
                            const firstMeaning = entry.meanings[0];
                            if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
                                let definition = firstMeaning.definitions[0].definition;
                                
                                // Clean up the definition
                                definition = definition.charAt(0).toUpperCase() + definition.slice(1);
                                if (!definition.endsWith('.')) {
                                    definition += '.';
                                }
                                
                                resolve(definition);
                                return;
                            }
                        }
                    }
                    
                    resolve(null);
                } catch (error) {
                    console.warn(`Failed to parse API response for "${word}":`, error.message);
                    resolve(null);
                }
            });
        }).on('error', (error) => {
            console.warn(`API request failed for "${word}":`, error.message);
            resolve(null);
        });
    });
}

async function fetchMissingDefinitions() {
    console.log('Finding missing definitions for Cornerstones puzzle...');
    
    const allWords = findAllCornerstonesWords();
    console.log(`Total words in puzzle: ${allWords.length}`);
    
    // Find words that don't have definitions yet
    const missingWords = allWords.filter(word => !COMMON_DEFINITIONS[word]);
    console.log(`Words missing definitions: ${missingWords.length}`);
    console.log('Missing words:', missingWords.slice(0, 10).join(', '), missingWords.length > 10 ? '...' : '');
    
    const newDefinitions = {};
    const failed = [];
    
    // Fetch definitions for missing words with rate limiting
    for (let i = 0; i < missingWords.length; i++) {
        const word = missingWords[i];
        console.log(`Fetching ${i + 1}/${missingWords.length}: ${word}`);
        
        try {
            const definition = await fetchDefinitionFromAPI(word);
            
            if (definition) {
                newDefinitions[word] = definition;
                console.log(`✓ ${word}: ${definition.substring(0, 60)}${definition.length > 60 ? '...' : ''}`);
            } else {
                failed.push(word);
                console.log(`✗ ${word}: No definition found`);
            }
        } catch (error) {
            failed.push(word);
            console.log(`✗ ${word}: Error - ${error.message}`);
        }
        
        // Rate limiting - wait 150ms between requests
        if (i < missingWords.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        // Progress checkpoint every 20 words
        if ((i + 1) % 20 === 0) {
            console.log(`--- Progress: ${i + 1}/${missingWords.length} ---`);
        }
    }
    
    console.log(`\n🎉 Completed! Successfully fetched ${Object.keys(newDefinitions).length} new definitions`);
    console.log(`📝 Failed to fetch ${failed.length} definitions`);
    
    // Save the new definitions to add to common-definitions.js
    const output = `// New definitions to add to COMMON_DEFINITIONS
// Generated for Cornerstones puzzle words

const NEW_DEFINITIONS = ${JSON.stringify(newDefinitions, null, 2)};

module.exports = { NEW_DEFINITIONS };
`;
    
    fs.writeFileSync('new-cornerstones-definitions.js', output);
    console.log(`\n📁 New definitions saved to new-cornerstones-definitions.js`);
    
    // Save failed words for manual review
    if (failed.length > 0) {
        const failedOutput = `// Words that failed to fetch definitions
const FAILED_WORDS = ${JSON.stringify(failed, null, 2)};
module.exports = { FAILED_WORDS };
`;
        fs.writeFileSync('failed-cornerstones-words.js', failedOutput);
        console.log(`📁 Failed words saved to failed-cornerstones-words.js`);
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`- Total words in puzzle: ${allWords.length}`);
    console.log(`- Already had definitions: ${allWords.length - missingWords.length}`);
    console.log(`- Fetched new definitions: ${Object.keys(newDefinitions).length}`);
    console.log(`- Failed to fetch: ${failed.length}`);
    console.log(`- Coverage: ${Math.round(((allWords.length - failed.length) / allWords.length) * 100)}%`);
    
    return newDefinitions;
}

// Run the script
if (require.main === module) {
    fetchMissingDefinitions().catch(console.error);
}

module.exports = { fetchMissingDefinitions };