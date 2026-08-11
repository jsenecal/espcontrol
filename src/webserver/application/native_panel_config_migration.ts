import { NativePanelConfigController } from "../controllers/native_panel_config_controller";
import type { NativePanelConfigFetch, NativePanelConfigRequest, NativePanelConfigResponse } from "../features/native_panel_config";

/** Creates the typed configuration persistence controller for the browser app. */
export function createNativePanelConfigMigrationController(): NativePanelConfigController {
  const fetchNative: NativePanelConfigFetch | null = typeof fetch === "function"
    ? (path: string, request?: NativePanelConfigRequest) =>
      fetch(path, request as RequestInit) as unknown as Promise<NativePanelConfigResponse>
    : null;
  const controller = new NativePanelConfigController({
    fetch: fetchNative,
    deviceProfile: () => DEVICE_ID,
    slotCount: () => NUM_SLOTS,
    entityName: (name) => entityName(name),
    entityNameForSlot: (name, slot) => entityNameForSlot(name, slot),
    normalizeHexColor: (value, fallback) => normalizeHexColor(value, fallback),
    showBanner: (message, level) => showBanner(message, level),
    delay: (callback, milliseconds) => setTimeout(callback, milliseconds),
  });

  if (fetchNative) void controller.begin();
  return controller;
}
