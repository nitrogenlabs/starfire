"use strict";

const starfire = require("../../tests_config/require_starfire");
const runStarfire = require("../runStarfire");

test("allows custom parser provided as object", () => {
  const output = starfire.format("1", {
    parser(text) {
      expect(text).toEqual("1");
      return {
        type: "Literal",
        value: 2,
        raw: "2"
      };
    }
  });
  expect(output).toEqual("2");
});

test("allows usage of starfire's supported parsers", () => {
  const output = starfire.format("foo ( )", {
    parser(text, parsers) {
      expect(typeof parsers.babylon).toEqual("function");
      const ast = parsers.babylon(text);
      ast.program.body[0].expression.callee.name = "bar";
      return ast;
    }
  });
  expect(output).toEqual("bar();\n");
});

describe("allows passing a string to resolve a parser", () => {
  runStarfire("./custom-parsers/", [
    "./custom-rename-input.js",
    "--parser",
    "./custom-rename-parser"
  ]).test({
    status: 0
  });
});
