// Jest setup file for Cornerstones game tests

// Mock browser APIs that aren't available in jsdom
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock game data
global.COMPREHENSIVE_WORD_SET = new Set([
  'TEST', 'WORD', 'GAME', 'CORNER', 'STONE', 'NEST', 'REST'
]);

global.COMMON_WORDS_SET = new Set([
  'test', 'word', 'game', 'corner', 'stone'
]);

// Mock definitions
global.getDefinition = jest.fn().mockResolvedValue('A test definition');
global.getDefinitionSync = jest.fn().mockReturnValue('A test definition');

// Setup DOM if needed
beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  jest.clearAllMocks();
});