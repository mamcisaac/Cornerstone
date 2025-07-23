const fs = require('fs');

// Read the HTML file
const html = fs.readFileSync('index.html', 'utf8');

// Extract JavaScript from script tags
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptNumber = 0;

while ((match = scriptRegex.exec(html)) !== null) {
    scriptNumber++;
    const script = match[1];
    
    // Skip empty scripts or external scripts
    if (!script.trim() || script.includes('src=')) continue;
    
    try {
        // Try to parse the JavaScript
        new Function(script);
        console.log(`Script ${scriptNumber}: OK`);
    } catch (error) {
        console.error(`Script ${scriptNumber}: SYNTAX ERROR`);
        console.error(error.message);
        
        // Find the approximate line number in the original HTML
        const htmlBeforeScript = html.substring(0, match.index);
        const htmlLineNumber = htmlBeforeScript.split('\n').length;
        console.error(`Around HTML line ${htmlLineNumber}`);
        
        // Show a snippet of the problematic code
        const lines = script.split('\n');
        const errorLine = parseInt(error.message.match(/line (\d+)/) ? error.message.match(/line (\d+)/)[1] : 0);
        if (errorLine > 0 && errorLine <= lines.length) {
            console.error(`Problem near: ${lines[errorLine - 1].trim()}`);
        }
    }
}

console.log('\nChecking for common issues...');

// Check for unclosed tags
const openTags = html.match(/<[^/][^>]*>/g) || [];
const closeTags = html.match(/<\/[^>]+>/g) || [];
console.log(`Open tags: ${openTags.length}, Close tags: ${closeTags.length}`);

// Check for specific issues
if (html.includes('onclick="game.')) {
    const gameCallCount = (html.match(/onclick="game\./g) || []).length;
    console.log(`Found ${gameCallCount} onclick="game." calls`);
}