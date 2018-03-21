"use strict";

const runStarfire = require("../runStarfire");

describe("doesn't crash when --debug-check is passed", () => {
  runStarfire("cli/with-shebang", ["issue1890.js", "--debug-check"]).test({
    stdout: "issue1890.js\n",
    stderr: "",
    status: 0
  });
});

describe("checks stdin with --debug-check", () => {
  runStarfire("cli/with-shebang", ["--debug-check"], {
    input: "0"
  }).test({
    stdout: "(stdin)\n",
    stderr: "",
    status: 0
  });
});

describe("show diff for 2+ error files with --debug-check", () => {
  runStarfire("cli/debug-check", ["*.js", "--debug-check"]).test({
    status: "non-zero"
  });
});
