"use strict";

const runStarfire = require("../runStarfire");

expect.addSnapshotSerializer(require("../path-serializer"));

describe("throw error with invalid config format", () => {
  runStarfire("cli/config/invalid", ["--config", "file/.starfirerc"]).test({
    status: "non-zero"
  });
});

describe("throw error with invalid config target (directory)", () => {
  runStarfire("cli/config/invalid", [
    "--config",
    "folder/.starfirerc" // this is a directory
  ]).test({
    status: "non-zero"
  });
});

describe("throw error with invalid config option (int)", () => {
  runStarfire("cli/config/invalid", ["--config", "option/int"]).test({
    status: "non-zero"
  });
});

describe("throw error with invalid config option (trailingComma)", () => {
  runStarfire("cli/config/invalid", ["--config", "option/trailingComma"]).test({
    status: "non-zero"
  });
});

describe("throw error with invalid config precedence option (configPrecedence)", () => {
  runStarfire("cli/config/invalid", [
    "--config-precedence",
    "option/configPrecedence"
  ]).test({
    status: "non-zero"
  });
});

describe("show warning with unknown option", () => {
  runStarfire("cli/config/invalid", ["--config", "option/unknown"]).test({
    status: 0
  });
});

describe("show warning with kebab-case option key", () => {
  runStarfire("cli/config/invalid", ["--config", "option/kebab-case"]).test({
    status: 0
  });
});
