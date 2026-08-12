import { liveGlobal, staticGlobal, type GlobalDescriptors } from "../runtime/globals";
export function installStateModule(): GlobalDescriptors {
    // ── State ──────────────────────────────────────────────────────────────
    var els: any = {};
    var dragSrcPos: any = -1;
    var didDrag: any = false;
    var previewPlaceholder: any = null;
    var previewDropIdx: any = -1;
    var dragRafPending: any = CFG.dragAnimation ? false : null;
    var dragSrcEl: any = CFG.dragAnimation ? null : null;
    var dragIsSubpage: any = false;
    var dragEnterCount: any = 0;
    var orderReceived: any = false;
    var migrationTimer: any = null;
    var sliderMigrationTimer: any = null;
    var pendingSliderSubpageMigrations: any = {};
    var _eventSource: any = null;
    // ── Utilities ──────────────────────────────────────────────────────────
    function isSettingsFocused(this: any) {
        var ae: any = document.activeElement;
        return ae && els.buttonSettings && els.buttonSettings.contains(ae);
    }
    function isSettingsOpen(this: any) {
        return !!(els.settingsOverlay && els.settingsOverlay.classList.contains("sp-visible"));
    }
    return {
        "els": liveGlobal(() => els, (value?: any) => { els = value; }),
        "dragSrcPos": liveGlobal(() => dragSrcPos, (value?: any) => { dragSrcPos = value; }),
        "didDrag": liveGlobal(() => didDrag, (value?: any) => { didDrag = value; }),
        "previewPlaceholder": liveGlobal(() => previewPlaceholder, (value?: any) => { previewPlaceholder = value; }),
        "previewDropIdx": liveGlobal(() => previewDropIdx, (value?: any) => { previewDropIdx = value; }),
        "dragRafPending": liveGlobal(() => dragRafPending, (value?: any) => { dragRafPending = value; }),
        "dragSrcEl": liveGlobal(() => dragSrcEl, (value?: any) => { dragSrcEl = value; }),
        "dragIsSubpage": liveGlobal(() => dragIsSubpage, (value?: any) => { dragIsSubpage = value; }),
        "dragEnterCount": liveGlobal(() => dragEnterCount, (value?: any) => { dragEnterCount = value; }),
        "orderReceived": liveGlobal(() => orderReceived, (value?: any) => { orderReceived = value; }),
        "migrationTimer": liveGlobal(() => migrationTimer, (value?: any) => { migrationTimer = value; }),
        "sliderMigrationTimer": liveGlobal(() => sliderMigrationTimer, (value?: any) => { sliderMigrationTimer = value; }),
        "pendingSliderSubpageMigrations": liveGlobal(() => pendingSliderSubpageMigrations, (value?: any) => { pendingSliderSubpageMigrations = value; }),
        "_eventSource": liveGlobal(() => _eventSource, (value?: any) => { _eventSource = value; }),
        "isSettingsFocused": staticGlobal(isSettingsFocused),
        "isSettingsOpen": staticGlobal(isSettingsOpen),
    };
}
