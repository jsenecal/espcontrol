import type { DeviceApi } from "../api/device_api";
import type { NativePanelConfigController } from "../controllers/native_panel_config_controller";
import type { ReconnectController } from "../features/reconnect";
import type { CardEditorDraftController } from "../features/card_editor_draft_controller";
import type { CardEditorSaveController } from "../features/card_editor_save_controller";
import type { CardEditorValidationController } from "../features/card_editor_validation_controller";
import type { PreviewPlacementController } from "../features/preview_placement_controller";
import type { DeviceConfig, AppState } from "../state/types";
import type { ConfigPersistenceFeature } from "./config_post_api";
import type { GlobalDescriptors } from "../runtime/globals";

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
  readonly fetch: typeof fetch;
  readonly createEventSource: () => EventSource;
  readonly schedule: typeof setTimeout;
}

/**
 * Temporary bridge for card modules that still return global descriptors.
 * Phase three replaces the descriptors with typed card definitions while the
 * registry instance and its place in ApplicationContext stay stable.
 */
export interface CardRegistry {
  readonly compatibilityDefinitionCount: number;
  registerCompatibility(descriptors: GlobalDescriptors): void;
}

export function createCompatibilityCardRegistry(
  install: (descriptors: GlobalDescriptors) => void,
): CardRegistry {
  let compatibilityDefinitionCount = 0;
  return {
    get compatibilityDefinitionCount() {
      return compatibilityDefinitionCount;
    },
    registerCompatibility(descriptors) {
      compatibilityDefinitionCount += Object.keys(descriptors).length;
      install(descriptors);
    },
  };
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
  };
  readonly controllers: {
    readonly cardEditorDraft: CardEditorDraftController;
    readonly cardEditorSave: CardEditorSaveController;
    readonly cardEditorValidation: CardEditorValidationController;
    readonly previewPlacement: PreviewPlacementController;
    readonly reconnect: ReconnectController<unknown>;
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
  readonly cardEditorDraft: CardEditorDraftController;
  readonly cardEditorSave: CardEditorSaveController;
  readonly cardEditorValidation: CardEditorValidationController;
  readonly previewPlacement: PreviewPlacementController;
  readonly reconnect: ReconnectController<unknown>;
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
    },
    controllers: {
      cardEditorDraft: options.cardEditorDraft,
      cardEditorSave: options.cardEditorSave,
      cardEditorValidation: options.cardEditorValidation,
      previewPlacement: options.previewPlacement,
      reconnect: options.reconnect,
    },
    dom: options.dom,
    cards: options.cards,
  };
}
