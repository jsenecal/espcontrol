import { state } from "../state/app_instance";
import * as EspControlModel from "../model";
import { uniqueOptions } from "./ui_primitives";
import { liveGlobal, staticGlobal, type GlobalDescriptors } from "../runtime/globals";
import type { UiRuntimeState } from "./state";
import type { ApplicationLayoutState } from "./application_context";
export function installScreenRotationStateModule(runtime: UiRuntimeState, layout: ApplicationLayoutState): GlobalDescriptors {
    const els = runtime.els;
    // ── Screen Rotation State ──────────────────────────────────────────────
    var SCREEN_ROTATION_STARTUP_FALLBACK_MS: any = 1200;
    function normalizeScreenRotation(this: any, value?: any) {
        value = String(value == null ? "" : value);
        return allScreenRotationOptions().indexOf(value) !== -1 ? value : "0";
    }
    function activeScreenRotationOptions(this: any) {
        return sortScreenRotationOptions(uniqueOptions(state.screenRotationOptions || []));
    }
    function allScreenRotationOptions(this: any) {
        return uniqueOptions((state.screenRotationOptions || [])
            .concat(state.screenRotationDeviceOptions || []));
    }
    function syncScreenRotationSelect(this: any) {
        if (!els.setScreenRotation)
            return;
        els.setScreenRotation.innerHTML = "";
        activeScreenRotationOptions().forEach(function (this: any, opt?: any) {
            appendScreenRotationOption(els.setScreenRotation, opt);
        });
        els.setScreenRotation.value = state.screenRotation;
    }
    function displayScreenRotation(this: any, value?: any) {
        var labels: any = layout.config.features && layout.config.features.screenRotationDisplayLabels;
        value = String(value == null ? "" : value);
        if (labels && Object.prototype.hasOwnProperty.call(labels, value))
            return labels[value];
        var offset: any = (layout.config.features && parseInt(String(layout.config.features.screenRotationDisplayOffset || 0), 10)) || 0;
        var n: any = parseInt(value, 10);
        if (!isFinite(n))
            return value;
        return String((n + offset + 360) % 360);
    }
    function screenRotationSortValue(this: any, value?: any) {
        var displayed: any = parseInt(displayScreenRotation(value), 10);
        if (isFinite(displayed))
            return (displayed + 360) % 360;
        var raw: any = parseInt(value, 10);
        return isFinite(raw) ? (raw + 360) % 360 : 999;
    }
    function sortScreenRotationOptions(this: any, options?: any) {
        return (options || []).slice().sort(function (this: any, a?: any, b?: any) {
            return screenRotationSortValue(a) - screenRotationSortValue(b);
        });
    }
    function appendScreenRotationOption(this: any, select?: any, opt?: any) {
        var o: any = document.createElement("option");
        o.value = opt;
        o.textContent = displayScreenRotation(opt) + " deg";
        select.appendChild(o);
    }
    function screenRotationStartupRequired(this: any) {
        return !!(layout.config.features && layout.config.features.screenRotation);
    }
    function gridPreviewBlockedByRotationStartup(this: any) {
        return screenRotationStartupRequired() && !state.screenRotationInitialReady;
    }
    function clearInitialScreenRotationTimer(this: any) {
        if (!state.screenRotationInitialTimer)
            return;
        clearTimeout(state.screenRotationInitialTimer);
        state.screenRotationInitialTimer = null;
    }
    function startInitialScreenRotationCheck(this: any) {
        clearInitialScreenRotationTimer();
        state.pendingButtonOrderRaw = null;
        state.screenRotationInitialFallbackActive = false;
        state.screenRotationInitialReady = !screenRotationStartupRequired();
        if (!state.screenRotationInitialReady) {
            state.screenRotationInitialTimer = setTimeout(function (this: any) {
                resolveInitialScreenRotationCheck(true);
            }, SCREEN_ROTATION_STARTUP_FALLBACK_MS);
        }
    }
    function applyDeferredButtonOrderValue(this: any, rawOrder?: any, onNormalized?: any) {
        var receivedOrder: any = String(rawOrder || "").trim();
        applyButtonOrderValue(receivedOrder, true);
        var normalizedOrder: any = EspControlModel.serializeGridOrder(state.grid, state.sizes);
        if (normalizedOrder !== receivedOrder && typeof onNormalized === "function")
            onNormalized(normalizedOrder);
        return normalizedOrder;
    }
    function resolveInitialScreenRotationCheck(this: any, preservePendingButtonOrder?: any) {
        if (state.screenRotationInitialReady && state.pendingButtonOrderRaw === null &&
            !state.screenRotationInitialFallbackActive)
            return;
        clearInitialScreenRotationTimer();
        state.screenRotationInitialReady = true;
        if (state.pendingButtonOrderRaw !== null) {
            if (preservePendingButtonOrder) {
                applyButtonOrderValue(state.pendingButtonOrderRaw, true);
            }
            else {
                applyDeferredButtonOrderValue(state.pendingButtonOrderRaw, function (this: any, normalizedOrder?: any) {
                    if (runtime.orderReceived)
                        postText(entityName("button_order"), normalizedOrder);
                });
                state.pendingButtonOrderRaw = null;
            }
        }
        state.screenRotationInitialFallbackActive = !!preservePendingButtonOrder;
        if (els.previewMain)
            renderPreview();
    }
    return {
        "SCREEN_ROTATION_STARTUP_FALLBACK_MS": liveGlobal(() => SCREEN_ROTATION_STARTUP_FALLBACK_MS, (value?: any) => { SCREEN_ROTATION_STARTUP_FALLBACK_MS = value; }),
        "normalizeScreenRotation": staticGlobal(normalizeScreenRotation),
        "activeScreenRotationOptions": staticGlobal(activeScreenRotationOptions),
        "allScreenRotationOptions": staticGlobal(allScreenRotationOptions),
        "syncScreenRotationSelect": staticGlobal(syncScreenRotationSelect),
        "displayScreenRotation": staticGlobal(displayScreenRotation),
        "screenRotationSortValue": staticGlobal(screenRotationSortValue),
        "sortScreenRotationOptions": staticGlobal(sortScreenRotationOptions),
        "appendScreenRotationOption": staticGlobal(appendScreenRotationOption),
        "screenRotationStartupRequired": staticGlobal(screenRotationStartupRequired),
        "gridPreviewBlockedByRotationStartup": staticGlobal(gridPreviewBlockedByRotationStartup),
        "clearInitialScreenRotationTimer": staticGlobal(clearInitialScreenRotationTimer),
        "startInitialScreenRotationCheck": staticGlobal(startInitialScreenRotationCheck),
        "applyDeferredButtonOrderValue": staticGlobal(applyDeferredButtonOrderValue),
        "resolveInitialScreenRotationCheck": staticGlobal(resolveInitialScreenRotationCheck),
    };
}
