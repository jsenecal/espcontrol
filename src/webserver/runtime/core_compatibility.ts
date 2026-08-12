import type { ApplicationLayoutState } from "../application/application_context";
import type { CoreFeature } from "../application/core";
import { liveGlobal, staticGlobal, type GlobalDescriptors } from "./globals";

export function coreCompatibilityDescriptors(
  layout: ApplicationLayoutState,
  core: CoreFeature,
): GlobalDescriptors {
  return {
    DEVICE_ID: liveGlobal(() => layout.deviceId, (value) => { layout.deviceId = String(value || ""); }),
    CFG: liveGlobal(() => layout.config, (value) => { layout.config = value as any; }),
    NUM_SLOTS: liveGlobal(() => layout.numSlots, (value) => { layout.numSlots = value as number; }),
    TOTAL_SLOTS: liveGlobal(() => layout.totalSlots, (value) => { layout.totalSlots = value as number; }),
    GRID_COLS: liveGlobal(() => layout.gridCols, (value) => { layout.gridCols = value as number; }),
    GRID_ROWS: liveGlobal(() => layout.gridRows, (value) => { layout.gridRows = value as number; }),
    isPortraitRotation: staticGlobal(core.isPortraitRotation),
    activeLayout: staticGlobal(core.activeLayout),
    screenWidthPercent: staticGlobal(core.screenWidthPercent),
    previewLayoutScale: staticGlobal(core.previewLayoutScale),
    layoutSection: staticGlobal(core.layoutSection),
    scaledCqw: staticGlobal(core.scaledCqw),
    scaledCqwText: staticGlobal(core.scaledCqwText),
    syncPreviewGridTop: staticGlobal(core.syncPreviewGridTop),
    syncPreviewStyleVars: staticGlobal(core.syncPreviewStyleVars),
    normalizeGridSpansForLayout: staticGlobal(core.normalizeGridSpansForLayout),
    syncPreviewOrientation: staticGlobal(core.syncPreviewOrientation),
    subpageStateDisplayMode: staticGlobal(core.subpageStateDisplayMode),
    WEBSERVER_MOCK_NOW_ISO: liveGlobal(() => core.mockNowIso, (value) => { core.mockNowIso = value; }),
    webserverUseMockNowForTest: liveGlobal(() => core.useMockNowForTest, (value) => { core.useMockNowForTest = value; }),
    webserverMockNow: staticGlobal(core.mockNow),
    webserverNow: staticGlobal(core.now),
    withWebserverMockNow: staticGlobal(core.withMockNow),
  };
}
