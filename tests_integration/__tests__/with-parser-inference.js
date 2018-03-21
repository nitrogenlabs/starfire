"use strict";

const runStarfire = require("../runStarfire");
const starfire = require("../../tests_config/require_starfire");

describe("infers postcss parser", () => {
  runStarfire("cli/with-parser-inference", ["*"]).test({
    status: 0
  });
});

describe("infers postcss parser with --list-different", () => {
  runStarfire("cli/with-parser-inference", ["--list-different", "*"]).test({
    status: 0
  });
});

describe("infers parser from filename", () => {
  test("json from .starfirerc", () => {
    expect(
      starfire.format("  {   }  ", {filepath: "x/y/.starfirerc"})
    ).toEqual("{}\n");
  });

  test("babylon from Jakefile", () => {
    expect(
      starfire.format("let foo = ( x = 1 ) => x", {filepath: "x/y/Jakefile"})
    ).toEqual("let foo = (x = 1) => x;\n");
  });
});
