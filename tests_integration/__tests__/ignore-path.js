"use strict";

const runStarfire = require("../runStarfire");

describe("ignore path", () => {
  runStarfire("cli/ignore-path", [
    "**/*.js",
    "--ignore-path",
    ".gitignore",
    "-l"
  ]).test({
    status: 1
  });
});

describe("support .starfireignore", () => {
  runStarfire("cli/ignore-path", ["**/*.js", "-l"]).test({
    status: 1
  });
});

describe("ignore file when using --debug-check", () => {
  runStarfire("cli/ignore-path", ["**/*.js", "--debug-check"]).test({
    status: 0
  });
});

describe("outputs files as-is if no --write", () => {
  runStarfire("cli/ignore-path", ["regular-module.js"]).test({
    status: 0
  });
});
