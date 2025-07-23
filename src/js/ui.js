// UI utilities and mobile tab switching

// Mobile tab switching
export function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    if (tabName === 'game') {
        document.getElementById('game-tab').classList.add('active');
        document.getElementById('cornerstone-tab').classList.remove('active');
        document.getElementById('cornerstone-tab').classList.remove('mobile-view');
    } else {
        document.getElementById('game-tab').classList.remove('active');
        document.getElementById('cornerstone-tab').classList.add('active');
        document.getElementById('cornerstone-tab').classList.add('mobile-view');
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
    }, 3000);
}

// Current word display
export function updateCurrentWord(word, type = '') {
    const wordElement = document.getElementById('current-word');
    wordElement.textContent = word;
    wordElement.className = `word-display ${type}`;
}

// Found words list update
export function updateFoundWordsList(foundWords, cornerstoneWords) {
    const listElement = document.getElementById('found-words-list');
    listElement.innerHTML = '';
    
    foundWords.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = cornerstoneWords.includes(word) ? 'found-word cornerstone' : 'found-word regular';
        wordElement.textContent = word;
        wordElement.onclick = () => {
            // Show definition when clicked
            const definition = window.getDefinitionSync ? window.getDefinitionSync(word) : 'Definition not available';
            showDefinition(word, definition, cornerstoneWords.includes(word));
        };
        listElement.appendChild(wordElement);
    });
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