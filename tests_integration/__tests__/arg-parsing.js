"use strict";

const runStarfire = require("../runStarfire");

describe("boolean flags do not swallow the next argument", () => {
  runStarfire("cli/arg-parsing", ["--single-quote", "file.js"]).test({
    status: 0
  });
});

describe("negated options work", () => {
  runStarfire("cli/arg-parsing", ["--no-semi", "file.js"]).test({
    status: 0
  });
});

describe("unknown options are warned", () => {
  runStarfire("cli/arg-parsing", ["file.js", "--unknown"]).test({
    status: 0
  });
});

describe("unknown negated options are warned", () => {
  runStarfire("cli/arg-parsing", ["file.js", "--no-unknown"]).test({
    status: 0
  });
});

describe("deprecated options are warned", () => {
  runStarfire("cli/arg-parsing", ["file.js", "--flow-parser"]).test({
    status: 0
  });
});

describe("deprecated option values are warned", () => {
  runStarfire("cli/arg-parsing", ["file.js", "--trailing-comma"]).test({
    status: 0
  });
});
