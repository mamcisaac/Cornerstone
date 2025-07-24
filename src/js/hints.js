// Hint system for Cornerstones game
import { GAME_CONFIG } from './config.js';

export class HintSystem {
    constructor() {
        this.availableHints = GAME_CONFIG.INITIAL_HINTS;
        this.usedHintTypes = new Set();
    }

    // Add a hint when finding a non-cornerstone word
    earnHint(isBonus = false) {
        this.availableHints++;
        
        // Add animation class for bonus hints
        if (isBonus) {
            const hintElement = document.getElementById('hints-remaining');
            if (hintElement) {
                hintElement.classList.add('increment-bonus');
                setTimeout(() => {
                    hintElement.classList.remove('increment-bonus');
                }, 1000);
            }
        }
    }

    // Check if player has enough hints
    canUseHint(cost) {
        return this.availableHints >= cost;
    }

    // Use hints for various actions
    useHints(cost) {
        if (this.canUseHint(cost)) {
            this.availableHints -= cost;
            return true;
        }
        return false;
    }

    // Reveal one letter in an unfound cornerstone word
    revealLetter(cornerstoneWords) {
        const cost = 1;
        if (!this.useHints(cost)) return null;

        // Find unfound words
        const unfoundWords = cornerstoneWords.filter(w => !w.found);
        if (unfoundWords.length === 0) return null;

        // Pick a random unfound word
        const targetWord = unfoundWords[Math.floor(Math.random() * unfoundWords.length)];
        
        // Create a pattern with one revealed letter
        const word = targetWord.word;
        const revealIndex = Math.floor(Math.random() * word.length);
        
        const pattern = word.split('').map((letter, index) => {
            if (index === revealIndex) return letter;
            if (targetWord.revealed && targetWord.revealed[index]) return letter;
            return '_';
        }).join(' ');

        // Update revealed letters
        if (!targetWord.revealed) {
            targetWord.revealed = new Array(word.length).fill(false);
        }
        targetWord.revealed[revealIndex] = true;
        targetWord.pattern = pattern;

        return {
            word: targetWord.word,
            pattern: pattern,
            index: cornerstoneWords.indexOf(targetWord)
        };
    }

    // Show lengths of all cornerstone words
    showWordLengths(cornerstoneWords) {
        const baseCost = 3;
        const cost = Math.min(5, baseCost + Math.floor(cornerstoneWords.length / 10));
        
        if (!this.useHints(cost)) return false;
        
        this.usedHintTypes.add('lengths');
        cornerstoneWords
            .filter(w => !w.found)
            .forEach(w => w.showLength = true);
        
        return true;
    }

    // Sort cornerstone words alphabetically
    sortAlphabetically() {
        const cost = 3;
        
        if (!this.useHints(cost)) return false;
        
        this.usedHintTypes.add('alphabetical');
        return true;
    }

    // Reveal all definitions
    revealDefinitions(cornerstoneWords) {
        const baseCost = 8;
        const cost = Math.min(12, baseCost + Math.floor(cornerstoneWords.length / 10));
        
        if (!this.useHints(cost)) return false;
        
        this.usedHintTypes.add('definitions');
        cornerstoneWords.forEach(w => w.showDefinition = true);
        
        return true;
    }

    // Get hint costs for current puzzle
    getHintCosts(cornerstoneCount) {
        return {
            revealLetter: 1,
            showDefinition: 1,
            showLengths: Math.min(5, 3 + Math.floor(cornerstoneCount / 10)),
            sortAlphabetically: 3,
            revealDefinitions: Math.min(12, 8 + Math.floor(cornerstoneCount / 10))
        };
    }

    // Save hint state
    saveState() {
        return {
            availableHints: this.availableHints,
            usedHintTypes: Array.from(this.usedHintTypes)
        };
    }

    // Load hint state
    loadState(state) {
        if (state) {
            this.availableHints = state.availableHints || GAME_CONFIG.INITIAL_HINTS;
            this.usedHintTypes = new Set(state.usedHintTypes || []);
        }
    }

    // Reset hint system for new game
    reset() {
        this.availableHints = GAME_CONFIG.INITIAL_HINTS;
        this.usedHintTypes.clear();
    }
}