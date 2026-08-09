import { screensaverControlState, timedSettingLabel } from "../../src/webserver/features/settings";
import { createAlarmDelayAudioController } from "../../src/webserver/features/alarm_delay_audio_controller";

function equal<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
}

export function runSettingsFeatureTests(): void {
  const clock = screensaverControlState("Clock", 35.4, 12.6, 8.2);
  equal(clock.mode, "clock", "clock action is normalized");
  equal(clock.clockVisible, true, "clock controls are shown for clock mode");
  equal(clock.dimVisible, false, "dim controls are hidden for clock mode");
  equal(clock.dayBrightnessLabel, "35%", "day brightness label retains rounding");
  equal(clock.nightBrightnessLabel, "13%", "night brightness label retains rounding");
  equal(clock.dimBrightnessLabel, "8%", "dim brightness label retains rounding");

  const format = (seconds: number): string => `${seconds} seconds`;
  equal(timedSettingLabel(-1, format), "Always", "negative duration means always");
  equal(timedSettingLabel(0, format), "Never", "zero duration means never");
  equal(timedSettingLabel(15, format), "15 seconds", "positive duration uses the injected formatter");

  const alarm = createAlarmDelayAudioController({
    announcement: (value, fallback) => String(value).trim() || fallback,
    beepVolume: (value) => Math.max(0.05, Math.min(1, Number(value))),
    finalCountdown: (value) => Math.max(0, Math.min(60, Math.round(Number(value)))),
  });
  const initial = {
    audioEnabled: false,
    ttsEnabled: true,
    entryAnnouncement: "Entry",
    exitAnnouncement: "Exit",
    beepVolume: 0.45,
    finalCountdown: 10,
  };
  equal(alarm.uiState(initial).audioOptionsVisible, false, "audio controls hide when audio is disabled");
  equal(alarm.uiState(initial).ttsOptionsVisible, false, "tts controls hide when audio is disabled");
  const enabled = alarm.setAudioEnabled(initial, true);
  equal(alarm.uiState(enabled).ttsOptionsVisible, true, "tts controls show when both toggles are enabled");
  equal(alarm.setAnnouncement(enabled, "entryAnnouncement", "  ", "Default").entryAnnouncement,
        "Default", "announcement changes use their fallback");
  equal(alarm.setBeepVolume(enabled, 2).beepVolume, 1, "volume changes are normalized");
  equal(alarm.setFinalCountdown(enabled, 80).finalCountdown, 60, "countdown changes are normalized");
}
