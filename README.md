# Cornerstone - Daily Word Puzzle Game

A challenging word puzzle game where you find 4+ letter words in a cross-shaped grid. Each puzzle is generated from a 12-letter seed word placed along a Hamiltonian path.

## 🎮 Play Now

**[Play Cornerstone](https://mamcisaac.github.io/Cornerstone)**

## 🎯 How to Play

### Grid Layout
The game uses a unique cross-shaped grid with 12 playable cells:
```
    [·] [·] [·] [·]
    [·] --- --- [·]  
    [·] --- --- [·]
    [·] [·] [·] [·]
```
The corners are empty, leaving 12 cells arranged in a cross pattern.

### Rules
1. **Find Words**: Click and drag to select adjacent letters (including diagonals)
2. **Minimum Length**: Words must be 4+ letters long
3. **Valid Paths**: Each letter can only be used once per word
4. **Adjacent Cells**: Letters must be touching (including diagonally)
5. **Real Words**: Only valid English words with definitions are accepted

### Scoring
- **Simple System**: 1 point per letter in each word
- **4-letter word** = 4 points
- **5-letter word** = 5 points
- **Longer words** = more points!

## 🧩 Game Features

### Two Sample Puzzles
- **CORNERSTONES**: Features words like CORNER, STONE, STORE, NOTES, STERN
- **ARCHITECTURE**: Contains ARCH, TEACH, REACH, CREATURE, HEART
- Switch between puzzles using the "Switch Puzzle" button

### Interactive Elements  
- **Drag Selection**: Click and drag across letters to form words
- **Definition Popup**: Click any found word to see its definition
- **Progress Tracking**: See how many words you've found vs. total possible
- **Auto-Save**: Your progress is automatically saved in your browser

### Educational Value
Every word comes with a proper definition that doesn't use the root word:
- ❌ Bad: "CORNERS - Plural of corner" 
- ✅ Good: "CORNERS - Angular meeting points where surfaces intersect"

## 🔧 Technical Details

### Hamiltonian Paths
Each puzzle uses a Hamiltonian path - a route that visits every cell exactly once. This ensures:
- Interesting letter arrangements
- Consistent puzzle generation  
- Good word distribution across the grid

### Word Discovery Algorithm
The game uses depth-first search to find all possible words:
1. Start from each cell
2. Follow adjacent paths (including diagonals)
3. Check each 4+ letter combination against the dictionary
4. Pre-compute all valid words for instant validation

### No Backend Required
- **Pure JavaScript**: Runs entirely in your browser
- **No Server**: Hosted on GitHub Pages for free
- **Works Offline**: All game logic is client-side
- **Cross-Platform**: Works on desktop and mobile

## 🚀 Installation & Development

### Quick Start
1. Clone this repository
2. Open `index.html` in your browser
3. Start playing immediately!

### Hosting Your Own
1. Fork this repository
2. Enable GitHub Pages in Settings → Pages
3. Select "Deploy from a branch" → main
4. Your game will be available at `yourusername.github.io/Cornerstone`

### Customization
The game is built as a single HTML file with embedded CSS and JavaScript:
- Add new seed words to `SAMPLE_PUZZLES`
- Expand the word dictionary in `WORD_DEFINITIONS`
- Modify the grid layout or styling
- Add new Hamiltonian paths for variety

## 📱 Mobile Support

The game is fully responsive and works great on:
- Desktop computers (click and drag)
- Tablets (touch and drag)  
- Mobile phones (optimized touch targets)
- All modern browsers

## 🎨 Features

- ✅ **Cross-shaped grid** with proper corner removal
- ✅ **Two complete sample puzzles** ready to play
- ✅ **Quality definitions** without circular references
- ✅ **Smooth drag selection** with visual feedback
- ✅ **Progress persistence** across browser sessions
- ✅ **Responsive design** for all screen sizes
- ✅ **No dependencies** - pure HTML/CSS/JavaScript
- ✅ **Free hosting** via GitHub Pages

## 📝 Game Mechanics Deep Dive

### Seed Word Placement
1. Take a 12-letter word (e.g., "CORNERSTONES")
2. Choose a Hamiltonian path through the 12-cell cross
3. Place each letter along the path in sequence
4. This creates a unique, solvable puzzle

### Word Validation
1. Check path follows adjacency rules (including diagonals)
2. Verify word length is 4+ characters
3. Look up word in curated dictionary with definitions
4. Prevent duplicate submissions

### Example Words from CORNERSTONES:
- **CORNER** (6 letters, 6 points) - "The place where two lines meet at an angle"
- **STONE** (5 letters, 5 points) - "Hard solid mineral matter formed naturally"
- **NOTES** (5 letters, 5 points) - "Brief written records or musical sounds of definite pitch"
- **STERN** (5 letters, 5 points) - "Serious and uncompromising in manner or approach"

Perfect for friends and family - just share the URL and start playing together!