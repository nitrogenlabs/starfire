"use strict";

const runStarfire = require("../runStarfire");

describe("checks stdin with --list-different", () => {
  runStarfire("cli/with-shebang", ["--list-different"], {
    input: "0"
  }).test({
    stdout: "(stdin)\n",
    stderr: "",
    status: "non-zero"
  });
});
