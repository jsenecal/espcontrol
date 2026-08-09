import { state } from "../state/app_instance";
import { liveGlobal, staticGlobal, type GlobalDescriptors } from "../runtime/globals";
import { createPreviewPlacementController } from "../features/preview_placement_controller";
export function installPreviewGridPlacementModule(): GlobalDescriptors {
    var previewPlacementController: any = createPreviewPlacementController();
    // ── Preview Grid Placement ────────────────────────────────────────
    function resolveSpanPos(this: any, pos?: any) {
        var c: any = ctx();
        return PreviewGridFeature.resolveSpanPosition(c.grid, c.sizes, pos, c.maxSlots, GRID_COLS);
    }
    function getCellFromEvent(this: any, e?: any, container?: any) {
        if (CFG.dragMode === "swap") {
            var rect: any = container.getBoundingClientRect();
            return resolveSpanPos(PreviewFeature.swapGridCell({ x: e.clientX, y: e.clientY }, { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }, GRID_COLS, GRID_ROWS));
        }
        var children: any = container.children;
        var cells: any = [];
        for (var i: any = 0; i < children.length; i++) {
            var r: any = children[i].getBoundingClientRect();
            var pos: any = parseInt(children[i].getAttribute("data-pos"), 10);
            if (isNaN(pos))
                continue;
            cells.push({ pos: pos, left: r.left, top: r.top, right: r.right, bottom: r.bottom });
        }
        return PreviewFeature.closestGridCell({ x: e.clientX, y: e.clientY }, cells);
    }
    function moveToCell(this: any, fromPos?: any, toPos?: any) {
        var c: any = ctx();
        var result: any = previewPlacementController.moveSingle(c, fromPos, toPos, GRID_COLS);
        if (!result.accepted)
            return;
        if (c.isSub) {
            var subpage: any = getSubpage(state.editingSubpage);
            subpage.grid = result.grid;
            subpage.sizes = result.sizes;
        }
        else {
            state.grid = result.grid;
            state.sizes = result.sizes;
        }
    }
    function canPlaceSlotAt(this: any, grid?: any, pos?: any, size?: any, maxSlots?: any) {
        return PreviewGridFeature.canPlaceSlotAt(grid, pos, size, maxSlots, GRID_COLS);
    }
    function findPlacementCell(this: any, grid?: any, start?: any, size?: any, maxSlots?: any) {
        return PreviewGridFeature.findPlacementCell(grid, start, size, maxSlots, GRID_COLS);
    }
    function findDuplicatePlacement(this: any, grid?: any, start?: any, size?: any, maxSlots?: any) {
        return PreviewGridFeature.findDuplicatePlacement(grid, start, size, maxSlots, GRID_COLS);
    }
    function placeSlotAt(this: any, grid?: any, slot?: any, pos?: any, size?: any) {
        PreviewGridFeature.placeSlotAt(grid, slot, pos, size, GRID_COLS);
    }
    function placeOrderedGridEntries(this: any, entries?: any, sizes?: any, maxSlots?: any) {
        return PreviewGridFeature.placeOrderedGridEntries(entries, sizes, maxSlots, GRID_COLS);
    }
    function moveSelectedToCell(this: any, fromPos?: any, toPos?: any) {
        var c: any = ctx();
        var result: any = previewPlacementController.moveSelected(c, fromPos, toPos, GRID_COLS);
        if (!result.accepted)
            return false;
        if (c.isSub) {
            var subpage: any = getSubpage(state.editingSubpage);
            subpage.grid = result.grid;
            subpage.sizes = result.sizes;
        }
        else {
            state.grid = result.grid;
            state.sizes = result.sizes;
        }
        return true;
    }
    return {
        "resolveSpanPos": staticGlobal(resolveSpanPos),
        "getCellFromEvent": staticGlobal(getCellFromEvent),
        "moveToCell": staticGlobal(moveToCell),
        "canPlaceSlotAt": staticGlobal(canPlaceSlotAt),
        "findPlacementCell": staticGlobal(findPlacementCell),
        "findDuplicatePlacement": staticGlobal(findDuplicatePlacement),
        "placeSlotAt": staticGlobal(placeSlotAt),
        "placeOrderedGridEntries": staticGlobal(placeOrderedGridEntries),
        "moveSelectedToCell": staticGlobal(moveSelectedToCell),
    };
}
