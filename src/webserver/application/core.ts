import { state } from "../state/app_instance";
import { liveGlobal, staticGlobal, type GlobalDescriptors } from "../runtime/globals";
import type { ApplicationLayoutState } from "./application_context";
import type { CardRegistry } from "./card_registry";
export function installCore(applicationLayout: ApplicationLayoutState, cardRegistry: CardRegistry): GlobalDescriptors {
    function isPortraitRotation(this: any, value?: any) {
        value = String(value == null ? "0" : value);
        return value === "90" || value === "270";
    }
    function activeLayout(this: any) {
        if (isPortraitRotation(state.screenRotation) && applicationLayout.config.portrait)
            return applicationLayout.config.portrait;
        return applicationLayout.config;
    }
    function screenWidthPercent(this: any, screen?: any) {
        var width: any = screen && screen.width;
        if (typeof width !== "string")
            return null;
        var match: any = width.trim().match(/^([0-9]+(?:\.[0-9]+)?)%$/);
        if (!match)
            return null;
        var pct: any = parseFloat(match[1]);
        return isFinite(pct) && pct > 0 ? pct : null;
    }
    function previewLayoutScale(this: any, layout?: any) {
        var baseWidth: any = screenWidthPercent(applicationLayout.config.screen);
        var activeWidth: any = screenWidthPercent((layout && layout.screen) || applicationLayout.config.screen);
        if (!baseWidth || !activeWidth)
            return 1;
        return baseWidth / activeWidth;
    }
    function layoutSection(this: any, layout?: any, key?: any) {
        return (layout && layout[key]) || (applicationLayout.config as any)[key] || {};
    }
    function scaledCqw(this: any, value?: any, scale?: any) {
        value = parseFloat(value);
        if (!isFinite(value))
            value = 0;
        return (value * scale) + "cqw";
    }
    function scaledCqwText(this: any, value?: any, scale?: any) {
        return String(value || "").replace(/(-?[0-9]+(?:\.[0-9]+)?)cqw/g, function (this: any, _?: any, num?: any) {
            return scaledCqw(num, scale);
        });
    }
    function syncPreviewGridTop(this: any, layout?: any, scale?: any) {
        var grid: any = layoutSection(layout || activeLayout(), "grid");
        scale = scale || previewLayoutScale(layout || activeLayout());
        var compactTop: any = grid.compactTop != null ? grid.compactTop : grid.bottom;
        var gridTop: any = clockBarVisibleInPreview() ? grid.top : compactTop;
        document.documentElement.style.setProperty("--grid-top", scaledCqw(gridTop, scale));
    }
    function syncPreviewStyleVars(this: any, layout?: any, scale?: any) {
        var r: any = document.documentElement.style;
        var topbar: any = layoutSection(layout, "topbar");
        var grid: any = layoutSection(layout, "grid");
        var btn: any = layoutSection(layout, "btn");
        var sensorBadge: any = layoutSection(layout, "sensorBadge");
        var emptyCell: any = layoutSection(layout, "emptyCell");
        var subpageBadge: any = layoutSection(layout, "subpageBadge");
        r.setProperty("--topbar-h", scaledCqw(topbar.height, scale));
        r.setProperty("--topbar-pad", scaledCqwText(topbar.padding, scale));
        r.setProperty("--topbar-fs", scaledCqw(topbar.fontSize, scale));
        if (topbar.clockFontSize)
            r.setProperty("--clock-fs", scaledCqw(topbar.clockFontSize, scale));
        else
            r.removeProperty("--clock-fs");
        syncPreviewGridTop(layout, scale);
        r.setProperty("--grid-left", scaledCqw(grid.left, scale));
        r.setProperty("--grid-right", scaledCqw(grid.right, scale));
        r.setProperty("--grid-bottom", scaledCqw(grid.bottom, scale));
        r.setProperty("--grid-gap", scaledCqw(grid.gap, scale));
        r.setProperty("--btn-r", scaledCqw(btn.radius, scale));
        r.setProperty("--btn-pad", scaledCqw(btn.padding, scale));
        if (btn.borderWidth != null)
            r.setProperty("--btn-border", scaledCqw(btn.borderWidth, scale));
        else
            r.removeProperty("--btn-border");
        r.setProperty("--btn-icon", scaledCqw(btn.iconSize, scale));
        r.setProperty("--btn-label", scaledCqw(btn.labelSize, scale));
        r.setProperty("--media-title", scaledCqw(btn.mediaTitleSize || btn.labelSize * 1.75, scale));
        r.setProperty("--media-cover-title", scaledCqw(btn.coverArtTitleSize, scale));
        r.setProperty("--media-cover-artist", scaledCqw(btn.coverArtArtistSize, scale));
        r.setProperty("--btn-label-weight", String(btn.labelWeight || 400));
        var labelLines: any = btn.labelLines || 1;
        var labelLinesDouble: any = btn.labelLinesDouble || labelLines;
        r.setProperty("--btn-lines", String(labelLines));
        r.setProperty("--btn-lines-dbl", String(labelLinesDouble));
        r.setProperty("--btn-label-max-height", scaledCqw(btn.labelSize * 1.2 * labelLines, scale));
        r.setProperty("--btn-label-max-height-dbl", scaledCqw(btn.labelSize * 1.2 * labelLinesDouble, scale));
        r.setProperty("--sensor-top", scaledCqw(sensorBadge.top, scale));
        r.setProperty("--sensor-right", scaledCqw(sensorBadge.right, scale));
        r.setProperty("--sensor-fs", scaledCqw(sensorBadge.fontSize, scale));
        r.setProperty("--empty-r", scaledCqw(emptyCell.radius, scale));
        r.setProperty("--subpage-bottom", scaledCqw(subpageBadge.bottom, scale));
        r.setProperty("--subpage-right", scaledCqw(subpageBadge.right, scale));
        r.setProperty("--subpage-fs", scaledCqw(subpageBadge.fontSize, scale));
    }
    function normalizeGridSpansForLayout(this: any, grid?: any, sizes?: any, maxSlots?: any, gridCols?: any, onChanged?: any) {
        var previousOrder: any = EspControlModel.serializeGridOrder(grid, sizes || {});
        EspControlModel.clearSpans(grid, maxSlots);
        EspControlModel.applySpans(grid, sizes || {}, maxSlots, gridCols);
        var normalizedOrder: any = EspControlModel.serializeGridOrder(grid, sizes || {});
        if (normalizedOrder !== previousOrder && typeof onChanged === "function")
            onChanged(normalizedOrder);
        return normalizedOrder;
    }
    function syncPreviewOrientation(this: any, preservePendingGrid?: any) {
        var layout: any = activeLayout();
        var screen: any = layout.screen || applicationLayout.config.screen;
        var scale: any = previewLayoutScale(layout);
        applicationLayout.gridCols = layout.cols || applicationLayout.config.cols;
        applicationLayout.gridRows = layout.rows || Math.ceil(applicationLayout.numSlots / applicationLayout.gridCols);
        var r: any = document.documentElement.style;
        r.setProperty("--screen-w", screen.width || applicationLayout.config.screen.width);
        r.setProperty("--screen-aspect", screen.aspect || applicationLayout.config.screen.aspect);
        r.setProperty("--grid-cols", "repeat(" + applicationLayout.gridCols + "," + applicationLayout.config.grid!.fr + ")");
        r.setProperty("--grid-rows", "repeat(" + applicationLayout.gridRows + "," + applicationLayout.config.grid!.fr + ")");
        syncPreviewStyleVars(layout, scale);
        var largeSensorUnitOffsetPercent: any = typeof applicationLayout.config.largeSensorUnitOffsetPercent === "number"
            ? applicationLayout.config.largeSensorUnitOffsetPercent : -10;
        r.setProperty("--large-sensor-unit-offset-y", "calc(var(--btn-icon) * 2.5 * " + (largeSensorUnitOffsetPercent / 100) + ")");
        if (!preservePendingGrid && state.grid && state.grid.length) {
            normalizeGridSpansForLayout(state.grid, state.sizes, applicationLayout.numSlots, applicationLayout.gridCols, function (this: any, normalizedOrder?: any) {
                if (orderReceived)
                    postText(entityName("button_order"), normalizedOrder);
            });
        }
        if (!preservePendingGrid && orderReceived) {
            for (var homeSlot in state.subpages) {
                var sp: any = state.subpages[homeSlot];
                if (!sp || !sp.grid || !sp.grid.length)
                    continue;
                var previousSubpageOrder: any = JSON.stringify(serializeSubpageGrid(sp));
                normalizeGridSpansForLayout(sp.grid, sp.sizes, applicationLayout.numSlots, applicationLayout.gridCols);
                sp.order = serializeSubpageGrid(sp);
                if (JSON.stringify(sp.order) !== previousSubpageOrder) {
                    saveSubpageEntity(homeSlot);
                }
            }
        }
    }
    var ICON_EXCEPTIONS: any = GENERATED_ICON_EXCEPTIONS;
    var ICON_NAMES: any = GENERATED_ICON_NAMES.slice();
    // Convert an icon display name to its MDI CSS class slug (e.g. "Lightbulb" → "lightbulb")
    function iconSlug(this: any, name?: any) {
        return ICON_EXCEPTIONS[name] || name.toLowerCase().replace(/[^a-z0-9]/g, function (this: any, ch?: any) {
            return ch === " " ? "-" : "";
        }) || "cog";
    }
    var ICON_OPTIONS: any = ["Auto"].concat(ICON_NAMES).sort();
    var DOMAIN_ICONS: any = GENERATED_DOMAIN_ICONS;
    // ── Button type plugin registry ──────────────────────────────────────
    function subpageStateDisplayMode(this: any, b?: any) {
        if (!b || !b.sensor)
            return "off";
        if (b.sensor === "indicator")
            return "icon";
        return b.precision === "text" ? "text" : "numeric";
    }
    var WEBSERVER_MOCK_NOW_ISO: any = "2026-01-01T09:00:00Z";
    var webserverUseMockNowForTest: any = false;
    function webserverMockNow(this: any) {
        return new Date(WEBSERVER_MOCK_NOW_ISO);
    }
    function webserverNow(this: any) {
        return webserverUseMockNowForTest ? webserverMockNow() : new Date();
    }
    function withWebserverMockNow(this: any, callback?: any) {
        var previous: any = webserverUseMockNowForTest;
        webserverUseMockNowForTest = true;
        try {
            return callback();
        }
        finally {
            webserverUseMockNowForTest = previous;
        }
    }
    return {
        "DEVICE_ID": liveGlobal(() => applicationLayout.deviceId, (value?: any) => { applicationLayout.deviceId = String(value || ""); }),
        "CFG": liveGlobal(() => applicationLayout.config, (value?: any) => { applicationLayout.config = value; }),
        "NUM_SLOTS": liveGlobal(() => applicationLayout.numSlots, (value?: any) => { applicationLayout.numSlots = value; }),
        "TOTAL_SLOTS": liveGlobal(() => applicationLayout.totalSlots, (value?: any) => { applicationLayout.totalSlots = value; }),
        "GRID_COLS": liveGlobal(() => applicationLayout.gridCols, (value?: any) => { applicationLayout.gridCols = value; }),
        "GRID_ROWS": liveGlobal(() => applicationLayout.gridRows, (value?: any) => { applicationLayout.gridRows = value; }),
        "isPortraitRotation": staticGlobal(isPortraitRotation),
        "activeLayout": staticGlobal(activeLayout),
        "screenWidthPercent": staticGlobal(screenWidthPercent),
        "previewLayoutScale": staticGlobal(previewLayoutScale),
        "layoutSection": staticGlobal(layoutSection),
        "scaledCqw": staticGlobal(scaledCqw),
        "scaledCqwText": staticGlobal(scaledCqwText),
        "syncPreviewGridTop": staticGlobal(syncPreviewGridTop),
        "syncPreviewStyleVars": staticGlobal(syncPreviewStyleVars),
        "normalizeGridSpansForLayout": staticGlobal(normalizeGridSpansForLayout),
        "syncPreviewOrientation": staticGlobal(syncPreviewOrientation),
        "ICON_EXCEPTIONS": liveGlobal(() => ICON_EXCEPTIONS, (value?: any) => { ICON_EXCEPTIONS = value; }),
        "ICON_NAMES": liveGlobal(() => ICON_NAMES, (value?: any) => { ICON_NAMES = value; }),
        "iconSlug": staticGlobal(iconSlug),
        "ICON_OPTIONS": liveGlobal(() => ICON_OPTIONS, (value?: any) => { ICON_OPTIONS = value; }),
        "DOMAIN_ICONS": liveGlobal(() => DOMAIN_ICONS, (value?: any) => { DOMAIN_ICONS = value; }),
        "BUTTON_TYPES": liveGlobal(() => cardRegistry.definitions, (value?: any) => { cardRegistry.replaceDefinitions(value); }),
        "subpageStateDisplayMode": staticGlobal(subpageStateDisplayMode),
        "WEBSERVER_MOCK_NOW_ISO": liveGlobal(() => WEBSERVER_MOCK_NOW_ISO, (value?: any) => { WEBSERVER_MOCK_NOW_ISO = value; }),
        "webserverUseMockNowForTest": liveGlobal(() => webserverUseMockNowForTest, (value?: any) => { webserverUseMockNowForTest = value; }),
        "webserverMockNow": staticGlobal(webserverMockNow),
        "webserverNow": staticGlobal(webserverNow),
        "withWebserverMockNow": staticGlobal(withWebserverMockNow),
    };
}
