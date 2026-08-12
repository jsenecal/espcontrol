"use strict";

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadTypescriptTest } = require("./helpers/load_typescript_test");

const ROOT = path.resolve(__dirname, "../../..");

describe("browserless application contracts", () => {
  const { runClipboardFeatureTests } = loadTypescriptTest("tests/web/clipboard_feature.test.ts");
  const { runApplicationContextTests } = loadTypescriptTest("tests/web/application_context.test.ts");
  const { runDeviceApiTests } = loadTypescriptTest("tests/web/device_api.test.ts");
  const { runSettingsFeatureTests } = loadTypescriptTest("tests/web/settings_feature.test.ts");
  const { runStateContractTests } = loadTypescriptTest("tests/web/state_contract.test.ts");

  test("plans clipboard transfers", () => {
    runClipboardFeatureTests();
  });

  test("owns browser composition and compatibility layout state", () => {
    runApplicationContextTests();
  });

  test("registers migrated sensor and switch cards through the typed registry", () => {
    for (const relativePath of ["src/webserver/cards/sensor.ts", "src/webserver/cards/switch.ts"]) {
      const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
      assert.match(source, /registry\.register\(/, `${relativePath} should use the typed card registry`);
      assert.doesNotMatch(source, /\bregisterButtonType\s*\(/, `${relativePath} should not read ambient registration state`);
    }
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    assert.match(entry, /registerSensorCardTypes\(registry\)/);
    assert.match(entry, /registerSwitchCardTypes\(registry\)/);
  });

  test("preserves settings normalization", () => {
    runSettingsFeatureTests();
  });

  test("preserves state and event aliases", () => {
    runStateContractTests();
  });

  test("preserves request fallback and ordering", async () => {
    await runDeviceApiTests();
  });
});
