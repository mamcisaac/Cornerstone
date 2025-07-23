// Fix all missing commas in common-definitions.js
const fs = require('fs');

const content = fs.readFileSync('./common-definitions.js', 'utf8');

// Find all lines that end with a quote but don't have a comma, followed by a line starting with whitespace and quote
const fixed = content.replace(/(")\n(\s+")/g, '$1,\n$2');

fs.writeFileSync('./common-definitions.js', fixed);
console.log('Fixed missing commas in common-definitions.js');