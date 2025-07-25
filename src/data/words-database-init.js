// Initialize the comprehensive word set from JSON data
// This replaces the old WORD_LIST_STRING approach

// Create a promise that resolves when the database is loaded
window.WORD_DATABASE_READY = new Promise(async (resolve) => {
    try {
        const response = await fetch('src/data/words-database.json');
        const data = await response.json();
        
        // Create the comprehensive word set
        window.COMPREHENSIVE_WORD_SET = new Set(data.words);
        
        // For backward compatibility
        window.WORD_LIST_STRING = data.words.join('|');
        
        console.log(`Word database initialized with ${data.words.length} words`);
        resolve(true);
    } catch (error) {
        console.error('Failed to load word database:', error);
        // Fallback to empty set
        window.COMPREHENSIVE_WORD_SET = new Set();
        window.WORD_LIST_STRING = '';
        resolve(false);
    }
});