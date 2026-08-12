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
import type { ConfigModalTabOptionsFeature } from "./config_modal_tab_options";
import type { ConfigAccessClimateAlarmOptionsFeature } from "./config_access_climate_alarm_options";

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
  readonly layout: ApplicationLayoutState;
  readonly api: DeviceApi;
  readonly configuration: {
    readonly native: NativePanelConfigController;
    readonly persistence: ConfigPersistenceFeature;
    readonly options: ConfigSensorOptionsFeature;
    readonly mediaOptions: ConfigMediaOptionsFeature;
    readonly imageOptions: ConfigImageOptionsFeature;
    readonly modalTabs: ConfigModalTabOptionsFeature;
    readonly accessClimateAlarm: ConfigAccessClimateAlarmOptionsFeature;
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
    readonly previewPlacement: PreviewPlacementController;
    readonly reconnect: ReconnectController<unknown>;
    readonly screenSchedule: ScreenScheduleController;
    readonly screensaver: ScreensaverController;
    readonly settingsUi: SettingsUiFeature;
    readonly voiceServices: VoiceServicesController;
  };
  readonly dom: ApplicationDomServices;
  readonly cards: CardRegistry;
}

export interface ApplicationContextOptions {
  readonly layout: ApplicationLayoutState;
  readonly model: typeof import("../model");
  readonly state: AppState;
  readonly api: DeviceApi;
  readonly nativeConfiguration: NativePanelConfigController;
  readonly configurationPersistence: ConfigPersistenceFeature;
  readonly configurationOptions: ConfigSensorOptionsFeature;
  readonly mediaConfigurationOptions: ConfigMediaOptionsFeature;
  readonly imageConfigurationOptions: ConfigImageOptionsFeature;
  readonly modalTabOptions: ConfigModalTabOptionsFeature;
  readonly accessClimateAlarmOptions: ConfigAccessClimateAlarmOptionsFeature;
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
  readonly previewPlacement: PreviewPlacementController;
  readonly reconnect: ReconnectController<unknown>;
  readonly screenSchedule: ScreenScheduleController;
  readonly screensaver: ScreensaverController;
  readonly settingsUi: SettingsUiFeature;
  readonly voiceServices: VoiceServicesController;
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
    layout: options.layout,
    api: options.api,
    configuration: {
      native: options.nativeConfiguration,
      persistence: options.configurationPersistence,
      options: options.configurationOptions,
      mediaOptions: options.mediaConfigurationOptions,
      imageOptions: options.imageConfigurationOptions,
      modalTabs: options.modalTabOptions,
      accessClimateAlarm: options.accessClimateAlarmOptions,
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
      previewPlacement: options.previewPlacement,
      reconnect: options.reconnect,
      screenSchedule: options.screenSchedule,
      screensaver: options.screensaver,
      settingsUi: options.settingsUi,
      voiceServices: options.voiceServices,
    },
    dom: options.dom,
    cards: options.cards,
  };
}
