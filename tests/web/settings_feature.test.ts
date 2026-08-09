import { screensaverControlState, timedSettingLabel } from "../../src/webserver/features/settings";
import { createAlarmDelayAudioController } from "../../src/webserver/features/alarm_delay_audio_controller";
import { createScreensaverController } from "../../src/webserver/features/screensaver_controller";
import { createCoverArtScreensaverController } from "../../src/webserver/features/cover_art_screensaver_controller";
import { createMediaPlaybackController } from "../../src/webserver/features/media_playback_controller";
import { createVoiceServicesController } from "../../src/webserver/features/voice_services_controller";

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

  const screensaver = createScreensaverController({
    action: (value) => ["off", "dim", "clock"].includes(String(value)) ? String(value) : "off",
    dimBrightness: (value) => Math.max(1, Math.min(100, Number(value))),
    clockBrightness: (value, fallback) => Math.max(1, Math.min(100, Number(value) || fallback)),
  });
  const dim = {
    action: "dim",
    clockBrightnessDay: 35,
    clockBrightnessNight: 12,
    dimBrightness: 10,
  };
  equal(screensaver.uiState(dim).dimVisible, true, "dim controls show in dim mode");
  equal(screensaver.uiState(dim).clockVisible, false, "clock controls hide in dim mode");
  const clockMode = screensaver.setAction(dim, "clock");
  equal(screensaver.uiState(clockMode).clockVisible, true, "clock controls show in clock mode");
  equal(screensaver.setDimBrightness(clockMode, 200).dimBrightness, 100, "dim brightness is normalized");
  equal(screensaver.setClockBrightness(clockMode, "clockBrightnessNight", 0).clockBrightnessNight,
        35, "night brightness uses daytime brightness as its fallback");

  const coverArt = createCoverArtScreensaverController({
    delay: (value) => Math.max(0, Math.min(120, Number(value) || 0)),
    trackOverlayDuration: (value) => Math.max(0, Number(value) || 0),
  });
  const coverArtInitial = {
    enabled: false,
    delay: 10,
    trackOverlayDuration: 5,
    hideExternalInput: true,
    filteringEnabled: false,
    attributeConditions: "",
  };
  equal(coverArt.uiState(coverArtInitial).contentVisible, false, "cover art settings hide when disabled");
  const coverArtEnabled = coverArt.setEnabled(coverArtInitial, true);
  equal(coverArt.uiState(coverArtEnabled).badgeVisible, true, "cover art badge shows when enabled");
  equal(coverArt.setDelay(coverArtEnabled, 300).delay, 120, "cover art delay is normalized");
  equal(coverArt.setShowExternalSources(coverArtEnabled, true).hideExternalInput, false,
        "showing external sources clears the hide setting");
  equal(coverArt.setFilteringEnabled({ ...coverArtEnabled, attributeConditions: "app_id=music" }, false).attributeConditions,
        "", "turning filtering off clears its conditions");
  equal(coverArt.initialState({ ...coverArtEnabled, filteringEnabled: true }).filteringEnabled, false,
        "a freshly built empty filter starts disabled");
  equal(coverArt.normalize({ ...coverArtEnabled, filteringEnabled: true }).filteringEnabled, true,
        "an enabled empty filter remains visible while editing");
  equal(coverArt.uiState(coverArt.setAttributeConditions(coverArtInitial, "media_content_type=music")).filterOptionsVisible,
        true, "saved conditions keep filtering controls visible");

  const mediaPlayback = createMediaPlaybackController();
  const playbackInitial = {
    sleepPreventionEnabled: true,
    sleepPreventionEntity: "media_player.living_room",
    coverArtEntity: "media_player.living_room",
  };
  equal(mediaPlayback.uiState(playbackInitial).sleepPreventionEnabled, true,
        "sleep prevention state is shared by every settings surface");
  equal(mediaPlayback.setSleepPreventionEnabled(playbackInitial, false).sleepPreventionEnabled, false,
        "sleep prevention toggle updates its shared state");
  const changedEntity = mediaPlayback.setCoverArtEntity(playbackInitial, "media_player.kitchen");
  equal(changedEntity.coverArtEntity, "media_player.kitchen", "cover art entity is updated");
  equal(changedEntity.sleepPreventionEntity, "media_player.kitchen",
        "cover art entity remains mirrored to sleep prevention");

  const voiceServices = createVoiceServicesController();
  const voiceInitial = { supported: true, enabled: false };
  equal(voiceServices.uiState(voiceInitial).settingsVisible, true,
        "supported Voice Services appear in settings");
  equal(voiceServices.uiState(voiceInitial).iconVisible, false,
        "disabled Voice Services hide their preview icon");
  equal(voiceServices.uiState(voiceServices.setEnabled(voiceInitial, true)).iconVisible, true,
        "enabling Voice Services updates the preview icon");
  equal(voiceServices.uiState({ supported: false, enabled: true }).clockBarItemVisible, false,
        "unsupported Voice Services stay out of the clock bar");
}
