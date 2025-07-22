// Comprehensive English word list for validation (4+ letters)
// Generated from dwyl/english-words repository
// Contains ~370k words for complete word discovery

console.log('Loading comprehensive word dictionary...');

// Create word set from filtered word list
const loadWords = async () => {
    try {
        const response = await fetch('./words_4plus.txt');
        const text = await response.text();
        const words = text.trim().split('\n').map(word => word.toUpperCase());
        return new Set(words);
    } catch (error) {
        console.error('Failed to load word list:', error);
        // Fallback to a smaller embedded list for critical words
        return new Set([
            'STONE', 'STONES', 'CORNERS', 'CORNERSTONES', 'NOTES', 'NOTE', 
            'STORE', 'STORES', 'CORES', 'CORE', 'CORNS', 'CORN', 'NETS',
            'NEST', 'REST', 'TERN', 'TENS', 'SENT', 'TONE', 'TONES',
            'SORE', 'SORES', 'ROSE', 'NOSE', 'ONES', 'COST', 'COSTS',
            'COTS', 'SCOT', 'SECT', 'STERN', 'TERMS', 'TERM'
        ]);
    }
};

// Word validation class
class ComprehensiveWordValidator {
    constructor() {
        this.wordSet = null;
        this.loading = false;
        this.loaded = false;
    }

    async initialize() {
        if (this.loaded) return true;
        if (this.loading) {
            // Wait for existing load to complete
            while (this.loading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.loaded;
        }

        this.loading = true;
        try {
            this.wordSet = await loadWords();
            this.loaded = true;
            console.log(`✅ Loaded ${this.wordSet.size} words for validation`);
        } catch (error) {
            console.error('Failed to initialize word validator:', error);
            this.loaded = false;
        } finally {
            this.loading = false;
        }
        
        return this.loaded;
    }

    isValidWord(word) {
        if (!this.loaded || !this.wordSet) {
            console.warn('Word validator not initialized');
            return false;
        }
        return this.wordSet.has(word.toUpperCase());
    }

    getWordCount() {
        return this.wordSet ? this.wordSet.size : 0;
    }
}

// Global instance
window.wordValidator = new ComprehensiveWordValidator();