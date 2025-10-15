export default {
  testEnvironment: "node",
  transform: {},
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["json-summary", "lcov", "text", "clover"],
  coverageThreshold: { global: { lines: 80 } },
};

