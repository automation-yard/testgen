module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.ts", "**/*.test.js"],
  collectCoverage: true,
  coverageReporters: ["text-summary", "lcov"],
  collectCoverageFrom: ["**/*.ts", "**/*.js"],
  roots: ["<rootDir>/src/sample-service"],
  transform: {
    "^.+\\.ts$": "ts-jest",
    "^.+\\.js$": "babel-jest",
  },
  moduleFileExtensions: ["ts", "js", "json", "node"],
};
