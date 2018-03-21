"use strict";

const runStarfire = require("../runStarfire");

expect.addSnapshotSerializer(require("../path-serializer"));

describe("skips folders in glob", () => {
  runStarfire("cli/skip-folders", ["**/*", "-l"]).test({
    status: 1,
    stderr: ""
  });
});

describe("skip folders passed specifically", () => {
  runStarfire("cli/skip-folders", [
    "a",
    "a/file.js",
    "b",
    "b/file.js",
    "-l"
  ]).test({ status: 1, stderr: "" });
});
