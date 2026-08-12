import { liveGlobal, staticGlobal, type GlobalDescriptors } from "../runtime/globals";
import type { UiRuntimeState } from "./state";
export function installButtonSettingsRenderQueueModule(runtime: UiRuntimeState): GlobalDescriptors {
    const els = runtime.els;
    // ── Button Settings Render Queue ──────────────────────────────────
    // ── Render debouncing ──────────────────────────────────────────────────
    var _renderPending: any = false;
    function scheduleRender(this: any) {
        if (_renderPending)
            return;
        _renderPending = true;
        requestAnimationFrame(function (this: any) {
            _renderPending = false;
            renderPreview();
            if (runtime.isSettingsOpen() || runtime.isSettingsFocused()) {
                _settingsDeferred = true;
            }
            else {
                renderButtonSettings();
            }
        });
    }
    var _settingsDeferred: any = false;
    document.addEventListener("focusout", function (this: any, e?: any) {
        if (!_settingsDeferred)
            return;
        if (e.relatedTarget && runtime.els.buttonSettings && runtime.els.buttonSettings.contains(e.relatedTarget))
            return;
        requestAnimationFrame(function (this: any) {
            if (runtime.isSettingsOpen())
                return;
            if (!runtime.isSettingsFocused()) {
                _settingsDeferred = false;
                renderButtonSettings();
            }
        });
    });
    document.addEventListener("keydown", function (this: any, e?: any) {
        if (e.key === "Escape" && runtime.els.settingsOverlay &&
            runtime.els.settingsOverlay.classList.contains("sp-visible")) {
            closeSettings();
        }
    });
    return {
        "_renderPending": liveGlobal(() => _renderPending, (value?: any) => { _renderPending = value; }),
        "scheduleRender": staticGlobal(scheduleRender),
        "_settingsDeferred": liveGlobal(() => _settingsDeferred, (value?: any) => { _settingsDeferred = value; }),
    };
}
