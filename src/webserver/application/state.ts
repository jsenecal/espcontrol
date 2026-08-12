import { liveGlobal, staticGlobal, type GlobalDescriptors } from "../runtime/globals";
import type { ApplicationLayoutState } from "./application_context";

export interface UiRuntimeState {
    els: any;
    dragSrcPos: any;
    didDrag: any;
    previewPlaceholder: any;
    previewDropIdx: any;
    dragRafPending: any;
    dragSrcEl: any;
    dragIsSubpage: any;
    dragEnterCount: any;
    orderReceived: any;
    migrationTimer: any;
    sliderMigrationTimer: any;
    pendingSliderSubpageMigrations: any;
    eventSource: any;
    globals: GlobalDescriptors;
    isSettingsFocused(): boolean;
    isSettingsOpen(): boolean;
}

export function createUiRuntimeState(
    layout: ApplicationLayoutState,
    document: Document,
): UiRuntimeState {
    const runtime: UiRuntimeState = {
        els: {},
        dragSrcPos: -1,
        didDrag: false,
        previewPlaceholder: null,
        previewDropIdx: -1,
        dragRafPending: layout.config.dragAnimation ? false : null,
        dragSrcEl: null,
        dragIsSubpage: false,
        dragEnterCount: 0,
        orderReceived: false,
        migrationTimer: null,
        sliderMigrationTimer: null,
        pendingSliderSubpageMigrations: {},
        eventSource: null,
        globals: {},
        isSettingsFocused() {
            const activeElement = document.activeElement;
            return !!(activeElement && runtime.els.buttonSettings && runtime.els.buttonSettings.contains(activeElement));
        },
        isSettingsOpen() {
            return !!(runtime.els.settingsOverlay && runtime.els.settingsOverlay.classList.contains("sp-visible"));
        },
    };
    runtime.globals = {
        "els": liveGlobal(() => runtime.els, (value) => { runtime.els = value; }),
        "dragSrcPos": liveGlobal(() => runtime.dragSrcPos, (value) => { runtime.dragSrcPos = value; }),
        "didDrag": liveGlobal(() => runtime.didDrag, (value) => { runtime.didDrag = value; }),
        "previewPlaceholder": liveGlobal(() => runtime.previewPlaceholder, (value) => { runtime.previewPlaceholder = value; }),
        "previewDropIdx": liveGlobal(() => runtime.previewDropIdx, (value) => { runtime.previewDropIdx = value; }),
        "dragRafPending": liveGlobal(() => runtime.dragRafPending, (value) => { runtime.dragRafPending = value; }),
        "dragSrcEl": liveGlobal(() => runtime.dragSrcEl, (value) => { runtime.dragSrcEl = value; }),
        "dragIsSubpage": liveGlobal(() => runtime.dragIsSubpage, (value) => { runtime.dragIsSubpage = value; }),
        "dragEnterCount": liveGlobal(() => runtime.dragEnterCount, (value) => { runtime.dragEnterCount = value; }),
        "orderReceived": liveGlobal(() => runtime.orderReceived, (value) => { runtime.orderReceived = value; }),
        "migrationTimer": liveGlobal(() => runtime.migrationTimer, (value) => { runtime.migrationTimer = value; }),
        "sliderMigrationTimer": liveGlobal(() => runtime.sliderMigrationTimer, (value) => { runtime.sliderMigrationTimer = value; }),
        "pendingSliderSubpageMigrations": liveGlobal(
            () => runtime.pendingSliderSubpageMigrations,
            (value) => { runtime.pendingSliderSubpageMigrations = value; },
        ),
        "_eventSource": liveGlobal(() => runtime.eventSource, (value) => { runtime.eventSource = value; }),
        "isSettingsFocused": staticGlobal(() => runtime.isSettingsFocused()),
        "isSettingsOpen": staticGlobal(() => runtime.isSettingsOpen()),
    };
    return runtime;
}
