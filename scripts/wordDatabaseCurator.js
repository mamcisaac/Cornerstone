// Word Database Curator - Removes invalid words from words-database-compact.js
import fs from 'fs/promises';

// Known offensive words to remove from database
const KNOWN_OFFENSIVE_WORDS = ['BOONG', 'CHEN', 'COON'];

export class WordDatabaseCurator {
    constructor() {
        this.databasePath = 'src/data/words-database-compact.js';
        this.invalidWords = new Set();
        
        // Add known offensive words to invalid set immediately
        KNOWN_OFFENSIVE_WORDS.forEach(word => this.invalidWords.add(word.toUpperCase()));
    }

    /**
     * Add a word to be removed from the database
     * @param {string} word - Word that failed to get definitions from APIs
     */
    markWordAsInvalid(word) {
        this.invalidWords.add(word.toUpperCase());
    }

    /**
     * Add multiple words to be removed from the database
     * @param {Array<string>} words - Words that failed to get definitions from APIs
     */
    markWordsAsInvalid(words) {
        words.forEach(word => this.markWordAsInvalid(word));
    }

    /**
     * Remove all marked invalid words from the word database
     * @returns {Promise<Object>} Stats about the curation process
     */
    async curateDatabase() {
        if (this.invalidWords.size === 0) {
            return { wordsRemoved: 0, totalWords: 0, message: 'No invalid words to remove' };
        }

        try {
            // Read the current database file
            const content = await fs.readFile(this.databasePath, 'utf8');
            
            // Extract the current word list
            const wordListMatch = content.match(/export const WORD_LIST_STRING = "([^"]+)"/);
            if (!wordListMatch) {
                throw new Error('Could not find WORD_LIST_STRING in database file');
            }

            const currentWords = wordListMatch[1].split('|');
            const originalCount = currentWords.length;

            // Filter out invalid words (case-insensitive)
            const cleanedWords = currentWords.filter(word => 
                !this.invalidWords.has(word.toUpperCase())
            );

            const newCount = cleanedWords.length;
            const removedCount = originalCount - newCount;

            // Update if we removed words OR if format needs fixing
            const needsFormatUpdate = content.includes('export const WORD_LIST_STRING');
            if (removedCount > 0 || needsFormatUpdate) {
                // Create new word list string
                const newWordListString = cleanedWords.join('|');

                // Generate new file content (browser-compatible format)
                const newContent = `// Compact word database for the Cornerstones game (curated)
// Generated: ${new Date().toISOString()}
// Words: ${newCount} (${removedCount} invalid words removed)

const WORD_LIST_STRING = "${newWordListString}";

// Split into array for game use
const WORDS_DATABASE = WORD_LIST_STRING.split('|');

// Set up global access for browser compatibility
if (typeof window !== 'undefined') {
    window.WORDS_DATABASE = WORDS_DATABASE;
    window.WORD_LIST_STRING = WORD_LIST_STRING;
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js compatibility
    module.exports = { WORDS_DATABASE, WORD_LIST_STRING };
}
`;

                // Write the updated file
                await fs.writeFile(this.databasePath, newContent);

                console.log(`📚 Word Database Updated:`);
                console.log(`   • Original words: ${originalCount}`);
                console.log(`   • Invalid words removed: ${removedCount}`);
                console.log(`   • Clean words remaining: ${newCount}`);
                if (removedCount === 0 && needsFormatUpdate) {
                    console.log(`   • Format updated for browser compatibility`);
                }
                
                // Show which words were removed (limit to first 20 for readability)
                const removedWords = Array.from(this.invalidWords).slice(0, 20);
                console.log(`   • Sample removed words: ${removedWords.join(', ')}${this.invalidWords.size > 20 ? '...' : ''}`);
            }

            // Clear the invalid words set for next time
            this.invalidWords.clear();

            return {
                wordsRemoved: removedCount,
                totalWords: newCount,
                originalCount: originalCount,
                message: `Successfully curated database`
            };

        } catch (error) {
            console.error('❌ Error curating word database:', error.message);
            throw error;
        }
    }

    /**
     * Get stats about words marked for removal
     * @returns {Object} Current stats
     */
    getStats() {
        return {
            invalidWordsMarked: this.invalidWords.size,
            invalidWords: Array.from(this.invalidWords)
        };
    }
}