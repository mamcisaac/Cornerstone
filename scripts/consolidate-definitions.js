// Consolidate all enhanced definitions from batch files
const fs = require('fs');
const { COMMON_DEFINITIONS } = require('./common-definitions.js');

// Read all batch files
const batchFiles = [
    'enhanced-definitions-batch-0-49.json',
    'enhanced-definitions-batch-50-99.json', 
    'enhanced-definitions-batch-100-149.json',
    'enhanced-definitions-batch-150-199.json',
    'enhanced-definitions-batch-200-207.json'
];

// Consolidate all enhanced definitions
const allEnhanced = {};
let totalProcessed = 0;
let totalEnhanced = 0;
let totalFailed = 0;

batchFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const batch = JSON.parse(fs.readFileSync(file, 'utf8'));
        Object.assign(allEnhanced, batch.enhanced);
        totalProcessed += batch.summary.processed;
        totalEnhanced += batch.summary.enhanced;
        totalFailed += batch.summary.failed;
    }
});

console.log(`\n📊 Total Results:`);
console.log(`   Processed: ${totalProcessed} words`);
console.log(`   Enhanced: ${totalEnhanced} words`);
console.log(`   Failed: ${totalFailed} words`);
console.log(`   Success rate: ${Math.round((totalEnhanced / totalProcessed) * 100)}%`);

// Create updates for common-definitions.js
const updates = {};
Object.keys(allEnhanced).forEach(word => {
    updates[word] = allEnhanced[word];
});

// Save consolidated results
fs.writeFileSync('all-enhanced-definitions.json', JSON.stringify({
    enhanced: allEnhanced,
    summary: {
        totalProcessed,
        totalEnhanced,
        totalFailed,
        successRate: `${Math.round((totalEnhanced / totalProcessed) * 100)}%`
    }
}, null, 2));

console.log(`\n✅ Consolidated ${Object.keys(allEnhanced).length} enhanced definitions`);
console.log(`📁 Saved to all-enhanced-definitions.json`);

// Export for use
module.exports = { allEnhanced };