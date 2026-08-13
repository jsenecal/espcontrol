import { state } from "../state/app_instance";
import * as EspControlModel from "../model";
import { domainIcons as DOMAIN_ICONS, iconSlug } from "./ui_primitives";
import { staticGlobal, type GlobalDescriptors } from "../runtime/globals";
import type { ConfigCodecFeature } from "./config_codec";
import type { UiRuntimeState } from "./state";
import type { ApplicationLayoutState } from "./application_context";
import type { EntityStateFeature } from "./entity_state";
import type { ApplicationApiFeature } from "./api";

export interface GridFeature {
    readonly CARD_SIZE_SINGLE: number;
    readonly CARD_SIZE_TALL: number;
    readonly CARD_SIZE_WIDE: number;
    readonly CARD_SIZE_LARGE: number;
    readonly CARD_SIZE_EXTRA_TALL: number;
    readonly CARD_SIZE_EXTRA_WIDE: number;
    readonly CARD_SIZE_EXTRA_LARGE: number;
    readonly CARD_SIZE_MAX_WIDE: number;
    readonly CARD_SIZE_MAX_TALL: number;
    readonly CARD_SIZE_PORTRAIT_LARGE: number;
    readonly CARD_SIZE_LANDSCAPE_LARGE: number;
    ctx(): any;
    scheduleMainGridSave(): void;
    cancelMainGridSave(): void;
    sizeFromToken(token?: any): any;
    sizeToken(size?: any): any;
    sizeRowSpan(size?: any): any;
    sizeColSpan(size?: any): any;
    cardSizeClass(size?: any): any;
    sizeClass(size?: any): string;
    coveredCells(position?: any, size?: any, maxSlots?: any, includeOrigin?: any): any;
    sizeFitsAt(position?: any, size?: any, maxSlots?: any): any;
    markSpannedCells(grid?: any, position?: any, size?: any, maxSlots?: any): void;
    parseOrder(value?: any): any;
    applyButtonOrderValue(value?: any, skipRender?: any): void;
    applySpans(grid?: any, sizes?: any, maxSlots?: any): void;
    serializeGrid(grid?: any): string;
    applyImportedButtonOrder(order?: any, importedSizes?: any): string;
    clearSpans(grid?: any, maxSlots?: any): void;
    resolveIcon(button?: any): string;
    btnDisplayName(button?: any): string;
}

export function createGridFeature(codec: ConfigCodecFeature, runtime: UiRuntimeState, layout: ApplicationLayoutState, entityState: Pick<EntityStateFeature, "entityName">, requestApi: Pick<ApplicationApiFeature, "postText">): GridFeature {
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
        ctx,
        scheduleMainGridSave,
        cancelMainGridSave,
        CARD_SIZE_SINGLE: EspControlModel.CARD_SIZE_SINGLE,
        CARD_SIZE_TALL: EspControlModel.CARD_SIZE_TALL,
        CARD_SIZE_WIDE: EspControlModel.CARD_SIZE_WIDE,
        CARD_SIZE_LARGE: EspControlModel.CARD_SIZE_LARGE,
        CARD_SIZE_EXTRA_TALL: EspControlModel.CARD_SIZE_EXTRA_TALL,
        CARD_SIZE_EXTRA_WIDE: EspControlModel.CARD_SIZE_EXTRA_WIDE,
        CARD_SIZE_EXTRA_LARGE: EspControlModel.CARD_SIZE_EXTRA_LARGE,
        CARD_SIZE_MAX_WIDE: EspControlModel.CARD_SIZE_MAX_WIDE,
        CARD_SIZE_MAX_TALL: EspControlModel.CARD_SIZE_MAX_TALL,
        CARD_SIZE_PORTRAIT_LARGE: EspControlModel.CARD_SIZE_PORTRAIT_LARGE,
        CARD_SIZE_LANDSCAPE_LARGE: EspControlModel.CARD_SIZE_LANDSCAPE_LARGE,
        sizeFromToken,
        sizeToken,
        sizeRowSpan,
        sizeColSpan,
        cardSizeClass,
        sizeClass,
        coveredCells,
        sizeFitsAt,
        markSpannedCells,
        parseOrder,
        applyButtonOrderValue,
        applySpans,
        serializeGrid,
        applyImportedButtonOrder,
        clearSpans,
        resolveIcon,
        btnDisplayName,
    };
}

export function gridCompatibilityGlobals(feature: GridFeature): GlobalDescriptors {
    return Object.fromEntries(Object.entries(feature).map(([name, value]) => [name, staticGlobal(value)]));
}
