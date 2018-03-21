"use strict";

const runStarfire = require("../runStarfire");

expect.addSnapshotSerializer(require("../path-serializer"));

describe("ignores node_modules by default", () => {
  runStarfire("cli/with-node-modules", ["**/*.js", "-l"]).test({
    status: 1
  });
});

describe("ignores node_modules by with ./**/*.js", () => {
  runStarfire("cli/with-node-modules", ["./**/*.js", "-l"]).test({
    status: 1
  });
});

describe("doesn't ignore node_modules with --with-node-modules flag", () => {
  runStarfire("cli/with-node-modules", [
    "**/*.js",
    "-l",
    "--with-node-modules"
  ]).test({
    status: 1
  });
});

describe("ignores node_modules by default for file list", () => {
  runStarfire("cli/with-node-modules", [
    "node_modules/node-module.js",
    "not_node_modules/file.js",
    "regular-module.js",
    "-l"
  ]).test({
    status: 1
  });
});

describe("doesn't ignore node_modules with --with-node-modules flag for file list", () => {
  runStarfire("cli/with-node-modules", [
    "node_modules/node-module.js",
    "not_node_modules/file.js",
    "regular-module.js",
    "-l",
    "--with-node-modules"
  ]).test({
    status: 1
  });
});
