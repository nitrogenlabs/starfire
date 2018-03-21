"use strict";

const path = require("path");

const runStarfire = require("../runStarfire");
const starfire = require("../../tests_config/require_starfire");

expect.addSnapshotSerializer(require("../path-serializer"));

describe("resolves configuration from external files", () => {
  runStarfire("cli/config/", ["**/*.js"]).test({
    status: 0
  });
});

describe("resolves configuration from external files and overrides by extname", () => {
  runStarfire("cli/config/", ["**/*.ts"]).test({
    status: 0
  });
});

describe("accepts configuration from --config", () => {
  runStarfire("cli/config/", ["--config", ".starfirerc", "./js/file.js"]).test({
    status: 0
  });
});

describe("resolves configuration file with --find-config-path file", () => {
  runStarfire("cli/config/", ["--find-config-path", "no-config/file.js"]).test({
    status: 0
  });
});

describe("resolves json configuration file with --find-config-path file", () => {
  runStarfire("cli/config/", ["--find-config-path", "rc-json/file.js"]).test({
    status: 0
  });
});

describe("resolves yaml configuration file with --find-config-path file", () => {
  runStarfire("cli/config/", ["--find-config-path", "rc-yaml/file.js"]).test({
    status: 0
  });
});

describe("prints nothing when no file found with --find-config-path", () => {
  runStarfire("cli/config/", ["--find-config-path", ".."]).test({
    stdout: "",
    status: 1
  });
});

describe("CLI overrides take precedence", () => {
  runStarfire("cli/config/", ["--print-width", "1", "**/*.js"]).test({
    status: 0
  });
});

test("API resolveConfig with no args", () => {
  return starfire.resolveConfig().then(result => {
    expect(result).toBeNull();
  });
});

test("API resolveConfig.sync with no args", () => {
  expect(starfire.resolveConfig.sync()).toBeNull();
});

test("API resolveConfig with file arg", () => {
  const file = path.resolve(path.join(__dirname, "../cli/config/js/file.js"));
  return starfire.resolveConfig(file).then(result => {
    expect(result).toMatchObject({
      tabWidth: 8
    });
  });
});

test("API resolveConfig.sync with file arg", () => {
  const file = path.resolve(path.join(__dirname, "../cli/config/js/file.js"));
  expect(starfire.resolveConfig.sync(file)).toMatchObject({
    tabWidth: 8
  });
});

test("API resolveConfig with file arg and extension override", () => {
  const file = path.resolve(
    path.join(__dirname, "../cli/config/no-config/file.ts")
  );
  return starfire.resolveConfig(file).then(result => {
    expect(result).toMatchObject({
      semi: true
    });
  });
});

test("API resolveConfig.sync with file arg and extension override", () => {
  const file = path.resolve(
    path.join(__dirname, "../cli/config/no-config/file.ts")
  );
  expect(starfire.resolveConfig.sync(file)).toMatchObject({
    semi: true
  });
});

test("API resolveConfig with file arg and .editorconfig", () => {
  const file = path.resolve(
    path.join(__dirname, "../cli/config/editorconfig/file.js")
  );
  return starfire.resolveConfig(file, {editorconfig: true}).then(result => {
    expect(result).toMatchObject({
      useTabs: true,
      tabWidth: 8,
      printWidth: 100
    });
  });
});

test("API resolveConfig.sync with file arg and .editorconfig", () => {
  const file = path.resolve(
    path.join(__dirname, "../cli/config/editorconfig/file.js")
  );

  expect(starfire.resolveConfig.sync(file)).toMatchObject({
    semi: false
  });

  expect(
    starfire.resolveConfig.sync(file, {editorconfig: true})
  ).toMatchObject({
    useTabs: true,
    tabWidth: 8,
    printWidth: 100
  });
});

test("API resolveConfig with nested file arg and .editorconfig", () => {
  const file = path.resolve(
    path.join(__dirname, "../cli/config/editorconfig/lib/file.js")
  );
  return starfire.resolveConfig(file, {editorconfig: true}).then(result => {
    expect(result).toMatchObject({
      useTabs: false,
      tabWidth: 2,
      printWidth: 100
    });
  });
});

test("API resolveConfig.sync with nested file arg and .editorconfig", () => {
  const file = path.resolve(
    path.join(__dirname, "../cli/config/editorconfig/lib/file.js")
  );

  expect(starfire.resolveConfig.sync(file)).toMatchObject({
    semi: false
  });

  expect(
    starfire.resolveConfig.sync(file, {editorconfig: true})
  ).toMatchObject({
    useTabs: false,
    tabWidth: 2,
    printWidth: 100
  });
});

test("API resolveConfig with nested file arg and .editorconfig and indent_size = tab", () => {
  const file = path.resolve(
    path.join(__dirname, "../cli/config/editorconfig/lib/indent_size=tab.js")
  );
  return starfire.resolveConfig(file, {editorconfig: true}).then(result => {
    expect(result).toMatchObject({
      useTabs: false,
      tabWidth: 8,
      printWidth: 100
    });
  });
});

test("API resolveConfig.sync with nested file arg and .editorconfig and indent_size = tab", () => {
  const file = path.resolve(
    path.join(__dirname, "../cli/config/editorconfig/lib/indent_size=tab.js")
  );

  expect(starfire.resolveConfig.sync(file)).toMatchObject({
    semi: false
  });

  expect(
    starfire.resolveConfig.sync(file, {editorconfig: true})
  ).toMatchObject({
    useTabs: false,
    tabWidth: 8,
    printWidth: 100
  });
});

test("API clearConfigCache", () => {
  expect(() => starfire.clearConfigCache()).not.toThrowError();
});

test("API resolveConfig.sync overrides work with absolute paths", () => {
  // Absolute path
  const file = path.join(__dirname, "../cli/config/filepath/subfolder/file.js");
  expect(starfire.resolveConfig.sync(file)).toMatchObject({
    tabWidth: 6
  });
});

test("API resolveConfig removes $schema option", () => {
  const file = path.resolve(
    path.join(__dirname, "../cli/config/$schema/index.js")
  );
  return starfire.resolveConfig(file).then(result => {
    expect(result).toEqual({
      tabWidth: 42
    });
  });
});

test("API resolveConfig.sync removes $schema option", () => {
  const file = path.resolve(
    path.join(__dirname, "../cli/config/$schema/index.js")
  );
  expect(starfire.resolveConfig.sync(file)).toEqual({
    tabWidth: 42
  });
});
