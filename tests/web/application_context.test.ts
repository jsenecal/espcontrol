import {
  createApplicationContext,
  createApplicationLayoutState,
  createCompatibilityCardRegistry,
} from "../../src/webserver/application/application_context";
import { installCore } from "../../src/webserver/application/core";
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
  const cards = createCompatibilityCardRegistry((descriptors) => installed.push(descriptors));
  const api = { request() {} } as any;
  const nativeConfiguration = { begin() {} } as any;
  const configurationPersistence = { globals: {}, saveButtonConfig() {}, saveSubpageEntity() {} } as any;
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
  const screenSchedule = {} as any;
  const screensaver = {} as any;
  const settingsUi = {} as any;
  const voiceServices = {} as any;
  const state = { grid: [] } as any;
  const model = {} as any;
  const dom = {} as any;
  const context = createApplicationContext({
    layout: createApplicationLayoutState("guition-esp32-p4-jc8012p4a1", profile),
    model,
    state,
    api,
    nativeConfiguration,
    configurationPersistence,
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
  equal(context.configuration.native, nativeConfiguration, "context retains native persistence");
  equal(context.configuration.persistence, configurationPersistence, "context retains save persistence");
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
  equal(context.controllers.screenSchedule, screenSchedule, "context retains schedule settings ownership");
  equal(context.controllers.screensaver, screensaver, "context retains screensaver settings ownership");
  equal(context.controllers.settingsUi, settingsUi, "context retains settings DOM ownership");
  equal(context.controllers.voiceServices, voiceServices, "context retains voice settings ownership");
  equal(context.controllers.reconnect, reconnect, "context retains reconnect ownership");

  cards.registerCompatibility({ example: { configurable: true, value: true } });
  equal(cards.compatibilityDefinitionCount, 1, "registry counts compatibility definitions");
  equal(installed.length, 1, "registry delegates compatibility installation");

  Object.assign(globalThis, {
    GENERATED_ICON_EXCEPTIONS: {},
    GENERATED_ICON_NAMES: [],
    GENERATED_DOMAIN_ICONS: {},
  });
  const compatibilityGlobals: Record<string, unknown> = {};
  Object.defineProperties(compatibilityGlobals, installCore(context.layout));
  compatibilityGlobals.GRID_COLS = 6;
  compatibilityGlobals.GRID_ROWS = 2;
  compatibilityGlobals.NUM_SLOTS = 10;
  equal(context.layout.gridCols, 6, "legacy grid column writes update context state");
  equal(context.layout.gridRows, 2, "legacy grid row writes update context state");
  equal(context.layout.numSlots, 10, "legacy slot writes update context state");
}
