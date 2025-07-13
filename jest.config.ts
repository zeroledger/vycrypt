import type { Config } from "jest";

const config: Config = {
  verbose: true,
  moduleFileExtensions: ["js", "json", "ts"],
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "@swc/jest",
  },
  collectCoverageFrom: ["<rootDir>/src/**/*.ts", "!<rootDir>/**/*.module.ts"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/src/(.+)/dto/(.+)",
    "<rootDir>/src/(.+)/(.+).module.ts",
    "<rootDir>/src/(.+).module.ts",
    "<rootDir>/src/main.ts",
    "<rootDir>/src/run.ts",
    "<rootDir>/src/config/",
    "<rootDir>/src/common/db/migrations/",
  ],
  coverageDirectory: "<rootDir>/coverage",
  testEnvironment: "node",
  modulePaths: ["<rootDir>", "<rootDir>/src"],
};

export default config;
