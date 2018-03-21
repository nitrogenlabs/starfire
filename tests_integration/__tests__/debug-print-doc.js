"use strict";

const runStarfire = require("../runStarfire");

describe("prints doc with --debug-print-doc", () => {
  runStarfire("cli/with-shebang", ["--debug-print-doc"], {
    input: "0"
  }).test({
    stdout: '["0", ";", hardline, breakParent];\n',
    stderr: "",
    status: 0
  });
});
