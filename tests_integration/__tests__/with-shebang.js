"use strict";

const runStarfire = require("../runStarfire");

describe("preserves shebang", () => {
  runStarfire("cli/with-shebang", ["issue1890.js"]).test({
    status: 0
  });
});
