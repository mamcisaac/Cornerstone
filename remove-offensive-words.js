#!/usr/bin/env node

// Remove Offensive Words - Clean up word database and definitions

import fs from 'fs/promises';

const offensiveWords = ['BOONG', 'CHEN', 'COON'];

// Remove offensive words from word database
const cleanWordDatabase = async () => {
    console.log('🧹 Cleaning word database...');
    
    const content = await fs.readFile('./src/data/words-database-compact.js', 'utf8');
    const match = content.match(/export const WORD_LIST_STRING = "([^"]+)"/);
    
    if (match) {
        const words = match[1].split('|');
        const originalCount = words.length;
        
        const cleanedWords = words.filter(word => !offensiveWords.includes(word.toUpperCase()));
        const removedCount = originalCount - cleanedWords.length;
        
        const newWordListString = cleanedWords.join('|');
        const updatedContent = content.replace(
            /export const WORD_LIST_STRING = "[^"]+"/,
            `export const WORD_LIST_STRING = "${newWordListString}"`
        );
        
        await fs.writeFile('./src/data/words-database-compact.js', updatedContent, 'utf8');
        
        console.log(`   ✅ Removed ${removedCount} offensive words from database`);
        console.log(`   📊 Words: ${originalCount} → ${cleanedWords.length}`);
        
        return { originalCount, cleanedCount: cleanedWords.length, removedCount };
    }
    
    throw new Error('Could not parse word database');
};

// Remove offensive words from definitions
const cleanDefinitions = async () => {
    console.log('🧹 Cleaning definitions...');
    
    const content = await fs.readFile('./src/data/word-definitions.js', 'utf8');
    let updatedContent = content;
    let removedCount = 0;
    
    // Remove each offensive word's definition
    for (const word of offensiveWords) {
        const regex = new RegExp(`\\s*"${word}": "[^"]*",?\\n`, 'g');
        if (updatedContent.match(regex)) {
            updatedContent = updatedContent.replace(regex, '');
            removedCount++;
            console.log(`   ❌ Removed definition for ${word}`);
        }
    }
    
    // Clean up any double commas or trailing commas
    updatedContent = updatedContent.replace(/,(\s*,)+/g, ',');
    updatedContent = updatedContent.replace(/,(\s*)\}/g, '$1}');
    
    await fs.writeFile('./src/data/word-definitions.js', updatedContent, 'utf8');
    
    console.log(`   ✅ Removed ${removedCount} offensive definitions`);
    
    return { removedCount };
};

// Main cleanup function
const removeOffensiveWords = async () => {
    console.log('🚫 Removing Offensive Words');
    console.log('═'.repeat(40));
    console.log(`Words to remove: ${offensiveWords.join(', ')}`);
    console.log('');
    
    try {
        const databaseStats = await cleanWordDatabase();
        const definitionStats = await cleanDefinitions();
        
        console.log('');
        console.log('✅ Cleanup Complete!');
        console.log('═'.repeat(40));
        console.log(`📊 SUMMARY:`);
        console.log(`   • Words removed from database: ${databaseStats.removedCount}`);
        console.log(`   • Definitions removed: ${definitionStats.removedCount}`);
        console.log(`   • Final word count: ${databaseStats.cleanedCount}`);
        console.log('');
        console.log('🛡️  Game now free of offensive content!');
        
        return {
            database: databaseStats,
            definitions: definitionStats
        };
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
        process.exit(1);
    }
};

// Run cleanup
removeOffensiveWords();