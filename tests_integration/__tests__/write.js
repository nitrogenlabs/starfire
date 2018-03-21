"use strict";

const runStarfire = require("../runStarfire");

describe("write file with --write + unformatted file", () => {
  runStarfire("cli/write", ["--write", "unformatted.js"]).test({
    status: 0
  });
});

describe("do not write file with --write + formatted file", () => {
  runStarfire("cli/write", ["--write", "formatted.js"]).test({
    write: [],
    status: 0
  });
});

describe("do not write file with --write + invalid file", () => {
  runStarfire("cli/write", ["--write", "invalid.js"]).test({
    write: [],
    status: "non-zero"
  });
});
