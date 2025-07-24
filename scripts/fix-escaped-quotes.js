#!/usr/bin/env node

// Fix escaped quotes in word-definitions.js
import fs from 'fs/promises';

async function fixEscapedQuotes() {
    console.log('🔧 Fixing escaped quotes in word-definitions.js...');
    
    try {
        let content = await fs.readFile('src/data/word-definitions.js', 'utf8');
        
        // Count escaped quotes before
        const beforeCount = (content.match(/\\"/g) || []).length;
        console.log(`   • Found ${beforeCount} escaped quotes`);
        
        // Replace \\" with '
        content = content.replace(/\\"/g, "'");
        
        // Save the fixed file
        await fs.writeFile('src/data/word-definitions.js', content);
        
        console.log('✅ Fixed escaped quotes successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
fixEscapedQuotes().catch(console.error);