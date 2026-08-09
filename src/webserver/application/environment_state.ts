import { state } from "../state/app_instance";
import { liveGlobal, staticGlobal, type GlobalDescriptors } from "../runtime/globals";
export function installEnvironmentStateModule(): GlobalDescriptors {
    // ── Environment State ──────────────────────────────────────────────────
    var _voiceServicesController: any = createVoiceServicesController();
    function voiceServicesSupported(this: any) {
        return !!(CFG.features && CFG.features.voiceServices);
    }
    function voiceServicesState(this: any) {
        return {
            supported: voiceServicesSupported(),
            enabled: !!state.voiceServicesOn,
        };
    }
    function applyVoiceServicesState(this: any, next?: any) {
        state.voiceServicesOn = next.enabled;
    }
    function voiceServicesUiState(this: any) {
        return _voiceServicesController.uiState(voiceServicesState());
    }
    function isHomeAssistantAutoTimezone(this: any, value?: any) {
        return String(value || "") === AUTO_TIMEZONE_OPTION;
    }
    function effectiveTimezoneOptionForWeb(this: any, value?: any) {
        if (!isHomeAssistantAutoTimezone(value))
            return value;
        var active: any = String(state && state.activeTimezone || "").trim();
        return active && !isHomeAssistantAutoTimezone(active) ? active : FALLBACK_TIMEZONE_OPTION;
    }
    function timezoneOptionsWithFallback(this: any, options?: any, selected?: any, preserveSelectedAuto?: any) {
        var list: any = Array.isArray(options) && options.length ? options.slice() : defaultTimezoneOptions();
        var supportsAuto: any = list.indexOf(AUTO_TIMEZONE_OPTION) !== -1;
        if (selected && list.indexOf(selected) === -1 &&
            (!isHomeAssistantAutoTimezone(selected) || supportsAuto || preserveSelectedAuto)) {
            list.unshift(selected);
        }
        return list;
    }
    function monthNameForIndex(this: any, index?: any) {
        var monthIndex: any = parseInt(index, 10);
        if (!isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11)
            return "Date";
        try {
            return new Intl.DateTimeFormat(normalizeLanguage(state.language), { month: "long" })
                .format(new Date(Date.UTC(2000, monthIndex, 1)));
        }
        catch (_) {
            return new Intl.DateTimeFormat("en", { month: "long" })
                .format(new Date(Date.UTC(2000, monthIndex, 1)));
        }
    }
    return {
        "_voiceServicesController": liveGlobal(() => _voiceServicesController, (value?: any) => { _voiceServicesController = value; }),
        "voiceServicesSupported": staticGlobal(voiceServicesSupported),
        "voiceServicesState": staticGlobal(voiceServicesState),
        "applyVoiceServicesState": staticGlobal(applyVoiceServicesState),
        "voiceServicesUiState": staticGlobal(voiceServicesUiState),
        "isHomeAssistantAutoTimezone": staticGlobal(isHomeAssistantAutoTimezone),
        "effectiveTimezoneOptionForWeb": staticGlobal(effectiveTimezoneOptionForWeb),
        "timezoneOptionsWithFallback": staticGlobal(timezoneOptionsWithFallback),
        "monthNameForIndex": staticGlobal(monthNameForIndex),
    };
}
