"use strict";

const runStarfire = require("../runStarfire");
const EOL = require("os").EOL;

describe("uses 'extensions' from languages to determine parser", () => {
  runStarfire("plugins/extensions", ["*.foo", "--plugin=./plugin"]).test({
    stdout: "!contents" + EOL,
    stderr: "",
    status: 0,
    write: []
  });
});
