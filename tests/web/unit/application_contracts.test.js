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

  test("registers migrated card families through the typed registry", () => {
    const migratedCards = [
      ["sensor", "registerSensorCardTypes"],
      ["switch", "registerSwitchCardTypes"],
      ["clock", "registerClockCardTypes"],
      ["door_window", "registerDoorWindowCardTypes"],
      ["image", "registerImageCardTypes"],
      ["internal", "registerInternalCardTypes"],
      ["lawn_mower", "registerLawnMowerCardTypes"],
      ["presence", "registerPresenceCardTypes"],
      ["push", "registerPushCardTypes"],
      ["screen_lock", "registerScreenLockCardTypes"],
      ["timezone", "registerTimezoneCardTypes"],
      ["weather_forecast", "registerWeatherForecastCardTypes"],
      ["webhook", "registerWebhookCardTypes"],
      ["action", "registerActionCardTypes"],
      ["alarm", "registerAlarmCardTypes"],
      ["calendar", "registerCalendarCardTypes"],
      ["climate", "registerClimateCardTypes"],
      ["fan", "registerFanCardTypes"],
      ["light_temperature", "registerLightTemperatureCardTypes"],
      ["lock", "registerLockCardTypes"],
      ["media", "registerMediaCardTypes"],
      ["slider", "registerSliderCardTypes"],
      ["subpage", "registerSubpageCardTypes"],
      ["vacuum", "registerVacuumCardTypes"],
      ["weather", "registerWeatherCardTypes"],
    ];
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    for (const [fileName, registrationFunction] of migratedCards) {
      const relativePath = `src/webserver/cards/${fileName}.ts`;
      const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
      assert.match(source, /registry\.register\(/, `${relativePath} should use the typed card registry`);
      assert.doesNotMatch(source, /\bregisterButtonType\s*\(/, `${relativePath} should not read ambient registration state`);
      assert.match(entry, new RegExp(
        `${registrationFunction}\\(\\s*registry(?:,\\s*context\\.configuration\\.[A-Za-z]+)*,?\\s*\\)`,
      ));
    }
  });

  test("registers garage and gate through the explicit cover-card factory", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const coverFactory = fs.readFileSync(path.join(ROOT, "src/webserver/cards/cover_like_card.ts"), "utf8");
    assert.match(coverFactory, /registry\.register\(config\.type/);
    assert.doesNotMatch(coverFactory, /\bregisterButtonType\s*\(/);
    assert.match(entry, /registerGarageCardTypes\(\s*coverLikeCards\.register,\s*context\.configuration\.accessClimateAlarm,\s*context\.configuration\.confirmationOptions,?\s*\)/);
    assert.match(entry, /registerGateCardTypes\(\s*coverLikeCards\.register,\s*context\.configuration\.accessClimateAlarm,?\s*\)/);
    assert.doesNotMatch(entry, /registerCoverLikeCardType/);
  });

  test("injects the card registry into editor and preview consumers", () => {
    const consumers = [
      "src/webserver/application/button_settings.ts",
      "src/webserver/application/config_codec.ts",
      "src/webserver/application/config_sensor_options.ts",
      "src/webserver/application/controls_fields.ts",
      "src/webserver/application/preview_clipboard.ts",
      "src/webserver/application/preview_context_menu.ts",
      "src/webserver/application/preview_render.ts",
      "src/webserver/testing/app_test_hooks_config.ts",
      "src/webserver/testing/app_test_hooks_preview.ts",
    ];
    for (const relativePath of consumers) {
      const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
      assert.doesNotMatch(source, /\bBUTTON_TYPES\b/, `${relativePath} should use the injected registry`);
    }
    const core = fs.readFileSync(path.join(ROOT, "src/webserver/application/core.ts"), "utf8");
    assert.doesNotMatch(core, /["']BUTTON_TYPES["']/);
  });

  test("owns sensor and status-card options in the application context", () => {
    const options = fs.readFileSync(path.join(ROOT, "src/webserver/application/config_sensor_options.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    assert.match(options, /createConfigSensorOptionsFeature/);
    assert.doesNotMatch(options, /\b(?:staticGlobal|liveGlobal|GlobalDescriptors)\b/);
    assert.doesNotMatch(entry, /installConfigSensorOptionsModule/);
    assert.match(entry, /configurationOptions = createConfigSensorOptionsFeature\(cards\)/);
  });

  test("imports shared option contracts without installing globals", () => {
    const core = fs.readFileSync(path.join(ROOT, "src/webserver/application/config_option_core.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    assert.doesNotMatch(core, /\b(?:staticGlobal|liveGlobal|GlobalDescriptors)\b/);
    assert.doesNotMatch(entry, /installConfigOptionCoreModule/);
    assert.match(core, /from "\.\.\/model\/config_primitives"/);
    assert.match(core, /export \{/);
  });

  test("imports action-card option storage without mutable globals", () => {
    const contract = fs.readFileSync(path.join(ROOT, "src/webserver/application/config_action_contract.ts"), "utf8");
    const card = fs.readFileSync(path.join(ROOT, "src/webserver/cards/action.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.match(contract, /export const ACTION_CARD_LOCAL_ACTION/);
    assert.match(card, /from "\.\.\/application\/config_action_contract"/);
    assert.doesNotMatch(card, /liveGlobal\(\(\) => ACTION_CARD_(?:LOCAL_ACTION|OPTION_SELECT_ACTION|STATE_)/);
    assert.doesNotMatch(globals, /var ACTION_CARD_(?:LOCAL_ACTION|OPTION_SELECT_ACTION|STATE_)/);
  });

  test("imports cover mode and position rules without card globals", () => {
    const contract = fs.readFileSync(path.join(ROOT, "src/webserver/application/config_cover_contract.ts"), "utf8");
    const card = fs.readFileSync(path.join(ROOT, "src/webserver/cards/slider.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.match(contract, /export function normalizeCoverMode/);
    assert.match(card, /from "\.\.\/application\/config_cover_contract"/);
    assert.doesNotMatch(card, /staticGlobal\((?:coverCommandMode|coverModeOptionValues|normalizeCoverMode|coverModeOptionsForSettings|normalizeCoverPosition)\)/);
    assert.doesNotMatch(globals, /var (?:coverCommandMode|coverModeOptionValues|normalizeCoverMode|coverModeOptionsForSettings|normalizeCoverPosition)/);
  });

  test("imports subpage option behavior without installing globals", () => {
    const options = fs.readFileSync(path.join(ROOT, "src/webserver/application/config_subpage_options.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    assert.doesNotMatch(options, /\b(?:staticGlobal|liveGlobal|GlobalDescriptors)\b/);
    assert.doesNotMatch(entry, /installConfigSubpageOptionsModule/);
    assert.match(options, /from "\.\.\/model\/config_primitives"/);
  });

  test("owns media option behavior in the application context", () => {
    const options = fs.readFileSync(path.join(ROOT, "src/webserver/application/config_media_options.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    assert.match(options, /createConfigMediaOptionsFeature/);
    assert.doesNotMatch(options, /\b(?:staticGlobal|liveGlobal|GlobalDescriptors)\b/);
    assert.doesNotMatch(entry, /installConfigMediaOptionsModule/);
    assert.match(entry, /mediaConfigurationOptions = createConfigMediaOptionsFeature\(layout\.config\)/);
    assert.match(options, /from "\.\.\/model\/config_primitives"/);
  });

  test("owns image capacity and option behavior in the application context", () => {
    const options = fs.readFileSync(path.join(ROOT, "src/webserver/application/config_image_options.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    assert.match(options, /createConfigImageOptionsFeature/);
    assert.doesNotMatch(options, /\b(?:staticGlobal|liveGlobal|GlobalDescriptors)\b/);
    assert.doesNotMatch(entry, /installConfigImageOptionsModule/);
    assert.match(entry, /imageConfigurationOptions = createConfigImageOptionsFeature/);
    assert.match(options, /connectSubpageParser/);
  });

  test("owns modal-tab behavior in the application context", () => {
    const options = fs.readFileSync(path.join(ROOT, "src/webserver/application/config_modal_tab_options.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    assert.match(options, /createConfigModalTabOptionsFeature/);
    assert.doesNotMatch(options, /\b(?:staticGlobal|liveGlobal|GlobalDescriptors)\b/);
    assert.doesNotMatch(entry, /installConfigModalTabOptionsModule/);
    assert.match(entry, /modalTabOptions = createConfigModalTabOptionsFeature/);
    assert.match(options, /from "\.\.\/model\/config_primitives"/);
  });

  test("owns access, climate, and alarm options in the application context", () => {
    const options = fs.readFileSync(path.join(ROOT, "src/webserver/application/config_access_climate_alarm_options.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    assert.match(options, /createConfigAccessClimateAlarmOptionsFeature/);
    assert.doesNotMatch(options, /\b(?:staticGlobal|liveGlobal|GlobalDescriptors)\b/);
    assert.doesNotMatch(entry, /installConfigAccessClimateAlarmOptionsModule/);
    assert.match(entry, /accessClimateAlarmOptions = createConfigAccessClimateAlarmOptionsFeature/);
    assert.match(options, /connectGarageConfirmationNormalizer/);
  });

  test("owns confirmation options in the application context", () => {
    const options = fs.readFileSync(path.join(ROOT, "src/webserver/application/config_confirmation_options.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    assert.match(options, /createConfigConfirmationOptionsFeature/);
    assert.doesNotMatch(options, /\b(?:staticGlobal|liveGlobal|GlobalDescriptors)\b/);
    assert.doesNotMatch(entry, /installConfigConfirmationOptionsModule/);
    assert.match(entry, /confirmationOptions = createConfigConfirmationOptionsFeature/);
    assert.match(options, /from "\.\.\/model\/config_primitives"/);
  });

  test("owns one configuration codec instance in the application context", () => {
    const codec = fs.readFileSync(path.join(ROOT, "src/webserver/application/config_codec.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    assert.match(codec, /createConfigCodecFeature/);
    assert.doesNotMatch(entry, /installConfigCodecModule/);
    assert.match(entry, /configurationCodec = createConfigCodecFeature/);
    assert.doesNotMatch(entry, /configuration\.codec\.globals/);
    assert.match(entry, /configurationCodec\.normalizeButtonConfig/);
    assert.match(entry, /configurationCodec\.serializeSubpageConfig/);
  });

  test("injects the configuration codec into editor and preview consumers", () => {
    const consumers = [
      "src/webserver/application/button_settings.ts",
      "src/webserver/application/preview_render.ts",
      "src/webserver/application/preview_grid_placement.ts",
      "src/webserver/application/preview_context_menu.ts",
      "src/webserver/application/preview_clipboard.ts",
      "src/webserver/application/preview_interactions.ts",
      "src/webserver/cards/subpage.ts",
      "src/webserver/testing/app_test_hooks_config.ts",
      "src/webserver/testing/app_test_hooks_preview.ts",
    ];
    for (const relativePath of consumers) {
      const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
      assert.match(source, /ConfigCodecFeature/, `${relativePath} should declare its codec dependency`);
    }
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    assert.match(entry, /codec: context\.configuration\.codec/);
    assert.match(entry, /installAppTestHooksPreview\(context\.cards, context\.configuration\.codec, context\.runtime\)/);
  });

  test("injects the configuration codec into persistence and application services", () => {
    const consumers = [
      "src/webserver/application/config_post_api.ts",
      "src/webserver/application/app_config_events.ts",
      "src/webserver/application/backup_contract.ts",
      "src/webserver/application/app_backup.ts",
      "src/webserver/application/core.ts",
      "src/webserver/application/grid.ts",
      "src/webserver/application/settings_page.ts",
      "src/webserver/application/settings_page_helpers.ts",
      "src/webserver/application/settings_schedule_section.ts",
      "src/webserver/application/settings_cover_art_section.ts",
    ];
    for (const relativePath of consumers) {
      const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
      assert.match(source, /ConfigCodecFeature/, `${relativePath} should declare its codec dependency`);
    }
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    assert.match(entry, /configurationPersistence\.connectCodec\(configurationCodec\)/);
    assert.match(entry, /installAppConfigEventsModule\(configPersistence, context\.configuration\.codec\)/);
    assert.doesNotMatch(entry, /configuration\.codec\.globals/);
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.doesNotMatch(globals, /\bvar (?:normalizeButtonConfig|serializeButtonConfig|parseSubpageConfig|serializeSubpageConfig|getSubpage|bindTextPost):/);
  });

  test("imports shared UI primitives without application globals", () => {
    const primitives = fs.readFileSync(path.join(ROOT, "src/webserver/application/ui_primitives.ts"), "utf8");
    const stateModule = fs.readFileSync(path.join(ROOT, "src/webserver/application/state.ts"), "utf8");
    const core = fs.readFileSync(path.join(ROOT, "src/webserver/application/core.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.match(primitives, /export function iconSlug/);
    assert.match(primitives, /export function mdiIcon/);
    assert.match(primitives, /export function escHtml/);
    assert.doesNotMatch(stateModule, /staticGlobal\((?:uniqueOptions|setSelectValue|escHtml|escAttr|mdiIcon|textSpan)\)/);
    assert.doesNotMatch(core, /staticGlobal\(iconSlug\)/);
    assert.doesNotMatch(entry, /\.\.\.Icons/);
    assert.doesNotMatch(globals, /\bvar (?:iconSlug|mdiIcon|textSpan|escHtml|escAttr|uniqueOptions|setSelectValue|ICON_OPTIONS|DOMAIN_ICONS):/);
  });

  test("owns mutable UI runtime state in the application context", () => {
    const runtime = fs.readFileSync(path.join(ROOT, "src/webserver/application/state.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    assert.match(runtime, /createUiRuntimeState/);
    assert.doesNotMatch(entry, /installStateModule/);
    assert.match(entry, /runtime = createUiRuntimeState\(layout, dom\.document\)/);
    assert.match(entry, /installGlobals\(context\.runtime\.globals\)/);
    assert.match(entry, /getActiveSource: \(\) => runtime\.eventSource/);
  });

  test("injects preview drag state without ambient globals", () => {
    const interactions = fs.readFileSync(path.join(ROOT, "src/webserver/application/preview_interactions.ts"), "utf8");
    const shell = fs.readFileSync(path.join(ROOT, "src/webserver/application/controls_shell.ts"), "utf8");
    const runtime = fs.readFileSync(path.join(ROOT, "src/webserver/application/state.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.match(interactions, /readonly runtime: UiRuntimeState/);
    assert.match(shell, /installControlsShellModule\(runtime: UiRuntimeState\)/);
    assert.match(entry, /installControlsShellModule\(context\.runtime\)/);
    assert.match(entry, /runtime: context\.runtime/);
    assert.doesNotMatch(runtime, /"(?:dragSrcPos|didDrag|previewPlaceholder|previewDropIdx|dragRafPending|dragSrcEl|dragIsSubpage|dragEnterCount)"/);
    assert.doesNotMatch(globals, /\bvar (?:dragSrcPos|didDrag|previewPlaceholder|previewDropIdx|dragRafPending|dragSrcEl|dragIsSubpage|dragEnterCount):/);
  });

  test("injects migration state without ambient globals", () => {
    const runtime = fs.readFileSync(path.join(ROOT, "src/webserver/application/state.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const persistence = fs.readFileSync(path.join(ROOT, "src/webserver/application/config_post_api.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.match(entry, /createConfigPersistenceFeature\(nativePanelConfig, runtime\)/);
    assert.match(entry, /installAppEventsModule\(reconnectController, sseHandlerFactory, context\.runtime\)/);
    assert.match(persistence, /runtime\.pendingSliderSubpageMigrations/);
    assert.doesNotMatch(runtime, /"(?:orderReceived|migrationTimer|sliderMigrationTimer|pendingSliderSubpageMigrations)"/);
    assert.doesNotMatch(globals, /\bvar (?:orderReceived|migrationTimer|sliderMigrationTimer|pendingSliderSubpageMigrations):/);
  });

  test("removes runtime helper globals", () => {
    const runtime = fs.readFileSync(path.join(ROOT, "src/webserver/application/state.ts"), "utf8");
    const loader = fs.readFileSync(path.join(ROOT, "src/webserver/application/state_loader_api.ts"), "utf8");
    const settings = fs.readFileSync(path.join(ROOT, "src/webserver/application/button_settings_render_queue.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.match(loader, /runtime\.eventSource\.close\(\)/);
    assert.match(settings, /runtime\.isSettingsOpen\(\)/);
    assert.match(entry, /installButtonSettingsRenderQueueModule\(context\.runtime\)/);
    assert.doesNotMatch(runtime, /"(?:_eventSource|isSettingsFocused|isSettingsOpen)"/);
    assert.doesNotMatch(globals, /\bvar (?:_eventSource|isSettingsFocused|isSettingsOpen):/);
  });

  test("injects settings DOM references", () => {
    const modules = [
      "settings_page_helpers.ts",
      "settings_schedule_section.ts",
      "settings_cover_art_section.ts",
      "settings_page.ts",
      "settings_system_section.ts",
    ];
    for (const moduleName of modules) {
      const source = fs.readFileSync(path.join(ROOT, "src/webserver/application", moduleName), "utf8");
      assert.match(source, /UiRuntimeState/, `${moduleName} should declare its runtime dependency`);
      assert.match(source, /const els = .*runtime\.els/, `${moduleName} should use context-owned DOM references`);
    }
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    assert.match(entry, /installSettingsPageModule\(context\.configuration\.codec, context\.runtime\)/);
    assert.match(entry, /installSettingsSystemSectionModule\([\s\S]*context\.runtime\)\)/);
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
