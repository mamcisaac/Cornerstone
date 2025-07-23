// Quick script to check definition fetching progress

const fs = require('fs');

// Check if the output file exists
const outputFile = 'all-puzzle-definitions.js';

if (fs.existsSync(outputFile)) {
    // Load the current definitions
    const content = fs.readFileSync(outputFile, 'utf8');
    
    // Extract the definitions object
    const match = content.match(/const ALL_PUZZLE_DEFINITIONS = ({[\s\S]*?});/);
    if (match) {
        try {
            const definitions = JSON.parse(match[1]);
            const words = Object.keys(definitions);
            
            // Count different types
            let goodDefinitions = 0;
            let placeholders = 0;
            
            words.forEach(word => {
                const def = definitions[word];
                if (def === "A valid English word" || def === "A common English word") {
                    placeholders++;
                } else {
                    goodDefinitions++;
                }
            });
            
            console.log('📊 Definition Fetching Progress:');
            console.log(`Total words: ${words.length}`);
            console.log(`Good definitions: ${goodDefinitions}`);
            console.log(`Placeholders remaining: ${placeholders}`);
            console.log(`Progress: ${Math.round((goodDefinitions / words.length) * 100)}%`);
            
            // Show some recent additions
            console.log('\nRecent definitions:');
            words.slice(-5).forEach(word => {
                const def = definitions[word];
                if (def !== "A valid English word" && def !== "A common English word") {
                    console.log(`- ${word}: ${def.substring(0, 60)}...`);
                }
            });
            
            // Check timestamp
            const timestampMatch = content.match(/Generated on (.+)/);
            if (timestampMatch) {
                console.log(`\nLast updated: ${timestampMatch[1]}`);
            }
            
        } catch (e) {
            console.error('Error parsing definitions:', e.message);
        }
    }
} else {
    console.log('No definitions file found yet. The fetcher may still be starting up.');
}

// Also check if the process is still running
const { exec } = require('child_process');
exec('ps aux | grep "fetch-all-puzzle-definitions.js" | grep -v grep', (error, stdout) => {
    if (stdout.trim()) {
        console.log('\n✅ Fetcher process is running');
    } else {
        console.log('\n⚠️  Fetcher process not found - it may have completed or stopped');
    }
});