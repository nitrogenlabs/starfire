const ENABLE_COVERAGE = !!process.env.CI;

module.exports = {
  setupFiles: ["<rootDir>/tests_config/runSpec.ts"],
  snapshotSerializers: ["<rootDir>/tests_config/raw-serializer.ts"],
  testRegex: "jsfmt\\.spec\\.ts$|__tests__/.*\\.ts$",
  testPathIgnorePatterns: ["tests/new_react", "tests/more_react"],
  collectCoverage: ENABLE_COVERAGE,
  collectCoverageFrom: ["src/**/*.ts", "index.ts", "!<rootDir>/node_modules/"],
  coveragePathIgnorePatterns: [
    "<rootDir>/src/DocDebug.js",
    "<rootDir>/src/CleanAst.js",
    "<rootDir>/src/deprecated.js"
  ],
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "json"
  ],
  moduleNameMapper: {
    // Jest wires `fs` to `graceful-fs`, which causes a memory leak when
    // `graceful-fs` does `require('fs')`.
    // Ref: https://github.com/facebook/jest/issues/2179#issuecomment-355231418
    // If this is removed, see also rollup.bin.config.js and rollup.index.config.js.
    "graceful-fs": "<rootDir>/tests_config/fs.ts"
  },
  transform: {
    ".(ts|tsx)": "<rootDir>/node_modules/ts-jest/preprocessor.js"
  }
};
