export default {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/config.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['json-summary', 'lcov', 'text', 'clover'],
  coverageThreshold: { 
    global: { 
      lines: 80 
    } 
  },
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
};
