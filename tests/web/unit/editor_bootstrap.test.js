"use strict";

const test = require("node:test");
const { loadTypescriptTest } = require("./helpers/load_typescript_test");

test("editor bootstrap registry", () => {
  const { runEditorBootstrapTests } = loadTypescriptTest("tests/web/editor_bootstrap.test.ts");
  runEditorBootstrapTests();
});
