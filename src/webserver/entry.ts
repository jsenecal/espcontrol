import * as DeviceConfig from "./device_config";
import * as Model from "./model";
import { createDeviceApi } from "./api/device_api";
import { NTP_SERVER_DEFAULTS, defaultTimezoneOptionsForDevice } from "./state/app_state";
import * as AppInstance from "./state/app_instance";
import { state } from "./state/app_instance";
import { textSpan } from "./application/ui_primitives";
import { installGlobals } from "./runtime/globals";
import { installCore } from "./application/core";
import {
  createApplicationContext,
  createApplicationLayoutState,
  type ApplicationContext,
  type ApplicationDomServices,
} from "./application/application_context";
import { createCardRegistry } from "./application/card_registry";
import { createWebStyles } from "./application/styles";
import { createUiRuntimeState } from "./application/state";
import { installLanguageStateModule } from "./application/language_state";
import { installEnvironmentStateModule } from "./application/environment_state";
import { installScreenRotationStateModule } from "./application/screen_rotation_state";
import { installScreenScheduleStateModule } from "./application/screen_schedule_state";
import { installNtpStateModule } from "./application/ntp_state";
import { installAppearanceStateModule } from "./application/appearance_state";
import { installIdleStateModule } from "./application/idle_state";
import { installArtworkStateModule } from "./application/artwork_state";
import { installScreensaverStateModule } from "./application/screensaver_state";
import { installFirmwareVersionStateModule } from "./application/firmware_version_state";
import { installEntityStateModule } from "./application/entity_state";
import { installClockBarStateModule } from "./application/clock_bar_state";
import { installFirmwareUpdateStateModule } from "./application/firmware_update_state";
import { installScreensaverTimeoutModule } from "./application/screensaver_timeout";
import { installC6FirmwareUiModule } from "./application/c6_firmware_ui";
import { installGridModule } from "./application/grid";
import { installApiModule } from "./application/api";
import { installFirmwareUpdatePostApiModule } from "./application/firmware_update_post_api";
import { installPublicFirmwareInstallModule } from "./application/public_firmware_install";
import { createConfigMediaOptionsFeature } from "./application/config_media_options";
import { createConfigImageOptionsFeature } from "./application/config_image_options";
import { createConfigWeatherOptionsFeature } from "./application/config_weather_options";
import { createConfigWebhookOptionsFeature } from "./application/config_webhook_options";
import { createConfigInternalRelayOptionsFeature } from "./application/config_internal_relay_options";
import { createConfigModalTabOptionsFeature } from "./application/config_modal_tab_options";
import { createConfigSensorOptionsFeature } from "./application/config_sensor_options";
import { createConfigConfirmationOptionsFeature } from "./application/config_confirmation_options";
import { createConfigAccessClimateAlarmOptionsFeature } from "./application/config_access_climate_alarm_options";
import { createConfigCodecFeature } from "./application/config_codec";
import { createNativePanelConfigMigrationController } from "./application/native_panel_config_migration";
import { createConfigPersistenceFeature } from "./application/config_post_api";
import { installStateLoaderApiModule } from "./application/state_loader_api";
import { installArtworkPostApiModule } from "./application/artwork_post_api";
import { installScreenSchedulePostApiModule } from "./application/screen_schedule_post_api";
import { installClockBarPostApiModule } from "./application/clock_bar_post_api";
import { installControlsModule } from "./application/controls";
import { installControlsShellModule } from "./application/controls_shell";
import { installSettingsPageHelpersModule } from "./application/settings_page_helpers";
import { installSettingsScheduleSectionModule } from "./application/settings_schedule_section";
import { installSettingsCoverArtSectionModule } from "./application/settings_cover_art_section";
import { installSettingsSystemSectionModule } from "./application/settings_system_section";
import { installSettingsPageModule } from "./application/settings_page";
import { installControlsFieldsModule } from "./application/controls_fields";
import { installPreviewRenderModule } from "./application/preview_render";
import { installButtonSettingsSelectionModule } from "./application/button_settings_selection";
import { installButtonSettingsRenderQueueModule } from "./application/button_settings_render_queue";
import { installButtonSettingsIconPickerModule } from "./application/button_settings_icon_picker";
import { installButtonSettingsModule } from "./application/button_settings";
import { installPreviewGridPlacementModule } from "./application/preview_grid_placement";
import { installPreviewContextMenuModule } from "./application/preview_context_menu";
import { installPreviewClipboardModule } from "./application/preview_clipboard";
import { installPreviewInteractionsModule } from "./application/preview_interactions";
import { createCardEditorDraftController } from "./features/card_editor_draft_controller";
import { createCardEditorValidationController } from "./features/card_editor_validation_controller";
import { createCardEditorSaveController } from "./features/card_editor_save_controller";
import { createPreviewPlacementController } from "./features/preview_placement_controller";
import { createClockBarController } from "./features/clock_bar_controller";
import { createVoiceServicesController } from "./features/voice_services_controller";
import { createScreenScheduleController } from "./features/screen_schedule_controller";
import { createSettingsUiFeature } from "./features/settings";
import { createAlarmDelayAudioController } from "./features/alarm_delay_audio_controller";
import { createScreensaverController } from "./features/screensaver_controller";
import { createCoverArtScreensaverController } from "./features/cover_art_screensaver_controller";
import { createMediaPlaybackController } from "./features/media_playback_controller";
import { createBackupImportController } from "./features/backup_import_controller";
import { createBackupExportController } from "./features/backup_export_controller";
import { createBackupFileController } from "./features/backup_file_controller";
import { createBackupRestoreController } from "./features/backup_restore_controller";
import { createBackupFeature } from "./features/backup";
import { installBackupContractModule } from "./application/backup_contract";
import { createAppBackupFeature } from "./application/app_backup";
import { installAppStatusPreviewModule } from "./application/app_status_preview";
import { createAppTitleFeature } from "./application/app_title";
import { installAppConfigEventsModule } from "./application/app_config_events";
import { installAppStateEventHandlersModule } from "./application/app_state_event_handlers";
import { installAppEventsModule } from "./application/app_events";
import { installAppModule } from "./application/app";
import { installAppStartModule } from "./application/app_start";
import { createReconnectController } from "./features/reconnect";
import type { SseHandlerFactory } from "./application/app_state_event_handlers";
import { registerActionCardTypes } from "./cards/action";
import { registerAlarmCardTypes } from "./cards/alarm";
import { registerCalendarCardTypes } from "./cards/calendar";
import { registerClimateCardTypes } from "./cards/climate";
import { registerClockCardTypes } from "./cards/clock";
import { createCoverLikeCardRegistration } from "./cards/cover_like_card";
import { registerDoorWindowCardTypes } from "./cards/door_window";
import { registerEntityModeCardHelpers } from "./cards/entity_mode_card";
import { registerFanCardTypes } from "./cards/fan";
import { registerGarageCardTypes } from "./cards/garage";
import { registerGateCardTypes } from "./cards/gate";
import { registerImageCardTypes } from "./cards/image";
import { registerInternalCardTypes } from "./cards/internal";
import { registerLawnMowerCardTypes } from "./cards/lawn_mower";
import { registerLightTemperatureCardTypes } from "./cards/light_temperature";
import { registerLockCardTypes } from "./cards/lock";
import { registerMediaCardTypes } from "./cards/media";
import { registerPresenceCardTypes } from "./cards/presence";
import { registerPushCardTypes } from "./cards/push";
import { registerScreenLockCardTypes } from "./cards/screen_lock";
import { registerSensorCardTypes } from "./cards/sensor";
import { registerSliderCardTypes } from "./cards/slider";
import { registerSubpageCardTypes } from "./cards/subpage";
import { registerSwitchCardTypes } from "./cards/switch";
import { registerTimezoneCardTypes } from "./cards/timezone";
import { registerVacuumCardTypes } from "./cards/vacuum";
import { registerWeatherCardTypes } from "./cards/weather";
import { registerWeatherForecastCardTypes } from "./cards/weather_forecast";
import { registerWebhookCardTypes } from "./cards/webhook";
import { installAppTestHooks } from "./testing/app_test_hooks";
import { installAppTestHooksConfig } from "./testing/app_test_hooks_config";
import { installAppTestHooksPreview } from "./testing/app_test_hooks_preview";
import { installAppTestHooksBackup } from "./testing/app_test_hooks_backup";
import { installAppTestHooksSettings } from "./testing/app_test_hooks_settings";

declare const __ESPCONTROL_TEST_HOOKS_ENABLED__: boolean;

const startupState = globalThis as typeof globalThis & {
  __ESPCONTROL_START_EMBEDDED__?: () => void;
  __ESPCONTROL_RELOAD_EMBEDDED__?: () => void;
  __ESPCONTROL_UI_STARTED__?: boolean;
  __ESPCONTROL_UI_STARTING__?: boolean;
};

function installApplicationCompatibility(context: ApplicationContext): void {
  installGlobals(installCore(context.layout, context.configuration.codec, context.runtime));
  installGlobals(installLanguageStateModule(context.runtime));
  const voiceServicesController = context.controllers.voiceServices;
  installGlobals(installEnvironmentStateModule(
    voiceServicesController,
    () => defaultTimezoneOptionsForDevice(context.device.profile),
  ));
  installGlobals(installScreenRotationStateModule(context.runtime));
  const screenScheduleController = context.controllers.screenSchedule;
  installGlobals(installScreenScheduleStateModule(screenScheduleController, context.runtime));
  installGlobals(installNtpStateModule(context.runtime));
  installGlobals(installAppearanceStateModule(context.runtime));
  installGlobals(installIdleStateModule(context.runtime));
  installGlobals(installArtworkStateModule());
  installGlobals(installScreensaverStateModule());
  installGlobals(installFirmwareVersionStateModule(context.runtime));
  installGlobals(installEntityStateModule());
  const clockBarController = context.controllers.clockBar;
  installGlobals(installClockBarStateModule(clockBarController, context.runtime));
  installGlobals(installFirmwareUpdateStateModule(context.runtime));
  installGlobals(installScreensaverTimeoutModule(context.runtime));
  installGlobals(installC6FirmwareUiModule(context.runtime));
  installGlobals(installGridModule(context.configuration.codec, context.runtime));
  const deviceApi = context.api;
  const nativePanelConfig = context.configuration.native;
  const configPersistence = context.configuration.persistence;
  const cardEditorDraft = context.controllers.cardEditorDraft;
  const cardEditorValidation = context.controllers.cardEditorValidation;
  const previewPlacementController = context.controllers.previewPlacement;
  installGlobals(installApiModule(nativePanelConfig, deviceApi));
  installGlobals(installFirmwareUpdatePostApiModule());
  installGlobals(installPublicFirmwareInstallModule(deviceApi));
  const cardEditorSave = context.controllers.cardEditorSave;
  installGlobals(configPersistence.globals);
  installGlobals(installStateLoaderApiModule(context.runtime));
  installGlobals(installArtworkPostApiModule());
  installGlobals(installScreenSchedulePostApiModule());
  installGlobals(installClockBarPostApiModule());
  installGlobals(installControlsModule());
  installGlobals(installControlsShellModule(context.runtime));
  const settingsUiFeature = context.controllers.settingsUi;
  const alarmDelayAudioController = context.controllers.alarmDelayAudio;
  const screensaverController = context.controllers.screensaver;
  const coverArtScreensaverController = context.controllers.coverArtScreensaver;
  const mediaPlaybackController = context.controllers.mediaPlayback;
  installGlobals(installSettingsPageHelpersModule({
    settingsUiFeature,
    alarmDelayAudio: alarmDelayAudioController,
    screensaver: screensaverController,
    coverArtScreensaver: coverArtScreensaverController,
    mediaPlayback: mediaPlaybackController,
    codec: context.configuration.codec,
    runtime: context.runtime,
  }));
  installGlobals(installSettingsScheduleSectionModule(context.configuration.codec, context.runtime));
  installGlobals(installSettingsCoverArtSectionModule(context.configuration.codec, context.runtime));
  installGlobals(installSettingsPageModule(context.configuration.codec, context.runtime));
  installGlobals(installControlsFieldsModule(context.cards, context.configuration.options));
  installGlobals(installPreviewRenderModule({
    document: context.dom.document,
    layout: context.layout,
    cards: context.cards,
    confirmationOptions: context.configuration.confirmationOptions,
    codec: context.configuration.codec,
    runtime: context.runtime,
  }));
  installGlobals(installButtonSettingsSelectionModule(context.runtime));
  installGlobals(installButtonSettingsRenderQueueModule(context.runtime));
  installGlobals(installButtonSettingsIconPickerModule());
  installGlobals(installButtonSettingsModule(
    cardEditorDraft, cardEditorValidation, cardEditorSave, configPersistence, context.cards,
    context.configuration.imageOptions,
    context.configuration.confirmationOptions,
    context.configuration.codec,
    context.layout,
    context.runtime,
  ));
  installGlobals(installPreviewGridPlacementModule({
    controller: previewPlacementController,
    layout: context.layout,
    codec: context.configuration.codec,
  }));
  installGlobals(installPreviewContextMenuModule({
    document: context.dom.document,
    window: context.dom.window,
    layout: context.layout,
    cards: context.cards,
    codec: context.configuration.codec,
  }));
  installGlobals(installPreviewClipboardModule({
    configPersistence,
    document: context.dom.document,
    layout: context.layout,
    cards: context.cards,
    imageOptions: context.configuration.imageOptions,
    codec: context.configuration.codec,
  }));
  installGlobals(installPreviewInteractionsModule({
    cardEditorDraft,
    configPersistence,
    layout: context.layout,
    window: context.dom.window,
    imageOptions: context.configuration.imageOptions,
    codec: context.configuration.codec,
    runtime: context.runtime,
  }));
  installGlobals(installBackupContractModule(context.backup.contract, context.configuration.codec));
  const backupUiFeature = context.backup.application;
  installGlobals(installSettingsSystemSectionModule({
    exportBackup: backupUiFeature.exportConfig,
    importBackup: backupUiFeature.importConfig,
  }, context.runtime));
  installGlobals(backupUiFeature.globals);
  installGlobals(installAppStatusPreviewModule(context.runtime));
  installGlobals(installAppConfigEventsModule(configPersistence, context.configuration.codec));
  let sseHandlerFactory: SseHandlerFactory | undefined;
  installGlobals(installAppStateEventHandlersModule(context.runtime, (factory) => {
    sseHandlerFactory = factory;
  }));
  const reconnectController = context.controllers.reconnect;
  if (!sseHandlerFactory) throw new Error("SSE handler factory was not initialized");
  installGlobals(installAppEventsModule(
    reconnectController, sseHandlerFactory, context.runtime, context.controllers.pageTitle,
  ));
  installGlobals(installAppModule(
    context.controllers.pageTitle,
    createWebStyles(context.layout.config.dragAnimation),
  ));
}

function installCardCompatibility(context: ApplicationContext): void {
  const registry = context.cards;
  const coverLikeCards = createCoverLikeCardRegistration(registry);
  registry.registerCompatibility(registerActionCardTypes(registry, context.configuration.confirmationOptions));
  registry.registerCompatibility(registerAlarmCardTypes(registry, context.configuration.accessClimateAlarm));
  registry.registerCompatibility(registerCalendarCardTypes(registry));
  registerClimateCardTypes(
    registry,
    context.configuration.modalTabs,
    context.configuration.accessClimateAlarm,
  );
  registerClockCardTypes(registry);
  registry.registerCompatibility(coverLikeCards.descriptors);
  registerDoorWindowCardTypes(registry, context.configuration.options);
  registry.registerCompatibility(registerEntityModeCardHelpers());
  registry.registerCompatibility(registerFanCardTypes(registry, context.configuration.modalTabs));
  registry.registerCompatibility(registerGarageCardTypes(
    coverLikeCards.register,
    context.configuration.accessClimateAlarm,
    context.configuration.confirmationOptions,
  ));
  registry.registerCompatibility(registerGateCardTypes(
    coverLikeCards.register,
    context.configuration.accessClimateAlarm,
  ));
  registerImageCardTypes(
    registry,
    context.configuration.imageOptions,
  );
  registerInternalCardTypes(
    registry,
    context.configuration.internalRelayOptions,
    context.dom.document,
  );
  registry.registerCompatibility(registerLawnMowerCardTypes(registry));
  registry.registerCompatibility(registerLightTemperatureCardTypes(registry, context.configuration.modalTabs));
  registry.registerCompatibility(registerLockCardTypes(registry));
  registry.registerCompatibility(registerMediaCardTypes(
    registry,
    context.configuration.mediaOptions,
  ));
  registerPresenceCardTypes(registry, context.configuration.options);
  registerPushCardTypes(registry);
  registerScreenLockCardTypes(registry);
  registry.registerCompatibility(registerSensorCardTypes(registry, context.configuration.options));
  registry.registerCompatibility(registerSliderCardTypes(registry, context.configuration.modalTabs));
  registry.registerCompatibility(registerSubpageCardTypes(registry, context.configuration.codec));
  registerSwitchCardTypes(registry, context.configuration.confirmationOptions);
  registerTimezoneCardTypes(registry);
  registry.registerCompatibility(registerVacuumCardTypes(registry));
  const weatherCards = registerWeatherCardTypes(registry, context.configuration.weatherOptions);
  registerWeatherForecastCardTypes(registry, weatherCards);
  registerWebhookCardTypes(registry, context.configuration.webhookOptions);
}

function installTestCompatibility(context: ApplicationContext): void {
  installGlobals(installAppTestHooks());
  installGlobals(installAppTestHooksConfig(
    context.cards,
    context.configuration.options,
    context.configuration.mediaOptions,
    context.configuration.imageOptions,
    context.configuration.weatherOptions,
    context.configuration.webhookOptions,
    context.configuration.internalRelayOptions,
    context.configuration.modalTabs,
    context.configuration.accessClimateAlarm,
    context.configuration.confirmationOptions,
    context.configuration.codec,
  ));
  installGlobals(installAppTestHooksPreview(context.cards, context.configuration.codec, context.runtime));
  installGlobals(installAppTestHooksBackup());
  installGlobals(installAppTestHooksSettings(
    () => defaultTimezoneOptionsForDevice(context.device.profile),
  ));
}

function composeApplicationContext(): ApplicationContext {
  const fetchService: typeof fetch = typeof fetch === "function"
    ? fetch.bind(globalThis)
    : (() => Promise.reject(new Error("Fetch is not available"))) as typeof fetch;
  const dom: ApplicationDomServices = {
    document,
    window,
    fetch: fetchService,
    createEventSource: () => new EventSource("/events"),
    schedule: setTimeout,
  };
  const deviceApi = createDeviceApi((url, init) =>
    dom.fetch(url, init as RequestInit));
  const pageTitle = createAppTitleFeature({
    document: dom.document,
    eventStreamEnabled: () => {
      try { return new URLSearchParams(dom.window.location.search).get("events") === "1"; }
      catch (_) { return false; }
    },
    eventSourceAvailable: () => typeof EventSource === "function",
    createEventSource: dom.createEventSource,
  });
  const layout = createApplicationLayoutState(
    DeviceConfig.deviceId,
    DeviceConfig.deviceConfig,
  );
  const runtime = createUiRuntimeState(layout, dom.document);
  const nativePanelConfig = createNativePanelConfigMigrationController({
    deviceProfile: () => layout.deviceId,
    slotCount: () => layout.numSlots,
    entityName: (name) => entityName(name),
    entityNameForSlot: (name, slot) => entityNameForSlot(name, slot),
    normalizeHexColor: (value, fallback) => Model.normalizeHexColor(value, fallback),
    showBanner: (message, level) => showBanner(message, level),
    delay: (callback, milliseconds) => dom.schedule(callback, milliseconds),
  });
  const configurationPersistence = createConfigPersistenceFeature(nativePanelConfig, runtime);
  const cards = createCardRegistry(installGlobals);
  const configurationOptions = createConfigSensorOptionsFeature(cards);
  const mediaConfigurationOptions = createConfigMediaOptionsFeature(layout.config);
  const imageConfigurationOptions = createConfigImageOptionsFeature({
    layout,
    mediaOptions: mediaConfigurationOptions,
    showBanner: (message, kind) => showBanner(message, kind),
  });
  const weatherConfigurationOptions = createConfigWeatherOptionsFeature(layout.config);
  const webhookConfigurationOptions = createConfigWebhookOptionsFeature();
  const internalRelayConfigurationOptions = createConfigInternalRelayOptionsFeature(layout.config);
  const modalTabOptions = createConfigModalTabOptionsFeature({
    document: dom.document,
    renderButtonSettings: () => renderButtonSettings(),
  });
  const accessClimateAlarmOptions = createConfigAccessClimateAlarmOptionsFeature(modalTabOptions);
  const confirmationOptions = createConfigConfirmationOptionsFeature(accessClimateAlarmOptions);
  const configurationCodec = createConfigCodecFeature(
    cards,
    configurationOptions,
    mediaConfigurationOptions,
    imageConfigurationOptions,
    weatherConfigurationOptions,
    webhookConfigurationOptions,
    modalTabOptions,
    accessClimateAlarmOptions,
    confirmationOptions,
  );
  configurationPersistence.connectCodec(configurationCodec);
  const cardEditorDraft = createCardEditorDraftController({
    cloneCard: (button) => Model.cloneCardConfig(button),
    emptyCard: () => Model.emptyCardConfig(),
  });
  const cardEditorSave = createCardEditorSaveController({
    emptyCard: () => Model.emptyCardConfig(),
    copyCard: (target, source) => {
      Model.copyCardConfig(target, source);
      configurationCodec.normalizeButtonConfig(target);
    },
  });
  const cardEditorValidation = createCardEditorValidationController();
  const previewPlacement = createPreviewPlacementController();
  const voiceServices = createVoiceServicesController();
  const screenSchedule = createScreenScheduleController({
    trigger: (value, enabled) => Model.normalizeScheduleTrigger(value, enabled),
    sensorActivation: (value) => Model.normalizeScheduleSensorActivation(value),
    hour: (value, fallback) => Model.normalizeHour(value, fallback),
    mode: (value) => Model.normalizeScheduleMode(value),
    wakeTimeout: (value) => Model.normalizeScheduleWakeTimeout(value),
    wakeBrightness: (value) => Model.normalizeScheduleWakeBrightness(value),
    dimmedBrightness: (value) => Model.normalizeScheduleDimmedBrightness(value),
    clockBrightness: (value) => Model.normalizeScheduleClockBrightness(value),
  });
  const clockBar = createClockBarController();
  const settingsUi = createSettingsUiFeature({
    document: dom.document,
    textSpan: (text, className) => textSpan(text, className),
    createDisclosureChevron: (className) => createDisclosureChevron(className),
  });
  const alarmDelayAudio = createAlarmDelayAudioController({
    announcement: (value, fallback) => Model.normalizeAlarmDelayAnnouncement(value, fallback),
    beepVolume: (value) => Model.normalizeAlarmDelayBeepVolume(value),
    finalCountdown: (value) => Model.normalizeAlarmDelayFinalCountdown(value),
  });
  const screensaver = createScreensaverController({
    action: (value) => Model.normalizeScreensaverAction(value),
    dimBrightness: (value) => Model.normalizeScreensaverDimmedBrightness(value),
    clockBrightness: (value, fallback) => Model.normalizeClockBrightness(value, fallback),
  });
  const coverArtScreensaver = createCoverArtScreensaverController({
    delay: (value) => Model.normalizeCoverArtDelay(value),
    trackOverlayDuration: (value) => parseFloat(String(value)) || 0,
  });
  const mediaPlayback = createMediaPlaybackController();
  const backupContract = createBackupFeature({
    deviceId: layout.deviceId,
    gridCols: layout.gridCols,
    numSlots: layout.numSlots,
    normalizeButtonConfig: (button) => configurationCodec.normalizeButtonConfig(button),
    parseSubpageConfig: (value) => configurationCodec.parseSubpageConfig(value),
    serializeSubpageConfig: (subpage) => configurationCodec.serializeSubpageConfig(subpage),
    buildSubpageGrid: (subpage) => {
      configurationCodec.buildSubpageGridAndNormalizeOrder(subpage);
      return subpage.grid || [];
    },
  });
  const normalizeImportedPanelSettings = (settings: any) => {
    if (!settings) return null;
    return Model.normalizeBackupPanelSettings(settings, {
      timezone: state.timezone,
      language: state.language,
      clockFormat: state.clockFormat,
      clockFormatOptions: state.clockFormatOptions,
      ntpDefaults: NTP_SERVER_DEFAULTS,
      ntpServer1: state.ntpServer1,
      ntpServer2: state.ntpServer2,
      ntpServer3: state.ntpServer3,
      coverArtHomeAssistantProtocol: state.homeAssistantArtworkProtocol,
      coverArtHomeAssistantPort: state.coverArtHomeAssistantPort,
      autoUpdate: state.autoUpdate,
      updateFrequency: state.updateFrequency,
      updateFrequencyOptions: state.updateFreqOptions,
      screenRotationOptions: allScreenRotationOptions(),
    });
  };
  const gridColsForImportedSettings = (importedSettings: any): number => {
    const rotation = importedSettings ? importedSettings.screenRotation : state.screenRotation;
    const profile = isPortraitRotation(rotation) && layout.config.portrait
      ? layout.config.portrait
      : layout.config;
    return profile.cols || layout.config.cols;
  };
  const backupExport = createBackupExportController({
    serializeButtonConfig: (button) => configurationCodec.serializeButtonConfig(button),
    serializeSubpageConfig: (subpage) => configurationCodec.serializeSubpageConfig(subpage),
  });
  const backupImport = createBackupImportController<any, any, any, any>({
    normalizeBackup: (data) => backupContract.normalizeBackupConfig(data),
    normalizeSettings: normalizeImportedPanelSettings,
    gridColsForSettings: gridColsForImportedSettings,
    getGridCols: () => layout.gridCols,
    setGridCols: (gridCols) => { layout.gridCols = gridCols; },
    planBackupImport: (data, target) => backupContract.planBackupImport(data, target),
  });
  const backupRestore = createBackupRestoreController<any, any>({
    plan: backupImport.plan,
    warnings: (plannedImport) => plannedImport.backupPlan.warnings,
    showBanner: (message, kind) => showBanner(message, kind),
    setPostThrottle: (milliseconds) => setPostThrottle(milliseconds),
    resetPostQueueError: () => resetPostQueueError(),
    postQueueIdle: () => postQueueIdle(),
    postQueueHadError: () => postQueueHadError(),
  });
  const backupFile = createBackupFileController({
    transport: {
      download(content, filename) {
        const blob = new Blob([content], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = dom.document.createElement("a");
        link.href = url;
        link.download = filename;
        dom.document.body.appendChild(link);
        link.click();
        dom.document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      chooseJsonFile(onText, onError) {
        const input = dom.document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.style.display = "none";
        const cleanupInput = () => {
          if (input.parentNode) input.parentNode.removeChild(input);
        };
        input.addEventListener("cancel", cleanupInput);
        input.addEventListener("change", () => {
          if (!input.files || !input.files[0]) {
            cleanupInput();
            return;
          }
          const reader = new FileReader();
          reader.onerror = () => {
            cleanupInput();
            onError();
          };
          reader.onload = () => {
            cleanupInput();
            onText(String(reader.result || ""));
          };
          reader.readAsText(input.files[0]);
        });
        dom.document.body.appendChild(input);
        input.click();
      },
    },
    showBanner: (message, kind) => showBanner(message, kind),
  });
  const backupApplication = createAppBackupFeature({
    layout,
    backupExport,
    backupImport,
    backupRestore,
    backupFile,
    normalizeImportedPanelSettings,
    gridColsForImportedSettings,
    nativePanelConfig,
    codec: configurationCodec,
    runtime,
  });
  const reconnect = createReconnectController<unknown>({
    eventStreamEnabled: () => eventStreamEnabled(),
    loadInitialState: (handleState, markConnected) =>
      loadInitialState(handleState, markConnected),
    createEventSource: dom.createEventSource,
    getActiveSource: () => runtime.eventSource,
    setActiveSource: (source) => { runtime.eventSource = source; },
    schedule: (callback, delayMs) => dom.schedule(callback, delayMs),
  });
  return createApplicationContext({
    layout,
    model: Model,
    state: AppInstance.state,
    runtime,
    api: deviceApi,
    nativeConfiguration: nativePanelConfig,
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
    clockBar,
    coverArtScreensaver,
    mediaPlayback,
    pageTitle,
    previewPlacement,
    reconnect,
    screenSchedule,
    screensaver,
    settingsUi,
    voiceServices,
    dom,
    cards,
  });
}

function startEspControl(): void {
  if (startupState.__ESPCONTROL_UI_STARTED__ || startupState.__ESPCONTROL_UI_STARTING__) return;
  AppInstance.initializeAppState();

  const context = composeApplicationContext();

  installApplicationCompatibility(context);
  installCardCompatibility(context);
  if (__ESPCONTROL_TEST_HOOKS_ENABLED__) {
    installTestCompatibility(context);
  }
  installGlobals(installAppStartModule());
}

function startEmbeddedFallback(error: unknown): void {
  console.error("Unable to start EspControl", error);
  startupState.__ESPCONTROL_UI_STARTED__ = false;
  startupState.__ESPCONTROL_UI_STARTING__ = false;
  const reload = startupState.__ESPCONTROL_RELOAD_EMBEDDED__;
  if (typeof reload === "function") {
    reload();
    return;
  }
  const start = startupState.__ESPCONTROL_START_EMBEDDED__;
  if (typeof start === "function") start();
}

const deviceConfigReady = DeviceConfig.initializeDeviceConfig();
if (deviceConfigReady) {
  void deviceConfigReady.then(startEspControl).catch(startEmbeddedFallback);
} else {
  try {
    startEspControl();
  } catch (error) {
    startEmbeddedFallback(error);
  }
}
