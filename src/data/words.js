// Comprehensive English word list for validation (4+ letters)
// Generated from dwyl/english-words repository
// Contains ~370k words for complete word discovery

console.log('Loading comprehensive word dictionary...');

// Create word set from filtered word list
const loadWords = async () => {
    try {
        console.log('Attempting to load word list from words_4plus.txt...');
        const response = await fetch('./words_4plus.txt');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        const words = text.trim().split('\n').map(word => word.toUpperCase());
        console.log(`Successfully loaded ${words.length} words`);
        return new Set(words);
    } catch (error) {
        console.error('Failed to load word list, using fallback:', error);
        // Return a more comprehensive fallback for testing
        const fallbackWords = new Set([
            'STONE', 'STONES', 'CORNERS', 'CORNERSTONES', 'NOTES', 'NOTE', 
            'STORE', 'STORES', 'CORES', 'CORE', 'CORNS', 'CORN', 'NETS',
            'NEST', 'REST', 'TERN', 'TENS', 'SENT', 'TONE', 'TONES',
            'SORE', 'SORES', 'ROSE', 'NOSE', 'ONES', 'COST', 'COSTS',
            'COTS', 'SCOT', 'SECT', 'STERN', 'TERMS', 'TERM', 'NETS',
            'NESTS', 'ROSES', 'NOSE', 'NOSES', 'ORES', 'ERNS', 'EROS',
            'ONCE', 'CONE', 'CONES', 'SCENE', 'SCENES', 'CREST', 'CRESTS',
            'TOES', 'TORN', 'RENT', 'RENTS', 'TORE', 'SOOT', 'SOON',
            'NOES', 'ONTO', 'SNORE', 'ROOTS', 'ROOST', 'TERSE', 'STENO'
        ]);
        console.log(`Using fallback word list with ${fallbackWords.size} words`);
        return fallbackWords;
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
            console.warn('Word validator not initialized, attempting to validate:', word);
            return false;
        }
        const upperWord = word.toUpperCase();
        const isValid = this.wordSet.has(upperWord);
        console.log(`Validating "${upperWord}": ${isValid ? 'VALID' : 'INVALID'}`);
        return isValid;
    }

    getWordCount() {
        return this.wordSet ? this.wordSet.size : 0;
    }
}

// Global instance
window.wordValidator = new ComprehensiveWordValidator();