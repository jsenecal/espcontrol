import {
  createApplicationContext,
  createApplicationLayoutState,
} from "../../src/webserver/application/application_context";
import { createCardRegistry } from "../../src/webserver/application/card_registry";
import { installCore } from "../../src/webserver/application/core";
import { createConfigWeatherOptionsFeature } from "../../src/webserver/application/config_weather_options";
import { createConfigWebhookOptionsFeature } from "../../src/webserver/application/config_webhook_options";
import { createConfigInternalRelayOptionsFeature } from "../../src/webserver/application/config_internal_relay_options";
import type { DeviceConfig } from "../../src/webserver/state/types";
import type { GlobalDescriptors } from "../../src/webserver/runtime/globals";

const profile: DeviceConfig = {
  slots: 12,
  cols: 4,
  rows: 3,
  screenSize: "10-inch",
  dragMode: "swap",
  dragAnimation: true,
  imageSlotCapacity: 12,
  screen: { width: "100%", aspect: "16 / 10" },
  grid: { fr: "1fr" },
};

function equal<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

export function runApplicationContextTests(): void {
  const installed: GlobalDescriptors[] = [];
  const cards = createCardRegistry((descriptors) => installed.push(descriptors));
  const api = { request() {} } as any;
  const nativeConfiguration = { begin() {} } as any;
  const configurationPersistence = { globals: {}, saveButtonConfig() {}, saveSubpageEntity() {} } as any;
  const configurationOptions = {} as any;
  const mediaConfigurationOptions = {} as any;
  const imageConfigurationOptions = {} as any;
  const weatherConfigurationOptions = {} as any;
  const webhookConfigurationOptions = {} as any;
  const internalRelayConfigurationOptions = {} as any;
  const modalTabOptions = {} as any;
  const accessClimateAlarmOptions = {} as any;
  const confirmationOptions = {} as any;
  const configurationCodec = {} as any;
  const backupContract = {} as any;
  const backupExport = {} as any;
  const backupFile = {} as any;
  const backupImport = {} as any;
  const backupRestore = {} as any;
  const backupApplication = {} as any;
  const reconnect = { connect() {} } as any;
  const alarmDelayAudio = {} as any;
  const cardEditorDraft = {} as any;
  const cardEditorSave = {} as any;
  const cardEditorValidation = {} as any;
  const previewPlacement = {} as any;
  const clockBar = {} as any;
  const coverArtScreensaver = {} as any;
  const mediaPlayback = {} as any;
  const pageTitle = {} as any;
  const screenSchedule = {} as any;
  const screensaver = {} as any;
  const settingsUi = {} as any;
  const voiceServices = {} as any;
  const state = { grid: [] } as any;
  const runtime = {} as any;
  const model = {} as any;
  const dom = {} as any;
  const context = createApplicationContext({
    layout: createApplicationLayoutState("guition-esp32-p4-jc8012p4a1", profile),
    model,
    state,
    runtime,
    api,
    nativeConfiguration,
    configurationPersistence,
    configurationOptions,
    mediaConfigurationOptions,
    imageConfigurationOptions,
    weatherConfigurationOptions,
    webhookConfigurationOptions,
    internalRelayConfigurationOptions,
    modalTabOptions,
    accessClimateAlarmOptions,
    confirmationOptions,
    configurationCodec,
    backupContract,
    backupExport,
    backupFile,
    backupImport,
    backupRestore,
    backupApplication,
    alarmDelayAudio,
    cardEditorDraft,
    cardEditorSave,
    cardEditorValidation,
    previewPlacement,
    clockBar,
    coverArtScreensaver,
    mediaPlayback,
    pageTitle,
    reconnect,
    screenSchedule,
    screensaver,
    settingsUi,
    voiceServices,
    dom,
    cards,
  });

  equal(context.device.id, "guition-esp32-p4-jc8012p4a1", "context owns the selected device");
  equal(context.layout.numSlots, 12, "context initializes slot count");
  equal(context.layout.totalSlots, 12, "context initializes total slot count");
  equal(context.layout.gridCols, 4, "context initializes grid columns");
  equal(context.layout.gridRows, 3, "context initializes grid rows");
  equal(context.api, api, "context retains the API instance");
  equal(context.runtime, runtime, "context retains mutable UI runtime state");
  equal(context.configuration.native, nativeConfiguration, "context retains native persistence");
  equal(context.configuration.persistence, configurationPersistence, "context retains save persistence");
  equal(context.configuration.options, configurationOptions, "context retains typed configuration options");
  equal(context.configuration.mediaOptions, mediaConfigurationOptions, "context retains typed media options");
  equal(context.configuration.imageOptions, imageConfigurationOptions, "context retains typed image options");
  equal(context.configuration.weatherOptions, weatherConfigurationOptions, "context retains typed weather options");
  equal(context.configuration.webhookOptions, webhookConfigurationOptions, "context retains typed webhook options");
  equal(context.configuration.internalRelayOptions, internalRelayConfigurationOptions, "context retains typed internal-relay options");
  equal(context.configuration.modalTabs, modalTabOptions, "context retains typed modal-tab options");
  equal(context.configuration.accessClimateAlarm, accessClimateAlarmOptions, "context retains typed access/climate/alarm options");
  equal(context.configuration.confirmationOptions, confirmationOptions, "context retains typed confirmation options");
  equal(context.configuration.codec, configurationCodec, "context retains the typed configuration codec");
  equal(context.backup.contract, backupContract, "context retains the backup contract");
  equal(context.backup.export, backupExport, "context retains backup export ownership");
  equal(context.backup.file, backupFile, "context retains backup file ownership");
  equal(context.backup.import, backupImport, "context retains backup import ownership");
  equal(context.backup.restore, backupRestore, "context retains backup restore ownership");
  equal(context.backup.application, backupApplication, "context retains the backup journey");
  equal(context.controllers.cardEditorDraft, cardEditorDraft, "context retains editor draft ownership");
  equal(context.controllers.alarmDelayAudio, alarmDelayAudio, "context retains alarm settings ownership");
  equal(context.controllers.cardEditorSave, cardEditorSave, "context retains editor save ownership");
  equal(context.controllers.cardEditorValidation, cardEditorValidation, "context retains editor validation ownership");
  equal(context.controllers.previewPlacement, previewPlacement, "context retains preview placement ownership");
  equal(context.controllers.clockBar, clockBar, "context retains clock bar ownership");
  equal(context.controllers.coverArtScreensaver, coverArtScreensaver, "context retains cover art settings ownership");
  equal(context.controllers.mediaPlayback, mediaPlayback, "context retains media settings ownership");
  equal(context.controllers.pageTitle, pageTitle, "context retains page title ownership");
  equal(context.controllers.screenSchedule, screenSchedule, "context retains schedule settings ownership");
  equal(context.controllers.screensaver, screensaver, "context retains screensaver settings ownership");
  equal(context.controllers.settingsUi, settingsUi, "context retains settings DOM ownership");
  equal(context.controllers.voiceServices, voiceServices, "context retains voice settings ownership");
  equal(context.controllers.reconnect, reconnect, "context retains reconnect ownership");

  const weatherOptions = createConfigWeatherOptionsFeature(profile);
  equal(weatherOptions.normalizeWeatherCardMode("today"), "today", "weather options preserve supported forecast modes");
  equal(weatherOptions.normalizeWeatherCardMode("invalid"), "", "weather options reject unknown modes");
  equal(weatherOptions.weatherCardDefaultForecastLabel({ precision: "today" }), "Today", "weather options label today's forecast");
  equal(weatherOptions.weatherCardDefaultForecastLabel({ precision: "tomorrow" }), "Tomorrow", "weather options label tomorrow's forecast");
  const currentOnlyWeather = createConfigWeatherOptionsFeature({ ...profile, disabledCardTypes: ["weather_forecast"] });
  equal(currentOnlyWeather.normalizeWeatherCardMode("tomorrow"), "", "disabled forecast support normalizes to current conditions");
  equal(currentOnlyWeather.weatherCardIsForecastMode({ precision: "tomorrow" }), false, "disabled forecast support hides forecast controls");

  const webhookOptions = createConfigWebhookOptionsFeature();
  equal(webhookOptions.webhookMethod("post"), "POST", "webhook options normalize supported methods");
  equal(webhookOptions.webhookMethod("unknown"), "GET", "webhook options fall back to GET");
  const webhook = { sensor: "POST", unit: "{}", icon: "", icon_on: "Flash", precision: "1", options: "webhook_headers=Content-Type%3A%20application/json,unused=value" } as any;
  webhookOptions.normalizeWebhookConfig(webhook);
  equal(webhook.icon, "Auto", "webhook normalization restores the default icon");
  equal(webhook.icon_on, "Auto", "webhook normalization removes the active icon");
  equal(webhook.precision, "", "webhook normalization clears precision");
  equal(webhookOptions.webhookHeaders(webhook), "Content-Type: application/json", "webhook normalization preserves encoded headers");

  const internalRelayOptions = createConfigInternalRelayOptionsFeature({
    ...profile,
    features: { internalRelays: [{ key: "relay_1", label: "Relay One" }] },
  });
  equal(internalRelayOptions.normalizeInternalRelayMode("push"), "push", "internal relay options preserve push mode");
  equal(internalRelayOptions.normalizeInternalRelayMode("invalid"), "switch", "internal relay options reject unknown modes");
  equal(internalRelayOptions.internalRelayLabelFor("relay_1"), "Relay One", "internal relay options use profile labels");
  equal(internalRelayOptions.internalRelayLabelFor("porch_light"), "Porch Light", "internal relay options format unknown relay keys");

  cards.registerCompatibility({ example: { configurable: true, value: true } });
  equal(cards.compatibilityDefinitionCount, 1, "registry counts compatibility definitions");
  equal(installed.length, 1, "registry delegates compatibility installation");
  const sensor = cards.register("sensor", { label: "Sensor", allowInSubpage: true });
  equal(cards.typedDefinitionCount, 1, "registry counts typed card definitions");
  equal(cards.definitions.sensor, sensor, "registry owns typed card definitions");
  equal(sensor.key, "sensor", "registry assigns the card key");
  equal(sensor.label, "Sensor", "registry preserves typed card metadata");
  equal(sensor.runtimeSpec != null, true, "registry attaches the generated runtime contract");

  const compatibilityGlobals: Record<string, unknown> = {};
  Object.defineProperties(compatibilityGlobals, installCore(context.layout, {
    serializeSubpageGrid() { return ""; },
  } as any, runtime));
  compatibilityGlobals.GRID_COLS = 6;
  compatibilityGlobals.GRID_ROWS = 2;
  compatibilityGlobals.NUM_SLOTS = 10;
  equal(context.layout.gridCols, 6, "legacy grid column writes update context state");
  equal(context.layout.gridRows, 2, "legacy grid row writes update context state");
  equal(context.layout.numSlots, 10, "legacy slot writes update context state");
}
