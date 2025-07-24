#!/usr/bin/env node

// Safely remove placeholder definitions
import fs from 'fs/promises';

async function removePlaceholders() {
    console.log('🔧 Safely removing placeholder definitions...');
    
    try {
        let content = await fs.readFile('src/data/word-definitions.js', 'utf8');
        
        // Split into lines and filter out placeholders
        const lines = content.split('\n');
        const filteredLines = lines.filter(line => {
            return !line.includes('"A valid English word:') && 
                   !line.includes('"A surname."');
        });
        
        const newContent = filteredLines.join('\n');
        
        // Count removed
        const originalCount = lines.length;
        const newCount = filteredLines.length;
        const removed = originalCount - newCount;
        
        console.log(`   • Original lines: ${originalCount}`);
        console.log(`   • New lines: ${newCount}`);
        console.log(`   • Removed: ${removed} placeholder definitions`);
        
        // Save the file
        await fs.writeFile('src/data/word-definitions.js', newContent);
        
        console.log('✅ Successfully removed placeholder definitions!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
removePlaceholders().catch(console.error);