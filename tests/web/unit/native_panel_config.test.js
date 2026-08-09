const test = require("node:test");
const { loadTypescriptTest } = require("./helpers/load_typescript_test");

test("native PanelConfig migration client", async () => {
  const { runNativePanelConfigTests } = loadTypescriptTest("tests/web/native_panel_config.test.ts");
  await runNativePanelConfigTests();
});
