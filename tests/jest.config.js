// Jest configuration for Cornerstones game tests

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/unit/**/*.test.js',
    '<rootDir>/integration/**/*.test.js'
  ],
  
  // Setup files - disable for Puppeteer tests
  // setupFilesAfterEnv: ['<rootDir>/setup.js'],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['html', 'text', 'lcov'],
  collectCoverageFrom: [
    '../src/js/**/*.js',
    '!../src/js/**/*.test.js'
  ],
  
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1'
  },
  
  // Transform files
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/archive/',
    '<rootDir>/tests/original/'
  ],
  
  // Verbose output
  verbose: true,
  
  // Test timeout for Puppeteer tests
  testTimeout: 60000
};