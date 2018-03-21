"use strict";

const starfire = require("../../tests_config/require_starfire");
const runStarfire = require("../runStarfire");
const constant = require("../../src/cli/constant");
const util = require("../../src/cli/util");
const commonUtil = require("../../src/common/util");
const getSupportInfo = require("../../src/common/support").getSupportInfo;

describe("show version with --version", () => {
  runStarfire("cli/with-shebang", ["--version"]).test({
    stdout: starfire.version + "\n",
    status: 0
  });
});

describe("show usage with --help", () => {
  runStarfire("cli", ["--help"]).test({
    status: 0
  });
});

describe(`show detailed usage with --help l (alias)`, () => {
  runStarfire("cli", ["--help", "l"]).test({
    status: 0
  });
});

describe(`show detailed usage with plugin options (automatic resolution)`, () => {
  runStarfire("plugins/automatic", [
    "--help",
    "tab-width",
    "--parser=bar"
  ]).test({
    status: 0
  });
});

describe(`show detailed usage with plugin options (manual resolution)`, () => {
  runStarfire("cli", [
    "--help",
    "tab-width",
    "--plugin=../plugins/automatic/node_modules/starfire-plugin-bar",
    "--parser=bar"
  ]).test({
    status: 0
  });
});

commonUtil
  .arrayify(
    Object.assign(
      {},
      util.createDetailedOptionMap(
        getSupportInfo(null, {
          showDeprecated: true,
          showUnreleased: true,
          showInternal: true
        }).options
      ),
      util.normalizeDetailedOptionMap(constant.options)
    ),
    "name"
  )
  .forEach(option => {
    const optionNames = [
      option.description ? option.name : null,
      option.oppositeDescription ? `no-${option.name}` : null
    ].filter(Boolean);

    optionNames.forEach(optionName => {
      describe(`show detailed usage with --help ${optionName}`, () => {
        runStarfire("cli", ["--help", optionName]).test({
          status: 0
        });
      });
    });
  });

describe("show warning with --help not-found", () => {
  runStarfire("cli", ["--help", "not-found"]).test({
    status: 0
  });
});

describe("show warning with --help not-found (typo)", () => {
  runStarfire("cli", ["--help", "parserr"]).test({
    status: 0
  });
});

describe("throw error with --write + --debug-check", () => {
  runStarfire("cli", ["--write", "--debug-check"]).test({
    status: 1
  });
});

describe("throw error with --find-config-path + multiple files", () => {
  runStarfire("cli", ["--find-config-path", "abc.js", "def.js"]).test({
    status: 1
  });
});

describe("throw error and show usage with something unexpected", () => {
  runStarfire("cli", [], {isTTY: true}).test({
    status: "non-zero"
  });
});
