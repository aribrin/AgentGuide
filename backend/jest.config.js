const { createDefaultPreset } = require("ts-jest");
const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },

  // Recognize all test files in the tests folder
  testMatch: ["**/tests/**/*.test.ts"],

  // Load environment variables from .env.test automatically
  setupFiles: ["dotenv/config"],

  // Run DB setup/cleanup before and after test suites
  setupFilesAfterEnv: ["<rootDir>/tests/setupTestDB.ts"],

  // Optional: clearer test output and performance in CI
  verbose: true,
  maxWorkers: 1, // runInBand equivalent; ensures sequential test execution
};
