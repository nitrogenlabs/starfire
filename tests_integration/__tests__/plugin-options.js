"use strict";

const runStarfire = require("../runStarfire");
const snapshotDiff = require("snapshot-diff");

describe("show external options with `--help`", () => {
  const originalStdout = runStarfire("plugins/options", ["--help"]).stdout;
  const pluggedStdout = runStarfire("plugins/options", [
    "--help",
    "--plugin=./plugin"
  ]).stdout;
  expect(snapshotDiff(originalStdout, pluggedStdout)).toMatchSnapshot();
});

describe("show detailed external option with `--help foo-option`", () => {
  runStarfire("plugins/options", [
    "--plugin=./plugin",
    "--help",
    "foo-option"
  ]).test({
    status: 0
  });
});

describe("external options from CLI should work", () => {
  runStarfire(
    "plugins/options",
    [
      "--plugin=./plugin",
      "--stdin-filepath",
      "example.foo",
      "--foo-option",
      "baz"
    ],
    { input: "hello-world" }
  ).test({
    stdout: "foo:baz",
    stderr: "",
    status: 0,
    write: []
  });
});

describe("external options from config file should work", () => {
  runStarfire(
    "plugins/options",
    ["--config=./config.json", "--stdin-filepath", "example.foo"],
    { input: "hello-world" }
  ).test({
    stdout: "foo:baz",
    stderr: "",
    status: 0,
    write: []
  });
});
