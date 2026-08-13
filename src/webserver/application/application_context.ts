import type { DeviceApi } from "../api/device_api";
import type { NativePanelConfigController } from "../controllers/native_panel_config_controller";
import type { ReconnectController } from "../features/reconnect";
import type { CardEditorDraftController } from "../features/card_editor_draft_controller";
import type { CardEditorSaveController } from "../features/card_editor_save_controller";
import type { CardEditorValidationController } from "../features/card_editor_validation_controller";
import type { PreviewPlacementController } from "../features/preview_placement_controller";
import type { AlarmDelayAudioController } from "../features/alarm_delay_audio_controller";
import type { ClockBarController } from "../features/clock_bar_controller";
import type { CoverArtScreensaverController } from "../features/cover_art_screensaver_controller";
import type { MediaPlaybackController } from "../features/media_playback_controller";
import type { ScreenScheduleController } from "../features/screen_schedule_controller";
import type { ScreensaverController } from "../features/screensaver_controller";
import type { SettingsUiFeature } from "../features/settings";
import type { VoiceServicesController } from "../features/voice_services_controller";
import type { BackupFeature } from "../features/backup";
import type { BackupExportController } from "../features/backup_export_controller";
import type { BackupFileController } from "../features/backup_file_controller";
import type { BackupImportController } from "../features/backup_import_controller";
import type { BackupRestoreController } from "../features/backup_restore_controller";
import type { AppBackupFeature } from "./app_backup";
import type { DeviceConfig, AppState } from "../state/types";
import type { ConfigPersistenceFeature } from "./config_post_api";
import type { CardRegistry } from "./card_registry";
import type { ConfigSensorOptionsFeature } from "./config_sensor_options";
import type { ConfigMediaOptionsFeature } from "./config_media_options";
import type { ConfigImageOptionsFeature } from "./config_image_options";
import type { ConfigWeatherOptionsFeature } from "./config_weather_options";
import type { ConfigWebhookOptionsFeature } from "./config_webhook_options";
import type { ConfigInternalRelayOptionsFeature } from "./config_internal_relay_options";
import type { ConfigRobotCardOptionsFeature } from "./config_robot_card_options";
import type { ConfigLockOptionsFeature } from "./config_lock_options";
import type { ConfigDateTimeOptionsFeature } from "./config_date_time_options";
import type { ConfigModalTabOptionsFeature } from "./config_modal_tab_options";
import type { ConfigAccessClimateAlarmOptionsFeature } from "./config_access_climate_alarm_options";
import type { ConfigConfirmationOptionsFeature } from "./config_confirmation_options";
import type { ConfigCodecFeature } from "./config_codec";
import type { UiRuntimeState } from "./state";
import type { AppTitleFeature } from "./app_title";
import type { CoreFeature } from "./core";
import type { EnvironmentStateFeature } from "./environment_state";
import type { ScreenScheduleStateFeature } from "./screen_schedule_state";
import type { ScreensaverTimeoutFeature } from "./screensaver_timeout";
import type { ScreenRotationFeature } from "./screen_rotation_state";

export type { CardRegistry } from "./card_registry";

export interface ApplicationLayoutState {
  deviceId: string;
  config: DeviceConfig;
  numSlots: number;
  totalSlots: number;
  gridCols: number;
  gridRows: number;
}

export interface ApplicationDomServices {
  readonly document: Document;
  readonly window: Window;
  readonly fetch: typeof fetch;
  readonly createEventSource: () => EventSource;
  readonly schedule: typeof setTimeout;
}

export interface ApplicationContext {
  readonly device: {
    readonly id: string;
    readonly profile: DeviceConfig;
  };
  readonly model: typeof import("../model");
  readonly state: AppState;
  readonly runtime: UiRuntimeState;
  readonly core: CoreFeature;
  readonly layout: ApplicationLayoutState;
  readonly api: DeviceApi;
  readonly configuration: {
    readonly native: NativePanelConfigController;
    readonly persistence: ConfigPersistenceFeature;
    readonly options: ConfigSensorOptionsFeature;
    readonly mediaOptions: ConfigMediaOptionsFeature;
    readonly imageOptions: ConfigImageOptionsFeature;
    readonly weatherOptions: ConfigWeatherOptionsFeature;
    readonly webhookOptions: ConfigWebhookOptionsFeature;
    readonly internalRelayOptions: ConfigInternalRelayOptionsFeature;
    readonly robotOptions: ConfigRobotCardOptionsFeature;
    readonly lockOptions: ConfigLockOptionsFeature;
    readonly dateTimeOptions: ConfigDateTimeOptionsFeature;
    readonly modalTabs: ConfigModalTabOptionsFeature;
    readonly accessClimateAlarm: ConfigAccessClimateAlarmOptionsFeature;
    readonly confirmationOptions: ConfigConfirmationOptionsFeature;
    readonly codec: ConfigCodecFeature;
  };
  readonly backup: {
    readonly contract: BackupFeature;
    readonly export: BackupExportController;
    readonly file: BackupFileController;
    readonly import: BackupImportController<any, any, any>;
    readonly restore: BackupRestoreController<any, any>;
    readonly application: AppBackupFeature;
  };
  readonly controllers: {
    readonly alarmDelayAudio: AlarmDelayAudioController;
    readonly cardEditorDraft: CardEditorDraftController;
    readonly cardEditorSave: CardEditorSaveController;
    readonly cardEditorValidation: CardEditorValidationController;
    readonly clockBar: ClockBarController;
    readonly coverArtScreensaver: CoverArtScreensaverController;
    readonly mediaPlayback: MediaPlaybackController;
    readonly pageTitle: AppTitleFeature;
    readonly previewPlacement: PreviewPlacementController;
    readonly reconnect: ReconnectController<unknown>;
    readonly screenSchedule: ScreenScheduleController;
    readonly screenScheduleState: ScreenScheduleStateFeature;
    readonly screenRotation: ScreenRotationFeature;
    readonly screensaver: ScreensaverController;
    readonly screensaverTimeout: ScreensaverTimeoutFeature;
    readonly settingsUi: SettingsUiFeature;
    readonly voiceServices: VoiceServicesController;
    readonly environment: EnvironmentStateFeature;
  };
  readonly dom: ApplicationDomServices;
  readonly cards: CardRegistry;
}

export interface ApplicationContextOptions {
  readonly layout: ApplicationLayoutState;
  readonly model: typeof import("../model");
  readonly state: AppState;
  readonly runtime: UiRuntimeState;
  readonly core: CoreFeature;
  readonly api: DeviceApi;
  readonly nativeConfiguration: NativePanelConfigController;
  readonly configurationPersistence: ConfigPersistenceFeature;
  readonly configurationOptions: ConfigSensorOptionsFeature;
  readonly mediaConfigurationOptions: ConfigMediaOptionsFeature;
  readonly imageConfigurationOptions: ConfigImageOptionsFeature;
  readonly weatherConfigurationOptions: ConfigWeatherOptionsFeature;
  readonly webhookConfigurationOptions: ConfigWebhookOptionsFeature;
  readonly internalRelayConfigurationOptions: ConfigInternalRelayOptionsFeature;
  readonly robotConfigurationOptions: ConfigRobotCardOptionsFeature;
  readonly lockConfigurationOptions: ConfigLockOptionsFeature;
  readonly dateTimeConfigurationOptions: ConfigDateTimeOptionsFeature;
  readonly modalTabOptions: ConfigModalTabOptionsFeature;
  readonly accessClimateAlarmOptions: ConfigAccessClimateAlarmOptionsFeature;
  readonly confirmationOptions: ConfigConfirmationOptionsFeature;
  readonly configurationCodec: ConfigCodecFeature;
  readonly backupContract: BackupFeature;
  readonly backupExport: BackupExportController;
  readonly backupFile: BackupFileController;
  readonly backupImport: BackupImportController<any, any, any>;
  readonly backupRestore: BackupRestoreController<any, any>;
  readonly backupApplication: AppBackupFeature;
  readonly alarmDelayAudio: AlarmDelayAudioController;
  readonly cardEditorDraft: CardEditorDraftController;
  readonly cardEditorSave: CardEditorSaveController;
  readonly cardEditorValidation: CardEditorValidationController;
  readonly clockBar: ClockBarController;
  readonly coverArtScreensaver: CoverArtScreensaverController;
  readonly mediaPlayback: MediaPlaybackController;
  readonly pageTitle: AppTitleFeature;
  readonly previewPlacement: PreviewPlacementController;
  readonly reconnect: ReconnectController<unknown>;
  readonly screenSchedule: ScreenScheduleController;
  readonly screenScheduleState: ScreenScheduleStateFeature;
  readonly screenRotation: ScreenRotationFeature;
  readonly screensaver: ScreensaverController;
  readonly screensaverTimeout: ScreensaverTimeoutFeature;
  readonly settingsUi: SettingsUiFeature;
  readonly voiceServices: VoiceServicesController;
  readonly environment: EnvironmentStateFeature;
  readonly dom: ApplicationDomServices;
  readonly cards: CardRegistry;
}

export function createApplicationLayoutState(
  deviceId: string,
  config: DeviceConfig,
): ApplicationLayoutState {
  return {
    deviceId,
    config,
    numSlots: config.slots,
    totalSlots: config.slots,
    gridCols: config.cols,
    gridRows: config.rows,
  };
}

export function createApplicationContext(options: ApplicationContextOptions): ApplicationContext {
  return {
    device: { id: options.layout.deviceId, profile: options.layout.config },
    model: options.model,
    state: options.state,
    runtime: options.runtime,
    core: options.core,
    layout: options.layout,
    api: options.api,
    configuration: {
      native: options.nativeConfiguration,
      persistence: options.configurationPersistence,
      options: options.configurationOptions,
      mediaOptions: options.mediaConfigurationOptions,
      imageOptions: options.imageConfigurationOptions,
      weatherOptions: options.weatherConfigurationOptions,
      webhookOptions: options.webhookConfigurationOptions,
      internalRelayOptions: options.internalRelayConfigurationOptions,
      robotOptions: options.robotConfigurationOptions,
      lockOptions: options.lockConfigurationOptions,
      dateTimeOptions: options.dateTimeConfigurationOptions,
      modalTabs: options.modalTabOptions,
      accessClimateAlarm: options.accessClimateAlarmOptions,
      confirmationOptions: options.confirmationOptions,
      codec: options.configurationCodec,
    },
    backup: {
      contract: options.backupContract,
      export: options.backupExport,
      file: options.backupFile,
      import: options.backupImport,
      restore: options.backupRestore,
      application: options.backupApplication,
    },
    controllers: {
      alarmDelayAudio: options.alarmDelayAudio,
      cardEditorDraft: options.cardEditorDraft,
      cardEditorSave: options.cardEditorSave,
      cardEditorValidation: options.cardEditorValidation,
      clockBar: options.clockBar,
      coverArtScreensaver: options.coverArtScreensaver,
      mediaPlayback: options.mediaPlayback,
      pageTitle: options.pageTitle,
      previewPlacement: options.previewPlacement,
      reconnect: options.reconnect,
      screenSchedule: options.screenSchedule,
      screenScheduleState: options.screenScheduleState,
      screenRotation: options.screenRotation,
      screensaver: options.screensaver,
      screensaverTimeout: options.screensaverTimeout,
      settingsUi: options.settingsUi,
      voiceServices: options.voiceServices,
      environment: options.environment,
    },
    dom: options.dom,
    cards: options.cards,
  };
}
