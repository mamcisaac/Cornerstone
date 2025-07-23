// UI utilities and mobile tab switching
import { GAME_CONFIG } from './config.js';

// Mobile tab switching
export function switchTab(tabName, targetElement = null) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    if (targetElement) {
        targetElement.classList.add('active');
    }

    // Hide all tabs first
    document.getElementById('game-tab').classList.remove('active', 'mobile-view');
    document.getElementById('cornerstone-tab').classList.remove('active', 'mobile-view');
    document.getElementById('found-tab').classList.remove('active', 'mobile-view');

    // Show the selected tab
    switch(tabName) {
        case 'game':
            document.getElementById('game-tab').classList.add('active');
            break;
        case 'cornerstone':
            document.getElementById('cornerstone-tab').classList.add('active', 'mobile-view');
            break;
        case 'found':
            document.getElementById('found-tab').classList.add('active', 'mobile-view');
            break;
    }
}

// Instructions popup functions
export function showInstructions() {
    document.getElementById('instructions-popup').classList.add('show');
    document.getElementById('overlay').classList.add('show');
}

export function hideInstructions() {
    document.getElementById('instructions-popup').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');
}

// Definition popup functions
export function showDefinition(word, definition, isCornerstone = false) {
    document.getElementById('popup-word').textContent = word;
    document.getElementById('popup-definition').textContent = definition;
    
    const typeElement = document.getElementById('popup-type');
    if (isCornerstone) {
        typeElement.textContent = 'Cornerstone Word';
        typeElement.className = 'popup-type cornerstone';
    } else {
        typeElement.textContent = 'Regular Word';
        typeElement.className = 'popup-type';
    }
    
    document.getElementById('definition-popup').classList.add('show');
    document.getElementById('overlay').classList.add('show');
}

export function hideDefinition() {
    document.getElementById('definition-popup').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');
}

// Stats updates
export function updateStats(foundCount, cornerstoneCount, totalWords, hintsRemaining) {
    document.getElementById('words-found-count').textContent = foundCount;
    document.getElementById('cornerstone-count').textContent = cornerstoneCount;
    document.getElementById('total-words-count').textContent = totalWords;
    document.getElementById('hints-remaining').textContent = hintsRemaining;
    document.getElementById('hint-count-display').textContent = `${hintsRemaining} remaining`;
}

// Message display
export function showMessage(text, type = '') {
    const messageElement = document.getElementById('message');
    messageElement.textContent = text;
    messageElement.className = `message ${type}`;
    
    // Clear message after 3 seconds
    setTimeout(() => {
        if (messageElement.textContent === text) {
            messageElement.textContent = '';
            messageElement.className = 'message';
        }
    }, GAME_CONFIG.MESSAGE_TIMEOUT);
}

// Current word display
export function updateCurrentWord(word, type = '') {
    const wordElement = document.getElementById('current-word');
    wordElement.textContent = word;
    wordElement.className = `word-display ${type}`;
}

// Found words list update
export function updateFoundWordsList(foundWords, cornerstoneWords) {
    const cornerstoneList = document.getElementById('cornerstone-found-list');
    const regularList = document.getElementById('regular-found-list');
    
    // Clear both lists
    if (cornerstoneList) cornerstoneList.innerHTML = '';
    if (regularList) regularList.innerHTML = '';
    
    let cornerstoneCount = 0;
    let regularCount = 0;
    
    foundWords.forEach(word => {
        const wordElement = document.createElement('div');
        const isCornerstone = cornerstoneWords.includes(word);
        
        if (isCornerstone) {
            cornerstoneCount++;
            wordElement.className = 'found-word cornerstone';
            wordElement.textContent = word;
            wordElement.onclick = () => {
                if (window.game && typeof window.game.displayDefinitionPopup === 'function') {
                    window.game.displayDefinitionPopup(word, true);
                }
            };
            if (cornerstoneList) cornerstoneList.appendChild(wordElement);
        } else {
            regularCount++;
            wordElement.className = 'found-word regular';
            wordElement.textContent = word;
            wordElement.onclick = () => {
                if (window.game && typeof window.game.displayDefinitionPopup === 'function') {
                    window.game.displayDefinitionPopup(word, false);
                }
            };
            if (regularList) regularList.appendChild(wordElement);
        }
    });
    
    // Update the found count
    const foundCount = document.getElementById('found-count');
    if (foundCount) {
        const totalWords = cornerstoneCount + regularCount;
        foundCount.textContent = `${totalWords} word${totalWords !== 1 ? 's' : ''}`;
    }
}

// Cornerstone words progress update
export function updateCornerstoneProgress(foundCount, totalCount) {
    const progressText = document.getElementById('cornerstone-progress');
    progressText.textContent = `${foundCount}/${totalCount}`;
    
    const progressPercentage = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0;
    document.getElementById('progress-text').textContent = `${progressPercentage}%`;
    document.getElementById('progress-fill').style.width = `${progressPercentage}%`;
}

// Make functions available globally for onclick handlers
window.switchTab = switchTab;
window.showInstructions = showInstructions;
window.hideInstructions = hideInstructions;
window.hideDefinition = hideDefinition;