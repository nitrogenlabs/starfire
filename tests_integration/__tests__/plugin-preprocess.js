"use strict";

const runStarfire = require("../runStarfire");
const EOL = require("os").EOL;

describe("parser preprocess function is used to reshape input text", () => {
  runStarfire("plugins/preprocess", ["*.foo", "--plugin=./plugin"]).test({
    stdout: "preprocessed:contents" + EOL,
    stderr: "",
    status: 0,
    write: []
  });
});
