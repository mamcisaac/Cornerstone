// Main initialization script for Cornerstones game
import { CornerstonesGame } from './game.js';
import { GAME_CONFIG } from './config.js';
import { logger } from './logger.js';

// Initialize the game when page loads
let game;

document.addEventListener('DOMContentLoaded', () => {
    try {
        game = new CornerstonesGame();
        window.game = game; // Make game accessible globally for onclick handlers
        
        // Show instructions for first-time users
        const hasPlayedBefore = localStorage.getItem('cornerstones_played');
        if (!hasPlayedBefore) {
            // Wait a bit for the game to initialize before showing instructions
            setTimeout(() => {
                if (window.showInstructions) {
                    window.showInstructions();
                }
                localStorage.setItem('cornerstones_played', 'true');
            }, GAME_CONFIG.INSTRUCTION_DELAY);
        }
        
        logger.success('Cornerstones game initialized successfully');
        
        // Setup event listeners to replace onclick handlers
        setupEventListeners();
        
        // Re-setup mobile handlers on resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                setupMobileHandlers();
            }, 250);
        });
        
    } catch (error) {
        logger.error('Failed to initialize Cornerstones game:', error);
        
        // Show error message to user
        const errorEl = document.createElement('div');
        errorEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 9999;
        `;
        errorEl.innerHTML = `
            <h3>Game Failed to Load</h3>
            <p>Please refresh the page or check the browser console for details.</p>
            <button id="refresh-page-btn" style="margin-top: 10px; padding: 5px 15px;">Refresh Page</button>
        `;
        document.body.appendChild(errorEl);
        
        // Add event listener for refresh button
        const refreshBtn = document.getElementById('refresh-page-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => location.reload());
        }
    }
});

// Setup mobile click handlers for stat chips
function setupMobileHandlers() {
    // Remove existing mobile handlers first
    document.querySelectorAll('.stat-chip').forEach(chip => {
        chip.replaceWith(chip.cloneNode(true));
    });
    
    // Add mobile handlers if needed
    if (window.isMobile && window.isMobile()) {
        // Cornerstone chip and hints chip both open cornerstone panel
        const cornerstoneChip = document.querySelector('.stat-chip.cornerstone');
        const hintsChip = document.querySelector('.stat-chip.hints');
        const totalChip = document.querySelector('.stat-chip:not(.cornerstone):not(.hints)');
        
        if (cornerstoneChip) {
            cornerstoneChip.addEventListener('click', () => {
                if (window.showMobilePopup) {
                    window.showMobilePopup('cornerstone-tab');
                }
            });
        }
        
        if (hintsChip) {
            hintsChip.addEventListener('click', () => {
                if (window.showMobilePopup) {
                    window.showMobilePopup('cornerstone-tab');
                }
            });
        }
        
        if (totalChip) {
            totalChip.addEventListener('click', () => {
                if (window.showMobilePopup) {
                    window.showMobilePopup('found-tab');
                }
            });
        }
    }
}

// Setup event listeners to replace onclick handlers
function setupEventListeners() {
    // Use delegation for hint buttons that might be in hidden tabs
    document.addEventListener('click', (e) => {
        const revealLetterBtn = e.target.closest('#reveal-letter-btn');
        const showDefinitionBtn = e.target.closest('#show-definition-btn');
        
        if (revealLetterBtn) {
            e.preventDefault();
            if (window.game && typeof window.game.revealLetter === 'function') {
                window.game.revealLetter();  
            }
        } else if (showDefinitionBtn) {
            e.preventDefault();
            if (window.game && typeof window.game.startDefinitionRevealMode === 'function') {
                window.game.startDefinitionRevealMode();
            }
        }
    });
    
    // Setup mobile handlers
    setupMobileHandlers();

    // Help button
    const helpButton = document.getElementById('help-button');
    if (helpButton) {
        helpButton.addEventListener('click', () => {
            if (window.showInstructions) {
                window.showInstructions();
            }
        });
    }

    // Switch puzzle button
    const switchPuzzleBtn = document.getElementById('switch-puzzle-btn');
    if (switchPuzzleBtn) {
        switchPuzzleBtn.addEventListener('click', () => {
            if (window.game) {
                window.game.switchPuzzle();
            }
        });
    }

    // Hint buttons handled by delegation above

    // Overlay and close buttons
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            // Check if instructions popup is showing
            const instructionsPopup = document.getElementById('instructions-popup');
            if (instructionsPopup && instructionsPopup.classList.contains('show')) {
                if (window.hideInstructions) {
                    window.hideInstructions();
                }
            }
            // Also check for definition popup
            if (window.hideDefinition) {
                window.hideDefinition();
            }
        });
    }

    const definitionCloseBtn = document.getElementById('definition-close-btn');
    if (definitionCloseBtn) {
        definitionCloseBtn.addEventListener('click', () => {
            if (window.hideDefinition) {
                window.hideDefinition();
            }
        });
    }

    const instructionsCloseX = document.getElementById('instructions-close-x');
    if (instructionsCloseX) {
        instructionsCloseX.addEventListener('click', () => {
            if (window.hideInstructions) {
                window.hideInstructions();
            }
        });
    }

    const closeInstructionsBtn = document.getElementById('close-instructions');
    if (closeInstructionsBtn) {
        closeInstructionsBtn.addEventListener('click', () => {
            if (window.hideInstructions) {
                window.hideInstructions();
            }
        });
    }
}

// Export game instance for testing and debugging
export { game };