// Script to run definition enhancement in batches
const { enhanceDefinitions } = require('./multi-api-definitions.js');

async function runBatch(startIndex, batchSize = 50) {
    console.log(`\n🔄 Running batch starting at word ${startIndex + 1}...`);
    try {
        const results = await enhanceDefinitions(startIndex, batchSize);
        return results;
    } catch (error) {
        console.error(`❌ Batch failed: ${error.message}`);
        return null;
    }
}

// Run specific batch based on command line argument
const batchNumber = parseInt(process.argv[2]) || 2;
const startIndex = (batchNumber - 1) * 50;

console.log(`📦 Processing batch ${batchNumber} (words ${startIndex + 1}-${Math.min(startIndex + 50, 208)})`);
runBatch(startIndex).catch(console.error);