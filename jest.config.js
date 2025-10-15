export const collectCoverage = true;
export const coverageDirectory = "coverage";
export const coverageReporters = ["json-summary", "lcov", "text", "clover"];
export const coverageThreshold = {
  global: { lines: 80 },
};
export const testEnvironment = "node";
export const transform = {};
