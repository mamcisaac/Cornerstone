// Configuration constants for Cornerstones game

export const GAME_CONFIG = {
    // Hint system
    INITIAL_HINTS: 3,
    
    // Word validation
    MIN_WORD_LENGTH: 4,
    
    // UI timing
    INSTRUCTION_DELAY: 1000,
    MESSAGE_TIMEOUT: 3000,
    
    // Grid configuration
    GRID_SIZE: 4,
    
    // Animation durations (in milliseconds)
    CELL_ANIMATION_DURATION: 200,
    WORD_ANIMATION_DURATION: 300,
    
    // Storage keys
    STORAGE_KEYS: {
        PLAYED_BEFORE: 'cornerstones_played',
        PUZZLE_STATE: 'cornerstones_puzzle_state',
        PREFERENCES: 'cornerstones_preferences'
    },
    
    // CSS classes
    CSS_CLASSES: {
        SELECTED: 'selected',
        FOUND: 'found',
        CORNERSTONE: 'cornerstone',
        ACTIVE: 'active',
        REVEALED: 'revealed'
    },
    
    // Game messages
    MESSAGES: {
        WORD_FOUND: 'Word found!',
        CORNERSTONE_FOUND: 'Cornerstone word found!',
        INVALID_WORD: 'Not a valid word',
        ALREADY_FOUND: 'Already found!',
        TOO_SHORT: 'Word must be at least 4 letters',
        PUZZLE_COMPLETE: 'Puzzle completed! Well done!',
        NO_HINTS: 'No hints remaining',
        HINT_USED: 'Hint used!'
    }
};

export default GAME_CONFIG;