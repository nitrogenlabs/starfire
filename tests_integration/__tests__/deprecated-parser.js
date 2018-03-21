"use strict";

const starfire = require("../../tests_config/require_starfire");

let warnings = "";

beforeAll(() => {
  jest
    .spyOn(console, "warn")
    .mockImplementation(text => (warnings += text + "\n"));
});

beforeEach(() => {
  warnings = "";
});

afterAll(() => {
  jest.restoreAllMocks();
});

test("API format with deprecated parser should work", () => {
  expect(() =>
    starfire.format("body { color: #131313; }", {parser: "postcss"})
  ).not.toThrowError();
  expect(warnings).toMatchSnapshot();
});
