import { state } from "../state/app_instance";
import * as EspControlModel from "../model";
import { domainIcons as DOMAIN_ICONS, iconSlug } from "./ui_primitives";
import { liveGlobal, staticGlobal, type GlobalDescriptors } from "../runtime/globals";
import type { ConfigCodecFeature } from "./config_codec";
import type { UiRuntimeState } from "./state";
import type { ApplicationLayoutState } from "./application_context";
import type { EntityStateFeature } from "./entity_state";
import type { ApplicationApiFeature } from "./api";
export function installGridModule(codec: ConfigCodecFeature, runtime: UiRuntimeState, layout: ApplicationLayoutState, entityState: Pick<EntityStateFeature, "entityName">, requestApi: Pick<ApplicationApiFeature, "postText">): GlobalDescriptors {
    const { entityName } = entityState;
    const { getSubpage, saveSubpageConfig } = codec;
    // ── Context abstraction ────────────────────────────────────────────────
    var mainGridSaveTimer: any = null;
    function scheduleMainGridSave(this: any) {
        clearTimeout(mainGridSaveTimer);
        mainGridSaveTimer = setTimeout(function () {
            mainGridSaveTimer = null;
            requestApi.postText(entityName("button_order"), serializeGrid(state.grid));
        }, 500);
    }
    function cancelMainGridSave(this: any) {
        clearTimeout(mainGridSaveTimer);
        mainGridSaveTimer = null;
    }
    function ctx(this: any) {
        if (state.editingSubpage) {
            var sp: any = getSubpage(state.editingSubpage);
            return {
                grid: sp.grid, sizes: sp.sizes, buttons: sp.buttons,
                maxSlots: layout.numSlots, selected: state.subpageSelectedSlots,
                isSub: true,
                setSelected: function (this: any, s?: any) { state.subpageSelectedSlots = s; },
                setLastClicked: function (this: any, s?: any) { state.subpageLastClicked = s; },
                getLastClicked: function (this: any) { return state.subpageLastClicked; },
                save: function (this: any) { saveSubpageConfig(state.editingSubpage); },
            };
        }
        return {
            grid: state.grid, sizes: state.sizes, buttons: state.buttons,
            maxSlots: layout.numSlots, selected: state.selectedSlots,
            isSub: false,
            setSelected: function (this: any, s?: any) { state.selectedSlots = s; },
            setLastClicked: function (this: any, s?: any) { state.lastClickedSlot = s; },
            getLastClicked: function (this: any) { return state.lastClickedSlot; },
            save: function (this: any) { scheduleMainGridSave(); },
        };
    }
    // ── Grid helpers ───────────────────────────────────────────────────────
    var CARD_SIZE_SINGLE: any = EspControlModel.CARD_SIZE_SINGLE;
    var CARD_SIZE_TALL: any = EspControlModel.CARD_SIZE_TALL;
    var CARD_SIZE_WIDE: any = EspControlModel.CARD_SIZE_WIDE;
    var CARD_SIZE_LARGE: any = EspControlModel.CARD_SIZE_LARGE;
    var CARD_SIZE_EXTRA_TALL: any = EspControlModel.CARD_SIZE_EXTRA_TALL;
    var CARD_SIZE_EXTRA_WIDE: any = EspControlModel.CARD_SIZE_EXTRA_WIDE;
    var CARD_SIZE_EXTRA_LARGE: any = EspControlModel.CARD_SIZE_EXTRA_LARGE;
    var CARD_SIZE_MAX_WIDE: any = EspControlModel.CARD_SIZE_MAX_WIDE;
    var CARD_SIZE_MAX_TALL: any = EspControlModel.CARD_SIZE_MAX_TALL;
    var CARD_SIZE_PORTRAIT_LARGE: any = EspControlModel.CARD_SIZE_PORTRAIT_LARGE;
    var CARD_SIZE_LANDSCAPE_LARGE: any = EspControlModel.CARD_SIZE_LANDSCAPE_LARGE;
    function sizeFromToken(this: any, token?: any) {
        return EspControlModel.sizeFromToken(token);
    }
    function sizeToken(this: any, size?: any) {
        return EspControlModel.sizeToken(size);
    }
    function sizeRowSpan(this: any, size?: any) {
        return EspControlModel.sizeRowSpan(size);
    }
    function sizeColSpan(this: any, size?: any) {
        return EspControlModel.sizeColSpan(size);
    }
    function cardSizeClass(this: any, size?: any) {
        return EspControlModel.cardSizeClass(size);
    }
    function sizeClass(this: any, size?: any) {
        var className: any = cardSizeClass(size);
        return className ? " " + className : "";
    }
    function coveredCells(this: any, pos?: any, size?: any, maxSlots?: any, includeOrigin?: any) {
        return EspControlModel.coveredCells(pos, size, maxSlots, layout.gridCols, includeOrigin);
    }
    function sizeFitsAt(this: any, pos?: any, size?: any, maxSlots?: any) {
        return EspControlModel.sizeFitsAt(pos, size, maxSlots, layout.gridCols);
    }
    function markSpannedCells(this: any, grid?: any, pos?: any, size?: any, maxSlots?: any) {
        EspControlModel.markSpannedCells(grid, pos, size, maxSlots, layout.gridCols);
    }
    function parseOrder(this: any, str?: any) {
        var parsed: any = EspControlModel.parseGridOrder(str, layout.numSlots, layout.gridCols, state.sizes);
        state.sizes = parsed.sizes;
        return parsed.grid;
    }
    function applyButtonOrderValue(this: any, val?: any, skipRender?: any) {
        runtime.orderReceived = !!(val && val.trim());
        state.sizes = {};
        state.grid = parseOrder(val);
        state.selectedSlots = state.selectedSlots.filter(function (this: any, s?: any) {
            return state.grid.indexOf(s) !== -1;
        });
        if (!skipRender)
            scheduleRender();
    }
    function applySpans(this: any, grid?: any, sizes?: any, maxSlots?: any) {
        EspControlModel.applySpans(grid, sizes, maxSlots, layout.gridCols);
    }
    function serializeGrid(this: any, grid?: any) {
        return EspControlModel.serializeGridOrder(grid, state.sizes);
    }
    function applyImportedButtonOrder(this: any, orderStr?: any, importedSizes?: any) {
        state.sizes = importedSizes || {};
        state.grid = parseOrder(orderStr);
        return serializeGrid(state.grid);
    }
    function clearSpans(this: any, grid?: any, maxSlots?: any) {
        EspControlModel.clearSpans(grid, maxSlots);
    }
    function resolveIcon(this: any, b?: any) {
        var sel: any = b.icon || "Auto";
        if (sel === "Auto" && b.entity) {
            var domain: any = b.entity.split(".")[0];
            return DOMAIN_ICONS[domain] || "cog";
        }
        return iconSlug(sel);
    }
    function btnDisplayName(this: any, b?: any) {
        return b.label || b.entity || "Configure";
    }
    return {
        "ctx": staticGlobal(ctx),
        "scheduleMainGridSave": staticGlobal(scheduleMainGridSave),
        "cancelMainGridSave": staticGlobal(cancelMainGridSave),
        "CARD_SIZE_SINGLE": liveGlobal(() => CARD_SIZE_SINGLE, (value?: any) => { CARD_SIZE_SINGLE = value; }),
        "CARD_SIZE_TALL": liveGlobal(() => CARD_SIZE_TALL, (value?: any) => { CARD_SIZE_TALL = value; }),
        "CARD_SIZE_WIDE": liveGlobal(() => CARD_SIZE_WIDE, (value?: any) => { CARD_SIZE_WIDE = value; }),
        "CARD_SIZE_LARGE": liveGlobal(() => CARD_SIZE_LARGE, (value?: any) => { CARD_SIZE_LARGE = value; }),
        "CARD_SIZE_EXTRA_TALL": liveGlobal(() => CARD_SIZE_EXTRA_TALL, (value?: any) => { CARD_SIZE_EXTRA_TALL = value; }),
        "CARD_SIZE_EXTRA_WIDE": liveGlobal(() => CARD_SIZE_EXTRA_WIDE, (value?: any) => { CARD_SIZE_EXTRA_WIDE = value; }),
        "CARD_SIZE_EXTRA_LARGE": liveGlobal(() => CARD_SIZE_EXTRA_LARGE, (value?: any) => { CARD_SIZE_EXTRA_LARGE = value; }),
        "CARD_SIZE_MAX_WIDE": liveGlobal(() => CARD_SIZE_MAX_WIDE, (value?: any) => { CARD_SIZE_MAX_WIDE = value; }),
        "CARD_SIZE_MAX_TALL": liveGlobal(() => CARD_SIZE_MAX_TALL, (value?: any) => { CARD_SIZE_MAX_TALL = value; }),
        "CARD_SIZE_PORTRAIT_LARGE": liveGlobal(() => CARD_SIZE_PORTRAIT_LARGE, (value?: any) => { CARD_SIZE_PORTRAIT_LARGE = value; }),
        "CARD_SIZE_LANDSCAPE_LARGE": liveGlobal(() => CARD_SIZE_LANDSCAPE_LARGE, (value?: any) => { CARD_SIZE_LANDSCAPE_LARGE = value; }),
        "sizeFromToken": staticGlobal(sizeFromToken),
        "sizeToken": staticGlobal(sizeToken),
        "sizeRowSpan": staticGlobal(sizeRowSpan),
        "sizeColSpan": staticGlobal(sizeColSpan),
        "cardSizeClass": staticGlobal(cardSizeClass),
        "sizeClass": staticGlobal(sizeClass),
        "coveredCells": staticGlobal(coveredCells),
        "sizeFitsAt": staticGlobal(sizeFitsAt),
        "markSpannedCells": staticGlobal(markSpannedCells),
        "parseOrder": staticGlobal(parseOrder),
        "applyButtonOrderValue": staticGlobal(applyButtonOrderValue),
        "applySpans": staticGlobal(applySpans),
        "serializeGrid": staticGlobal(serializeGrid),
        "applyImportedButtonOrder": staticGlobal(applyImportedButtonOrder),
        "clearSpans": staticGlobal(clearSpans),
        "resolveIcon": staticGlobal(resolveIcon),
        "btnDisplayName": staticGlobal(btnDisplayName),
    };
}
