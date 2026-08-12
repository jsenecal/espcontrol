import { state } from "../state/app_instance";
import { staticGlobal, type GlobalDescriptors } from "../runtime/globals";
import type { ReconnectController } from "../features/reconnect";
import type { SseHandlerFactory } from "./app_state_event_handlers";
import type { UiRuntimeState } from "./state";

export function installAppEventsModule(
    reconnectController: ReconnectController<unknown>,
    createSseHandlers: SseHandlerFactory,
    runtime: UiRuntimeState,
): GlobalDescriptors {
    const els = runtime.els;
    // ── SSE ────────────────────────────────────────────────────────────────
    function connectEvents(this: any) {
        function markConnected(this: any) {
            resetStateForConnection(state);
            runtime.orderReceived = false;
            setConfigLocked(false);
            if (els.banner)
                els.banner.className = "sp-banner";
            els.root.querySelectorAll(".sp-apply-btn").forEach(function (this: any, btn?: any) {
                btn.disabled = false;
                btn.textContent = "Apply Configuration";
            });
            clearTimeout(runtime.migrationTimer as any);
            runtime.migrationTimer = setTimeout(scheduleMigration, 5000);
            clearTimeout(runtime.sliderMigrationTimer as any);
            runtime.pendingSliderSubpageMigrations = {};
            refreshFirmwareVersion();
            refreshScreensaverTimeout();
        }
        function handleDisconnected(this: any) {
            setConfigLocked(true, "Reconnecting to device\u2026");
            showBanner("Reconnecting to device\u2026", "offline");
        }
        var sseHandlers: any = createSseHandlers();
        applySseHandlerAliases(sseHandlers);
        var ssePatterns: any = configEventPatterns();
        function handleState(this: any, d?: any) {
            rememberEntityPostPath(d);
            var keys: any = entityStateKeys(d);
            var id: any = keys[0] || d.id;
            var val: any = d.state != null ? String(d.state) : "";
            for (var ki: any = 0; ki < keys.length; ki++) {
                if (sseHandlers[keys[ki]]) {
                    sseHandlers[keys[ki]](val, d, keys[ki]);
                    return;
                }
            }
            if (isFirmwareVersionEvent(id, d)) {
                setFirmwareVersion(val);
                return;
            }
            if (isFirmwareUpdateEvent(id, d)) {
                setFirmwareUpdateInfo(d);
                return;
            }
            if (isFirmwareInstallButtonEvent(id, d)) {
                state.firmwareUpdateControlsSupported = true;
                state.firmwareInstallControlsSupported = true;
                renderFirmwareUpdateStatus();
                return;
            }
            if (isFirmwareCheckButtonEvent(id, d)) {
                state.firmwareUpdateControlsSupported = true;
                renderFirmwareUpdateStatus();
                return;
            }
            if (isC6FirmwareCurrentEvent(id, d)) {
                setC6FirmwareCurrentVersion(val);
                return;
            }
            if (isC6FirmwareLatestEvent(id, d)) {
                setC6FirmwareLatestVersion(val);
                return;
            }
            if (isC6FirmwareUpdateAvailableEvent(id, d)) {
                setC6FirmwareUpdateAvailable(val);
                return;
            }
            if (isC6FirmwareAutoUpdateEvent(id, d)) {
                state.c6FirmwareUpdateControlsSupported = true;
                state.c6FirmwareAutoUpdateSupported = true;
                state.c6FirmwareAutoUpdate = d.value === true || val === "ON";
                syncC6FirmwareUi();
                return;
            }
            if (isC6FirmwareInstallButtonEvent(id, d)) {
                state.c6FirmwareUpdateControlsSupported = true;
                state.c6FirmwareInstallControlsSupported = true;
                syncC6FirmwareUi();
                return;
            }
            if (isC6FirmwareCheckButtonEvent(id, d)) {
                state.c6FirmwareUpdateControlsSupported = true;
                syncC6FirmwareUi();
                return;
            }
            if (isRemovedLegacyStateEvent(id, d))
                return;
            for (var i: any = 0; i < ssePatterns.length; i++) {
                for (var pk: any = 0; pk < keys.length; pk++) {
                    var m: any = keys[pk].match(ssePatterns[i].re);
                    if (m) {
                        ssePatterns[i].fn(m, val, d);
                        return;
                    }
                }
            }
            console.log("[state] unhandled:", id, val);
        }
        reconnectController.connect({
            "onConnected": markConnected,
            "onDisconnected": handleDisconnected,
            "onPing": handleWebServerPingEvent,
            "parseState": function (e: any) { return parseEntityEventData(e.data); },
            "onState": handleState,
        });
    }
    return {
        "connectEvents": staticGlobal(connectEvents),
    };
}
