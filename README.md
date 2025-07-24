# Cornerstones - Word Puzzle Game

A web-based word puzzle game where players find words by connecting adjacent letters in a cross-shaped grid.

## 🎯 How to Play

1. **Objective**: Find all the cornerstone words hidden in the letter grid
2. **Word Formation**: Connect adjacent letters (including diagonally) to form words
3. **Minimum Length**: Words must be at least 4 letters long
4. **Completion**: Discover every cornerstone word to complete the puzzle

## 🎮 Controls

- **Mouse/Trackpad**: Click and drag to select letters
- **Keyboard**: Use arrow keys to navigate, Space to select/deselect, Enter to submit
- **Touch**: Tap and drag across letters on mobile devices

## 🏗️ Project Structure

```
cornerstone/
├── src/                    # Main source code
│   ├── index.html         # Main game file
│   ├── css/               # Stylesheets
│   │   ├── variables.css  # CSS custom properties
│   │   ├── main.css       # Main styles
│   │   └── animations.css # Animation keyframes
│   ├── js/                # JavaScript modules
│   │   ├── constants.js   # Game constants
│   │   ├── ui.js          # UI utilities
│   │   ├── wordFinder.js  # Word finding logic
│   │   └── game.js        # Main game class
│   └── data/              # Game data files
│       ├── words-database.js
│       ├── common-definitions.js
│       └── keystone-words.js
├── scripts/               # Utility scripts
│   └── definition-fetcher.js  # Consolidated definition fetcher
├── tests/                 # Test files
├── archive/               # Archived/deprecated files
└── docs/                  # Documentation
```

## 🚀 Getting Started

### Development Server
```bash
# Start development server on http://localhost:8080
npm run dev

# Alternative commands
npm run serve
npm start
```

### Direct File Access
1. **Local Development**: Open `index.html` in a web browser
2. **Web Server**: Serve the root directory with any web server

## 🛠️ Development Tools

### Available Scripts
```bash
# Development server
npm run dev                    # Start development server
npm run serve                  # Alternative server command
npm start                      # Standard start command

# Testing
npm test                       # Run test suite
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Run tests with coverage report

# Utilities
npm run fetch-definitions     # Show definition fetcher help
npm run validate-puzzles      # Validate all puzzle definitions
npm run lint                  # Code quality checks (install ESLint first)
npm run build                 # Build for production (placeholder)
```

### Definition Fetcher

The consolidated definition fetcher supports multiple modes:

```bash
# Fetch definitions for all puzzles
node scripts/definition-fetcher.js --all-puzzles --verbose

# Fetch for specific puzzle
node scripts/definition-fetcher.js --single-puzzle --puzzle CORNERSTONES

# Find and fill missing definitions
node scripts/definition-fetcher.js --missing-only

# Validate existing definitions
node scripts/definition-fetcher.js --validate
```

## 🎲 Available Puzzles

1. **CORNERSTONES** - The original puzzle
2. **AVAILABILITY** - Concepts and states
3. **EXPERIMENTAL** - Science and testing
4. **TECHNOLOGIES** - Modern innovations
5. **CHAMPIONSHIP** - Competition and sports
6. **UNIVERSITIES** - Education and learning
7. **NEIGHBORHOOD** - Community and places
8. **THANKSGIVING** - Gratitude and celebration
9. **ENCYCLOPEDIA** - Knowledge and reference
10. **BREAKTHROUGH** - Achievement and progress

## 🎨 Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Keyboard Navigation**: Full keyboard support with arrow keys
- **Hint System**: Three types of hints to help players
- **Progress Tracking**: Visual progress indicators
- **Definition Lookup**: Click words to see their definitions
- **Multiple Puzzles**: Switch between 10 different puzzles

## 🧪 Testing

Test files are organized in the `tests/` directory. The game includes:
- Word finding algorithm tests
- Puzzle validation tests
- UI interaction tests

## 📝 License

This project is open source. See the repository for license details.

## 🤝 Contributing

Contributions are welcome! Please see the development guide in `/docs/` for more information.