export type ScreensaverBrightnessField = "clockBrightnessDay" | "clockBrightnessNight";

export interface ScreensaverState {
  readonly action: string;
  readonly clockBrightnessDay: number;
  readonly clockBrightnessNight: number;
  readonly dimBrightness: number;
}

export interface ScreensaverUiState {
  readonly mode: string;
  readonly clockVisible: boolean;
  readonly dimVisible: boolean;
  readonly dayBrightnessLabel: string;
  readonly nightBrightnessLabel: string;
  readonly dimBrightnessLabel: string;
}

export interface ScreensaverNormalizers {
  readonly action: (value: unknown) => string;
  readonly dimBrightness: (value: unknown) => number;
  readonly clockBrightness: (value: unknown, fallback: number) => number;
}

export interface ScreensaverController {
  uiState(state: ScreensaverState): ScreensaverUiState;
  setAction(state: ScreensaverState, action: unknown): ScreensaverState;
  setDimBrightness(state: ScreensaverState, value: unknown): ScreensaverState;
  setClockBrightness(
    state: ScreensaverState,
    field: ScreensaverBrightnessField,
    value: unknown,
  ): ScreensaverState;
}

/** Owns screensaver choices while the existing page remains its DOM and HTTP adapter. */
export function createScreensaverController(normalizers: ScreensaverNormalizers): ScreensaverController {
  return {
    uiState(state) {
      const mode = normalizers.action(state.action);
      return {
        mode,
        clockVisible: mode === "clock",
        dimVisible: mode === "dim",
        dayBrightnessLabel: `${Math.round(state.clockBrightnessDay)}%`,
        nightBrightnessLabel: `${Math.round(state.clockBrightnessNight)}%`,
        dimBrightnessLabel: `${Math.round(state.dimBrightness)}%`,
      };
    },
    setAction(state, action) {
      return { ...state, action: normalizers.action(action) };
    },
    setDimBrightness(state, value) {
      return { ...state, dimBrightness: normalizers.dimBrightness(value) };
    },
    setClockBrightness(state, field, value) {
      const fallback = field === "clockBrightnessNight"
        ? state.clockBrightnessDay
        : 35;
      return { ...state, [field]: normalizers.clockBrightness(value, fallback) };
    },
  };
}
