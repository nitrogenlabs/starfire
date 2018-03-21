"use strict";

const runStarfire = require("../runStarfire");

describe("format correctly if stdin content compatible with stdin-filepath", () => {
  runStarfire(
    "cli",
    ["--stdin-filepath", "abc.css"],
    { input: ".name { display: none; }" } // css
  ).test({
    status: 0
  });
});

describe("throw error if stdin content incompatible with stdin-filepath", () => {
  runStarfire(
    "cli",
    ["--stdin-filepath", "abc.js"],
    { input: ".name { display: none; }" } // css
  ).test({
    status: "non-zero"
  });
});

describe("output file as-is if stdin-filepath matched patterns in ignore-path", () => {
  runStarfire("cli/stdin-ignore", ["--stdin-filepath", "ignore/example.js"], {
    input: "hello_world( );"
  }).test({
    stdout: "hello_world( );",
    status: 0
  });
});
