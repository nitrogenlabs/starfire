"use strict";

const runStarfire = require("../runStarfire");

test("do not show logs with --loglevel silent", () => {
  runStarfireWithLogLevel("silent", null);
});

test("do not show warnings with --loglevel error", () => {
  runStarfireWithLogLevel("error", ["[error]"]);
});

test("show errors and warnings with --loglevel warn", () => {
  runStarfireWithLogLevel("warn", ["[error]", "[warn]"]);
});

test("show all logs with --loglevel debug", () => {
  runStarfireWithLogLevel("debug", ["[error]", "[warn]", "[debug]"]);
});

describe("--write with --loglevel=silent doesn't log filenames", () => {
  runStarfire("cli/write", [
    "--write",
    "unformatted.js",
    "--loglevel=silent"
  ]).test({
    status: 0
  });
});

function runStarfireWithLogLevel(logLevel, patterns) {
  const result = runStarfire("cli/loglevel", [
    "--loglevel",
    logLevel,
    "--unknown-option",
    "--parser",
    "unknown-parser",
    "not-found.js"
  ]);

  expect(result).not.toEqual(0);

  if (patterns) {
    patterns.forEach(pattern => {
      expect(result.stderr).toMatch(pattern);
    });
  } else {
    expect(result.stderr).toMatch(/^\s*$/);
  }
}
