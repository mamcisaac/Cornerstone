# Cornerstones Tests

This directory contains the test suite for the Cornerstones word puzzle game.

## Directory Structure

```
tests/
├── unit/           # Unit tests for individual modules
├── integration/    # Integration tests for game features
├── fixtures/       # Test data and fixtures
├── original/       # Original test files (archived)
├── jest.config.js  # Jest configuration
├── setup.js        # Test setup and mocks
└── README.md       # This file
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --testPathPattern=unit

# Run in watch mode
npm test -- --watch
```

## Test Categories

### Unit Tests (`unit/`)
- **wordFinder.test.js**: Tests for word finding algorithms
- **ui.test.js**: Tests for UI utility functions
- **constants.test.js**: Tests for game constants validation

### Integration Tests (`integration/`)
- **game.test.js**: End-to-end game functionality tests
- **puzzle-validation.test.js**: Puzzle integrity tests
- **definition-system.test.js**: Definition fetching and display tests

### Fixtures (`fixtures/`)
- Test data files
- Sample word lists
- Mock puzzle configurations

## Writing Tests

### Unit Test Example

```javascript
import { WordFinder } from '../src/js/wordFinder.js';

describe('WordFinder', () => {
  let wordFinder;
  
  beforeEach(() => {
    const mockWordSet = new Set(['TEST', 'WORD', 'FIND']);
    wordFinder = new WordFinder(mockWordSet);
  });
  
  test('should find valid words in grid', () => {
    const grid = ['T', 'E', 'S', 'T', '', '', '', '', '', '', '', '', '', '', '', ''];
    const result = wordFinder.findAllWords(grid);
    expect(result.has('TEST')).toBe(true);
  });
});
```

### Integration Test Example  

```javascript
describe('Game Integration', () => {
  test('should complete puzzle when all cornerstone words found', async () => {
    // Setup game
    // Find all cornerstone words
    // Verify completion state
  });
});
```

## Test Data

Test fixtures include:
- Sample grids with known word patterns
- Mock definition responses
- Puzzle configurations for testing
- Word lists for validation

## Mocking

The test setup includes mocks for:
- `fetch` API for definition fetching
- `localStorage` for game state persistence
- Global game data sets
- Definition functions

## Coverage

Coverage reports are generated in the `coverage/` directory and include:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

Aim for >80% coverage on core game logic.