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
      ["door_window", "registerDoorWindowCardTypes"],
      ["image", "registerImageCardTypes"],
      ["lawn_mower", "registerLawnMowerCardTypes"],
      ["presence", "registerPresenceCardTypes"],
      ["push", "registerPushCardTypes"],
      ["screen_lock", "registerScreenLockCardTypes"],
      ["action", "registerActionCardTypes"],
      ["alarm", "registerAlarmCardTypes"],
      ["climate", "registerClimateCardTypes"],
      ["fan", "registerFanCardTypes"],
      ["light_temperature", "registerLightTemperatureCardTypes"],
      ["media", "registerMediaCardTypes"],
      ["subpage", "registerSubpageCardTypes"],
      ["vacuum", "registerVacuumCardTypes"],
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

  test("registers static card families without compatibility descriptors", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    const cards = ["push", "screen_lock"];
    for (const card of cards) {
      const source = fs.readFileSync(path.join(ROOT, `src/webserver/cards/${card}.ts`), "utf8");
      assert.doesNotMatch(source, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal)\b/);
    }
    for (const registration of ["registerPushCardTypes", "registerScreenLockCardTypes"]) {
      assert.match(entry, new RegExp(`^  ${registration}\\(registry\\);`, "m"));
      assert.doesNotMatch(entry, new RegExp(`registerCompatibility\\(${registration}`));
    }
    assert.doesNotMatch(globals, /\bvar (?:PUSH_CARD_METADATA|SCREEN_LOCK_CARD_METADATA|pushActionSpec|pushDefaultIcon|pushDefaultIconOn):/);
  });

  test("keeps card metadata private to registry definitions", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    for (const card of ["climate", "door_window", "presence"]) {
      const source = fs.readFileSync(path.join(ROOT, `src/webserver/cards/${card}.ts`), "utf8");
      assert.doesNotMatch(source, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal)\b/);
    }
    for (const registration of ["registerClimateCardTypes", "registerDoorWindowCardTypes", "registerPresenceCardTypes"]) {
      assert.doesNotMatch(entry, new RegExp(`registerCompatibility\\(${registration}`));
    }
    assert.doesNotMatch(globals, /\bvar (?:CLIMATE_CARD_METADATA|DOOR_WINDOW_CARD_METADATA|PRESENCE_CARD_METADATA):/);
  });

  test("registers switch cards without compatibility metadata", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const source = fs.readFileSync(path.join(ROOT, "src/webserver/cards/switch.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.doesNotMatch(source, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal)\b/);
    assert.match(entry, /^  registerSwitchCardTypes\(registry, context\.configuration\.confirmationOptions\);/m);
    assert.doesNotMatch(entry, /registerCompatibility\(registerSwitchCardTypes/);
    assert.doesNotMatch(globals, /\bvar (?:SWITCH_CARD_METADATA|LIGHT_SWITCH_CARD_METADATA):/);
  });

  test("registers the image card without compatibility helpers", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const source = fs.readFileSync(path.join(ROOT, "src/webserver/cards/image.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.doesNotMatch(source, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal)\b/);
    assert.doesNotMatch(entry, /registerCompatibility\(registerImageCardTypes/);
    assert.doesNotMatch(globals, /\bvar (?:IMAGE_CARD_METADATA|imageModalModeOptions|renderImageLabelSettings|renderImageModalSettings):/);
  });

  test("registers weather cards through explicit shared options", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const weather = fs.readFileSync(path.join(ROOT, "src/webserver/cards/weather.ts"), "utf8");
    const forecast = fs.readFileSync(path.join(ROOT, "src/webserver/cards/weather_forecast.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.doesNotMatch(weather, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal|CFG)\b/);
    assert.doesNotMatch(forecast, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal|WEATHER_CARD_METADATA)\b/);
    assert.match(entry, /const weatherCards = registerWeatherCardTypes\(registry, context\.configuration\.weatherOptions\);/);
    assert.match(entry, /registerWeatherForecastCardTypes\(registry, weatherCards\);/);
    assert.doesNotMatch(entry, /registerCompatibility\(registerWeather/);
    assert.doesNotMatch(globals, /\bvar (?:WEATHER_CARD_METADATA|WEATHER_FORECAST_CARD_METADATA|normalizeWeatherCardMode|weatherCardDefaultForecastLabel|weatherCardIsForecastMode|weatherForecastCardsSupported|weatherModeOptionValues|weatherModeOptions):/);
  });

  test("registers the webhook card through explicit shared options", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const card = fs.readFileSync(path.join(ROOT, "src/webserver/cards/webhook.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.doesNotMatch(card, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal)\b/);
    assert.match(entry, /registerWebhookCardTypes\(registry, context\.configuration\.webhookOptions\);/);
    assert.doesNotMatch(entry, /registerCompatibility\(registerWebhookCardTypes/);
    assert.doesNotMatch(globals, /\bvar (?:WEBHOOK_CARD_METADATA|WEBHOOK_HEADERS_OPTION|WEBHOOK_METHODS|normalizeWebhookConfig|setWebhookHeaders|webhookHeaders|webhookMethod):/);
  });

  test("registers the internal relay card with profile-owned options", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const card = fs.readFileSync(path.join(ROOT, "src/webserver/cards/internal.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.doesNotMatch(card, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal|CFG)\b/);
    assert.match(entry, /registerInternalCardTypes\(\s*registry,\s*context\.configuration\.internalRelayOptions,\s*context\.dom\.document,?\s*\);/);
    assert.doesNotMatch(entry, /registerCompatibility\(registerInternalCardTypes/);
    assert.doesNotMatch(globals, /\bvar (?:INTERNAL_CARD_METADATA|internalRelayDefaultIcon|internalRelayDefaultOnIcon|internalRelayLabelFor|internalRelayMode|internalRelayModeOptionValues|internalRelayOptions|internalRelaySpec|internalRelayUsesDefaultIcon|internalRelayUsesDefaultOnIcon|normalizeInternalRelayMode):/);
  });

  test("imports entity-mode helpers without compatibility globals", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const helpers = fs.readFileSync(path.join(ROOT, "src/webserver/cards/entity_mode_card.ts"), "utf8");
    const mower = fs.readFileSync(path.join(ROOT, "src/webserver/cards/lawn_mower.ts"), "utf8");
    const vacuum = fs.readFileSync(path.join(ROOT, "src/webserver/cards/vacuum.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.doesNotMatch(helpers, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal|registerEntityModeCardHelpers)\b/);
    assert.match(mower, /from "\.\/entity_mode_card"/);
    assert.match(vacuum, /from "\.\/entity_mode_card"/);
    assert.doesNotMatch(entry, /registerEntityModeCardHelpers/);
    assert.doesNotMatch(globals, /\bvar (?:applyEntityModeCardModeChange|entityModeCardUsesDefaultIcon|entityModeValues|normalizeEntityMode|normalizeEntityModeCardConfig):/);
  });

  test("registers robot cards through explicit shared options", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const mower = fs.readFileSync(path.join(ROOT, "src/webserver/cards/lawn_mower.ts"), "utf8");
    const vacuum = fs.readFileSync(path.join(ROOT, "src/webserver/cards/vacuum.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.doesNotMatch(mower, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal)\b/);
    assert.doesNotMatch(vacuum, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal)\b/);
    assert.match(entry, /registerLawnMowerCardTypes\(registry, context\.configuration\.robotOptions\);/);
    assert.match(entry, /registerVacuumCardTypes\(registry, context\.configuration\.robotOptions\);/);
    assert.doesNotMatch(entry, /registerCompatibility\(register(?:LawnMower|Vacuum)CardTypes/);
    assert.doesNotMatch(globals, /\bvar (?:LAWN_MOWER_CARD_METADATA|LAWN_MOWER_CARD_MODES|VACUUM_CARD_METADATA|VACUUM_CARD_MODES|lawnMowerModeBadgeIcon|lawnMowerModeDefaultIcon|lawnMowerModeValues|lawnMowerUsesDefaultIcon|normalizeLawnMowerConfig|normalizeLawnMowerMode|normalizeVacuumConfig|vacuumModeBadgeIcon|vacuumModeDefaultIcon|vacuumModeNeedsArea|vacuumModeValues):/);
  });

  test("registers the lock card through explicit shared options", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const card = fs.readFileSync(path.join(ROOT, "src/webserver/cards/lock.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.doesNotMatch(card, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal)\b/);
    assert.match(entry, /registerLockCardTypes\(registry, context\.configuration\.lockOptions\);/);
    assert.doesNotMatch(entry, /registerCompatibility\(registerLockCardTypes/);
    assert.doesNotMatch(globals, /\bvar (?:LOCK_CARD_METADATA|lockCommandMode|lockModeDefaultIcon|lockModeDefaultLabel|lockModeOptionValues|lockUsesDefaultIcon|normalizeLockMode):/);
  });

  test("registers date/time cards through one explicit service", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    for (const card of ["calendar", "clock", "timezone"]) {
      const source = fs.readFileSync(path.join(ROOT, `src/webserver/cards/${card}.ts`), "utf8");
      assert.doesNotMatch(source, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal|DATE_TIME_CARD_METADATA)\b/);
    }
    assert.match(entry, /registerCalendarCardTypes\(registry, context\.configuration\.dateTimeOptions\);/);
    assert.match(entry, /registerClockCardTypes\(registry, context\.configuration\.dateTimeOptions\);/);
    assert.match(entry, /registerTimezoneCardTypes\(registry, context\.configuration\.dateTimeOptions, context\.dom\.document\);/);
    assert.doesNotMatch(entry, /registerCompatibility\(registerCalendarCardTypes/);
    assert.doesNotMatch(globals, /\bvar (?:DATE_TIME_CARD_METADATA|dateTimeCardMode|dateTimeCardTimeParts|dateTimeLargeNumbersLabel|dateTimeModeOptionValues|defaultTimezoneCardEntity|normalizeDateTimeCardMode|setDateTimeCardMode):/);
  });

  test("registers slider card families without compatibility descriptors", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const card = fs.readFileSync(path.join(ROOT, "src/webserver/cards/slider.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.doesNotMatch(card, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal)\b/);
    assert.match(entry, /registerSliderCardTypes\(registry, context\.configuration\.modalTabs\);/);
    assert.doesNotMatch(entry, /registerCompatibility\(registerSliderCardTypes/);
    assert.doesNotMatch(globals, /\bvar (?:renderCoverControlTabSettings|sliderCardMetadata|sliderTypeFactory):/);
  });

  test("registers fan card families without compatibility descriptors", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const card = fs.readFileSync(path.join(ROOT, "src/webserver/cards/fan.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.doesNotMatch(card, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal)\b/);
    assert.match(entry, /registerFanCardTypes\(registry, context\.configuration\.modalTabs\);/);
    assert.doesNotMatch(entry, /registerCompatibility\(registerFanCardTypes/);
    assert.doesNotMatch(globals, /\bvar (?:FAN_CARD_METADATA|FAN_CONTROL_TYPE_OPTIONS|fanControlBadgeIcon|fanControlDefaultIcon|fanTypeFactory|normalizeFanControlType|renderFanControlTabSettings|renderFanControlTypeField|setFanControlType):/);
  });

  test("registers alarm card families without compatibility descriptors", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const card = fs.readFileSync(path.join(ROOT, "src/webserver/cards/alarm.ts"), "utf8");
    const hooks = fs.readFileSync(path.join(ROOT, "src/webserver/testing/app_test_hooks_config.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.doesNotMatch(card, /\b(?:GlobalDescriptors|staticGlobal|liveGlobal)\b/);
    assert.match(entry, /registerAlarmCardTypes\(registry, context\.configuration\.accessClimateAlarm\);/);
    assert.doesNotMatch(entry, /registerCompatibility\(registerAlarmCardTypes/);
    assert.match(hooks, /alarmBehaviorSpec,[\s\S]*alarmActionSpecs,/);
    assert.doesNotMatch(globals, /\bvar (?:ALARM_CARD_METADATA|ALARM_CONTROL_PANEL_VALUE|alarmCardTypeOptions|alarmCardTypeOptionsForSettings|alarmControlPanelValue|alarmIconIsGenerated|alarmLabelIsGenerated|alarmUsesDefaultIcon|renderAlarmCardTypeField|renderAlarmVisibleActionsField|setAlarmCardType):/);
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
    assert.doesNotMatch(entry, /installGlobals\(context\.runtime\.globals\)/);
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
    assert.match(entry, /installAppEventsModule\([\s\S]*reconnectController, sseHandlerFactory, context\.runtime, context\.controllers\.pageTitle/);
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

  test("injects display-state DOM references", () => {
    const modules = [
      "appearance_state.ts", "c6_firmware_ui.ts", "clock_bar_state.ts",
      "firmware_update_state.ts", "firmware_version_state.ts", "idle_state.ts",
      "language_state.ts", "ntp_state.ts", "screen_schedule_state.ts", "screensaver_timeout.ts",
    ];
    for (const moduleName of modules) {
      const source = fs.readFileSync(path.join(ROOT, "src/webserver/application", moduleName), "utf8");
      assert.match(source, /UiRuntimeState/, `${moduleName} should declare its runtime dependency`);
      assert.match(source, /const els = runtime\.els/, `${moduleName} should use context-owned DOM references`);
    }
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    assert.match(entry, /installScreenScheduleStateModule\(screenScheduleController, context\.runtime\)/);
    assert.match(entry, /installFirmwareUpdateStateModule\(context\.runtime\)/);
  });

  test("removes the ambient DOM registry", () => {
    const runtime = fs.readFileSync(path.join(ROOT, "src/webserver/application/state.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    const consumers = fs.readdirSync(path.join(ROOT, "src/webserver/application"))
      .filter((name) => name.endsWith(".ts"))
      .map((name) => [name, fs.readFileSync(path.join(ROOT, "src/webserver/application", name), "utf8")])
      .filter(([, source]) => /\bels\b/.test(source));
    for (const [name, source] of consumers) {
      if (name === "state.ts") continue;
      assert.match(source, /const els = .*runtime\.els/, `${name} should use the injected DOM registry`);
    }
    assert.doesNotMatch(runtime, /globals: GlobalDescriptors/);
    assert.doesNotMatch(entry, /context\.runtime\.globals/);
    assert.doesNotMatch(globals, /\bvar els:/);
  });

  test("owns page-title behavior without compatibility globals", () => {
    const title = fs.readFileSync(path.join(ROOT, "src/webserver/application/app_title.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const events = fs.readFileSync(path.join(ROOT, "src/webserver/application/app_events.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.match(title, /createAppTitleFeature/);
    assert.doesNotMatch(title, /GlobalDescriptors|staticGlobal/);
    assert.match(entry, /pageTitle = createAppTitleFeature/);
    assert.match(events, /pageTitle\.handleWebServerPingEvent/);
    assert.doesNotMatch(entry, /installAppTitleModule/);
    assert.doesNotMatch(globals, /\bvar (?:applyPageTitle|handleWebServerPingEvent|loadPageTitleFromEventStream):/);
  });

  test("imports web styles directly", () => {
    const styles = fs.readFileSync(path.join(ROOT, "src/webserver/application/styles.ts"), "utf8");
    const app = fs.readFileSync(path.join(ROOT, "src/webserver/application/app.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.match(styles, /export function createWebStyles\(dragAnimation: boolean\)/);
    assert.match(styles, /import \{ WEB_UI_COLORS \} from "\.\.\/state\/ui_tokens"/);
    assert.match(app, /style\.textContent = webStyles/);
    assert.match(entry, /createWebStyles\(context\.layout\.config\.dragAnimation\)/);
    assert.doesNotMatch(styles, /\bCFG\b/);
    assert.doesNotMatch(entry, /installStylesModule/);
    assert.doesNotMatch(globals, /\bvar WEB_STYLES:/);
  });

  test("imports shared UI colour tokens directly", () => {
    const consumers = [
      "application/appearance_state.ts",
      "application/preview_render.ts",
      "application/settings_page.ts",
      "application/styles.ts",
      "cards/image.ts",
      "cards/media.ts",
      "state/app_state.ts",
    ];
    for (const consumer of consumers) {
      const source = fs.readFileSync(path.join(ROOT, "src/webserver", consumer), "utf8");
      assert.match(source, /import \{ WEB_UI_COLORS \} from /, `${consumer} should import the UI colours`);
    }
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    assert.doesNotMatch(entry, /UiTokens/);
    assert.doesNotMatch(globals, /\bvar WEB_UI_COLORS:/);
  });

  test("imports firmware metadata helpers directly", () => {
    const metadata = fs.readFileSync(path.join(ROOT, "src/webserver/application/firmware_metadata.ts"), "utf8");
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    const consumers = [
      "application/firmware_update_state.ts",
      "application/firmware_version_state.ts",
      "application/public_firmware_install.ts",
      "application/settings_system_section.ts",
      "application/state_loader_api.ts",
      "testing/app_test_hooks_settings.ts",
    ];
    assert.match(metadata, /export function firmwareInfoFromPublicManifest/);
    assert.match(metadata, /import \{ deviceId \} from "\.\.\/device_config"/);
    assert.doesNotMatch(metadata, /GlobalDescriptors|liveGlobal|staticGlobal/);
    for (const consumer of consumers) {
      const source = fs.readFileSync(path.join(ROOT, "src/webserver", consumer), "utf8");
      assert.match(source, /from "(?:\.\.\/application\/|\.\/)firmware_metadata"/, `${consumer} should import firmware metadata`);
    }
    assert.doesNotMatch(entry, /installFirmwareMetadataModule/);
    assert.doesNotMatch(globals, /\bvar (?:FIRMWARE_VERSION_METADATA_PATH|FIRMWARE_PUBLIC_MANIFEST_BASE|isSpecificFirmwareVersion|firmwareVersionFromMetadata|firmwareVersionsSame|publicFirmwareManifestUrl|publicFirmwareVersionsUrl|publicFirmwareAssetUrl|firmwareInfoFromPublicManifest|firmwareInfoFromPublicVersionEntry|firmwareInfosFromPublicVersions):/);
  });

  test("imports request and event contracts directly", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    const api = fs.readFileSync(path.join(ROOT, "src/webserver/application/api.ts"), "utf8");
    const events = fs.readFileSync(path.join(ROOT, "src/webserver/application/app_events.ts"), "utf8");
    const handlers = fs.readFileSync(path.join(ROOT, "src/webserver/application/app_state_event_handlers.ts"), "utf8");
    const entities = fs.readFileSync(path.join(ROOT, "src/webserver/application/entity_state.ts"), "utf8");
    assert.match(api, /import \{ requestFailureInfo \} from "\.\.\/api\/request_failure"/);
    assert.match(events, /from "\.\.\/state\/event_aliases"/);
    assert.match(events, /from "\.\.\/state\/event_state"/);
    assert.match(events, /from "\.\.\/state\/firmware_events"/);
    assert.match(handlers, /import \{ applyClockBarStateValue \} from "\.\.\/state\/event_state"/);
    assert.match(entities, /import \{ entityStateKeys \} from "\.\.\/state\/event_state"/);
    assert.doesNotMatch(entry, /\b(?:RequestFailure|EventAliases|EventState|FirmwareEvents)\b/);
    assert.doesNotMatch(globals, /\bvar (?:SSE_ALIAS_GROUPS|requestFailureInfo|applySseHandlerAliases|entityStateKeys|applyClockBarStateValue|isRemovedLegacyStateEvent|resetStateForConnection|parseEntityEventData|isFirmwareVersionEvent|isFirmwareUpdateEvent|isFirmwareCheckButtonEvent|isFirmwareInstallButtonEvent|isC6FirmwareCurrentEvent|isC6FirmwareLatestEvent|isC6FirmwareUpdateAvailableEvent|isC6FirmwareAutoUpdateEvent|isC6FirmwareCheckButtonEvent|isC6FirmwareInstallButtonEvent):/);
  });

  test("imports initial application-state contracts directly", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    const consumers = [
      "application/app_state_event_handlers.ts",
      "application/environment_state.ts",
      "application/language_state.ts",
      "application/ntp_state.ts",
      "application/settings_page.ts",
    ];
    for (const consumer of consumers) {
      const source = fs.readFileSync(path.join(ROOT, "src/webserver", consumer), "utf8");
      assert.match(source, /from "\.\.\/state\/app_state"/, `${consumer} should import application-state contracts`);
    }
    assert.match(entry, /import \{ NTP_SERVER_DEFAULTS, defaultTimezoneOptionsForDevice \} from "\.\/state\/app_state"/);
    assert.doesNotMatch(entry, /\bAppState\b/);
    assert.doesNotMatch(globals, /\bvar (?:AUTO_TIMEZONE_OPTION|FALLBACK_TIMEZONE_OPTION|NTP_SERVER_DEFAULTS|LANGUAGE_LABELS|defaultTimezoneOptionsForDevice|createInitialState):/);
  });

  test("imports generated card contracts directly", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    const roots = ["application", "cards", "testing"];
    for (const directory of roots) {
      const root = path.join(ROOT, "src/webserver", directory);
      for (const name of fs.readdirSync(root).filter((file) => file.endsWith(".ts"))) {
        const source = fs.readFileSync(path.join(root, name), "utf8");
        if (!/\b(?:cardContract[A-Z]|CARD_RUNTIME_SPECS)\b/.test(source)) continue;
        assert.match(source, /from "\.\.\/generated\/card_contract"/, `${directory}/${name} should import its generated card contract`);
      }
    }
    assert.doesNotMatch(entry, /\bCardContract\b/);
    assert.doesNotMatch(globals, /\bvar (?:CARD_CONFIG_FIELDS|CARD_CONTRACT_[A-Z_]+|cardContract[A-Z][A-Za-z]+):/);
  });

  test("keeps device configuration module-owned", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    const metadata = fs.readFileSync(path.join(ROOT, "src/webserver/application/firmware_metadata.ts"), "utf8");
    const instance = fs.readFileSync(path.join(ROOT, "src/webserver/state/app_instance.ts"), "utf8");
    assert.doesNotMatch(entry, /\.\.\.DeviceConfig/);
    assert.match(metadata, /import \{ deviceId \} from "\.\.\/device_config"/);
    assert.match(instance, /import \{ deviceConfig \} from "\.\.\/device_config"/);
    assert.doesNotMatch(globals, /\bvar (?:deviceId|deviceConfig):/);
  });

  test("imports configuration primitives directly", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    const roots = ["application", "cards"];
    for (const directory of roots) {
      const root = path.join(ROOT, "src/webserver", directory);
      for (const name of fs.readdirSync(root).filter((file) => file.endsWith(".ts"))) {
        const source = fs.readFileSync(path.join(root, name), "utf8");
        if (!/\b(?:configOptionEnabled|configOptionValue|setConfigOption|setConfigOptionValue)\b/.test(source)) continue;
        assert.match(source, /from "\.\.\/model\/config_primitives"/, `${directory}/${name} should import configuration primitives`);
      }
    }
    assert.doesNotMatch(entry, /\bConfigPrimitives\b/);
    assert.doesNotMatch(globals, /\bvar (?:configOptionEnabled|configOptionValue|setConfigOption|setConfigOptionValue):/);
  });

  test("imports the shared model namespace directly", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    const roots = ["application", "testing"];
    for (const directory of roots) {
      const root = path.join(ROOT, "src/webserver", directory);
      for (const name of fs.readdirSync(root).filter((file) => file.endsWith(".ts"))) {
        const source = fs.readFileSync(path.join(root, name), "utf8");
        if (!/\bEspControlModel\b/.test(source)) continue;
        assert.match(source, /import \* as EspControlModel from "\.\.\/model"/, `${directory}/${name} should import the shared model`);
      }
    }
    assert.doesNotMatch(entry, /EspControlModel\s*:/);
    assert.doesNotMatch(globals, /\bvar EspControlModel:/);
  });

  test("imports static catalogues and injects timezone defaults", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    for (const name of ["config_post_api.ts", "entity_state.ts", "state_loader_api.ts"]) {
      const source = fs.readFileSync(path.join(ROOT, "src/webserver/application", name), "utf8");
      assert.match(source, /import \{ ENTITY_CATALOG \} from "\.\.\/generated\/entity_catalog"/);
    }
    const environment = fs.readFileSync(path.join(ROOT, "src/webserver/application/environment_state.ts"), "utf8");
    const settingsHooks = fs.readFileSync(path.join(ROOT, "src/webserver/testing/app_test_hooks_settings.ts"), "utf8");
    assert.match(environment, /defaultTimezoneOptions: \(\) => string\[\]/);
    assert.match(settingsHooks, /defaultTimezoneOptions: \(\) => string\[\]/);
    assert.doesNotMatch(entry, /import \{ ENTITY_CATALOG \}/);
    assert.doesNotMatch(globals, /\bvar (?:ENTITY_CATALOG|defaultTimezoneOptions):/);
  });

  test("removes the static Product Model bootstrap", () => {
    const entry = fs.readFileSync(path.join(ROOT, "src/webserver/entry.ts"), "utf8");
    const runtime = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/globals.ts"), "utf8");
    const globals = fs.readFileSync(path.join(ROOT, "src/webserver/runtime/application_globals.d.ts"), "utf8");
    const model = fs.readFileSync(path.join(ROOT, "src/webserver/model/index.ts"), "utf8");
    const exportedValues = [...model.matchAll(/export \{([\s\S]*?)\} from/g)]
      .flatMap((match) => match[1].split(","))
      .map((name) => name.trim())
      .filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));
    assert.doesNotMatch(entry, /installStaticGlobals|\.\.\.Model/);
    assert.doesNotMatch(runtime, /function installStaticGlobals/);
    for (const name of exportedValues) {
      assert.doesNotMatch(globals, new RegExp(`\\bvar ${name}:`), `${name} should not be ambient`);
    }
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
