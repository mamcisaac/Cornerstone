// Update common-definitions.js with all enhanced definitions
const fs = require('fs');
const data = require('./all-enhanced-definitions.json');
const allEnhanced = data.enhanced;

// Read the current common-definitions.js
let content = fs.readFileSync('./common-definitions.js', 'utf8');

// Update each enhanced definition
Object.keys(allEnhanced).forEach(word => {
    const definition = allEnhanced[word];
    
    // Create regex to find the word definition line
    const regex = new RegExp(`(\\s*"${word}":\\s*)"[^"]*"`, 'g');
    
    // Replace with enhanced definition
    content = content.replace(regex, `$1"${definition.replace(/"/g, '\\"')}"`);
});

// Write back the updated content
fs.writeFileSync('./common-definitions.js', content);

console.log(`✅ Updated ${Object.keys(allEnhanced).length} definitions in common-definitions.js`);
console.log('📝 All enhanced definitions have been applied!');