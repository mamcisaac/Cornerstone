// Main initialization script for Cornerstones game
import { CornerstonesGame } from './game.js';

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
            }, 1000);
        }
        
        console.log('✅ Cornerstones game initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize Cornerstones game:', error);
        
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
            <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 15px;">Refresh Page</button>
        `;
        document.body.appendChild(errorEl);
    }
});

// Export game instance for testing and debugging
export { game };