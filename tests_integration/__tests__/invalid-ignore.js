"use strict";

const runStarfire = require("../runStarfire");

expect.addSnapshotSerializer(require("../path-serializer"));

describe("throw error with invalid ignore", () => {
  runStarfire("cli/invalid-ignore", ["something.js"]).test({
    status: "non-zero"
  });
});
