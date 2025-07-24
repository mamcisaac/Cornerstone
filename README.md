# Cornerstones - Word Puzzle Game

A challenging word puzzle game where you find words by connecting adjacent letters in a cross-shaped grid.

## 🎮 How to Play

1. **Objective**: Find all the cornerstone words hidden in the letter grid
2. **Word Formation**: Connect adjacent letters (including diagonally) to form words
3. **Minimum Length**: Words must be at least 4 letters long
4. **Completion**: Discover every cornerstone word to complete the puzzle

## 🚀 Getting Started

### Play the Game
Open `index.html` in a web browser or serve the directory with a web server:

```bash
# Using Python (from the root directory)
python3 -m http.server 8080
# Then visit http://localhost:8080

# Using Node.js
npx serve .
```

### Development Server
```bash
npm run dev    # Start development server
npm start      # Alternative start command
```

## 📁 Project Structure

```
cornerstone/
├── index.html              # Main game file
├── package.json            # Dependencies and scripts
├── eslint.config.js        # Code linting configuration
├── src/                    # Core game source code
│   ├── css/               # Stylesheets
│   │   ├── variables.css  # CSS custom properties
│   │   ├── main.css       # Main styles
│   │   └── animations.css # Animation keyframes
│   ├── js/                # JavaScript modules
│   │   ├── constants.js   # Game constants and puzzles
│   │   ├── config.js      # Game configuration
│   │   ├── game.js        # Main game logic
│   │   ├── hints.js       # Hint system
│   │   ├── logger.js      # Logging utilities
│   │   ├── main.js        # Application entry point
│   │   ├── ui.js          # User interface functions
│   │   └── wordFinder.js  # Word finding algorithms
│   └── data/              # Game data files
│       ├── cornerstone-words.js    # Common words list
│       ├── keystone-words.js       # 12-letter seed words
│       ├── word-definitions.js     # Word definitions
│       ├── words-database.json     # Word validation database
│       └── words-database-init.js  # Database initialization
├── scripts/               # Development and utility scripts
│   ├── generate-puzzles.js          # Main puzzle generation
│   ├── create-smart-puzzles.js      # Advanced puzzle creation
│   ├── clean-word-database.js       # Database maintenance
│   ├── remove-offensive-words.js    # Content filtering
│   └── [other utility scripts]
└── output/                # Generated files and reports
    └── [puzzle creation outputs]
```

## 🎯 Available Games

The game includes **12 valid puzzles** ready to play:

1. **ARCHITECTURE**
2. **BREAKTHROUGH**  
3. **CORNERSTONES**
4. **DEVELOPMENTS**
5. **ENCYCLOPEDIA**
6. **EXPERIMENTAL**
7. **PRESENTATION**
8. **PROFESSIONAL**
9. **REGISTRATION**
10. **RELATIONSHIP**
11. **THANKSGIVING**
12. **UNIVERSITIES**

## 🛠️ Development

### Scripts
```bash
# Puzzle generation
node scripts/generate-puzzles.js

# Database maintenance
node scripts/clean-word-database.js
node scripts/remove-offensive-words.js

# Advanced puzzle creation
node scripts/create-smart-puzzles.js
```

### Code Quality
- ESLint configuration for code consistency
- Modular JavaScript architecture
- Clean separation of concerns

## 🎨 Features

- **Cross-shaped Grid**: Unique 12-cell puzzle layout
- **Multiple Puzzles**: Switch between different challenges
- **Hint System**: Get help when stuck
- **Definition Lookup**: Learn word meanings
- **Progress Tracking**: Visual progress indicators
- **Responsive Design**: Works on desktop and mobile
- **Offline Ready**: No server required

## 📱 Mobile Support

The game is fully responsive with:
- Touch-friendly interface
- Optimized layouts for different screen sizes
- Mobile-specific UI enhancements

## 🏗️ Technical Details

- **Pure JavaScript**: No frameworks, runs entirely in browser
- **ES6 Modules**: Modern JavaScript module system
- **Efficient Algorithms**: Fast word finding and validation
- **Comprehensive Dictionary**: 370k+ words with definitions
- **Hamiltonian Path Generation**: Mathematical puzzle layouts

## 📝 License

This project is open source and available under standard licensing terms.