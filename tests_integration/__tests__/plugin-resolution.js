"use strict";

const runStarfire = require("../runStarfire");
const EOL = require("os").EOL;

describe("automatically loads 'starfire-plugin-*' from package.json devDependencies", () => {
  runStarfire("plugins/automatic", ["file.txt", "--parser=foo"]).test({
    stdout: "foo+contents" + EOL,
    stderr: "",
    status: 0,
    write: []
  });
});

describe("automatically loads '@starfire/plugin-*' from package.json dependencies", () => {
  runStarfire("plugins/automatic", ["file.txt", "--parser=bar"]).test({
    stdout: "bar+contents" + EOL,
    stderr: "",
    status: 0,
    write: []
  });
});
