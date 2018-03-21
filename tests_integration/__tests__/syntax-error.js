"use strict";

const runStarfire = require("../runStarfire");

describe("exits with non-zero code when input has a syntax error", () => {
  runStarfire("cli/with-shebang", ["--stdin"], {
    input: "a.2"
  }).test({
    status: 2
  });
});
