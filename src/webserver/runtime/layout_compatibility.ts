import type { ApplicationLayoutState } from "../application/application_context";
import { liveGlobal, type GlobalDescriptors } from "./globals";

export function layoutCompatibilityDescriptors(layout: ApplicationLayoutState): GlobalDescriptors {
  return {
    DEVICE_ID: liveGlobal(() => layout.deviceId, (value) => { layout.deviceId = String(value || ""); }),
    NUM_SLOTS: liveGlobal(() => layout.numSlots, (value) => { layout.numSlots = value as number; }),
    TOTAL_SLOTS: liveGlobal(() => layout.totalSlots, (value) => { layout.totalSlots = value as number; }),
    GRID_COLS: liveGlobal(() => layout.gridCols, (value) => { layout.gridCols = value as number; }),
    GRID_ROWS: liveGlobal(() => layout.gridRows, (value) => { layout.gridRows = value as number; }),
  };
}
