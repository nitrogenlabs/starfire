"use strict";

const path = require("path");
const runStarfire = require("../runStarfire");

describe("support absolute filename", () => {
  runStarfire("cli/ignore-absolute-path", [
    path.resolve(__dirname, "../cli/ignore-absolute-path/ignored/module.js"),
    path.resolve(__dirname, "../cli/ignore-absolute-path/depth1/ignored/*.js"),
    path.resolve(__dirname, "../cli/ignore-absolute-path/regular-module.js"),
    "-l"
  ]).test({
    status: 1
  });
});
