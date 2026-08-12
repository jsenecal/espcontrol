import { state } from "../state/app_instance";
import * as EspControlModel from "../model";
import { ENTITY_CATALOG } from "../generated/entity_catalog";
import { liveGlobal, staticGlobal, type GlobalDescriptors } from "../runtime/globals";
import type { NativePanelConfigController } from "../controllers/native_panel_config_controller";
import type { ConfigCodecFeature } from "./config_codec";
import type { UiRuntimeState } from "./state";

export interface ConfigPersistenceFeature {
    readonly globals: GlobalDescriptors;
    connectCodec(codec: Pick<ConfigCodecFeature, "serializeButtonConfig" | "serializeSubpageConfig">): void;
    saveButtonConfig(slot: number): void;
    saveSubpageEntity(slot: number): unknown;
}

export function createConfigPersistenceFeature(
    nativePanelConfig: NativePanelConfigController | null = null,
    runtime: UiRuntimeState,
): ConfigPersistenceFeature {
    let codec: Pick<ConfigCodecFeature, "serializeButtonConfig" | "serializeSubpageConfig"> | undefined;
    function connectCodec(value: Pick<ConfigCodecFeature, "serializeButtonConfig" | "serializeSubpageConfig">) {
        codec = value;
    }
    function serializeButtonConfig(button: any) {
        if (!codec)
            throw new Error("Configuration persistence used before the codec was connected");
        return codec.serializeButtonConfig(button);
    }
    function serializeSubpageConfig(subpage: any) {
        if (!codec)
            throw new Error("Configuration persistence used before the codec was connected");
        return codec.serializeSubpageConfig(subpage);
    }
    // ── Config Post API ───────────────────────────────────────────────────
    function saveButtonConfig(this: any, slot?: any) {
        var b: any = state.buttons[slot - 1];
        postText(entityNameForSlot("button_config", slot), serializeButtonConfig(b));
    }
    function subpageEntityKeys(this: any) {
        var keys: any = ENTITY_CATALOG.groups.subpage_slot || [];
        var count: any = (CFG.features && CFG.features.subpageConfigChunks) || keys.length;
        count = Math.max(1, Math.min(keys.length, parseInt(count, 10) || keys.length));
        return keys.slice(0, count);
    }
    var SUBPAGE_RAW_CHUNK_FIELDS: any = ["main", "ext", "ext2", "ext3", "ext4", "ext5", "ext6", "ext7"];
    function subpageChunkShouldPost(this: any, slot?: any, keys?: any, chunks?: any, index?: any, previousPendingChunks?: any) {
        if (chunks[index] || index === 0)
            return true;
        var chunkName: any = entityNameForSlot(keys[index], slot);
        if (hasRememberedPostPath("text", chunkName, []))
            return true;
        var raw: any = state.subpageRaw[slot];
        var rawField: any = SUBPAGE_RAW_CHUNK_FIELDS[index];
        return !!((raw && rawField && raw[rawField]) ||
            (previousPendingChunks && previousPendingChunks[index]));
    }
    function saveSubpageEntityLegacy(this: any, slot?: any, full?: any, direct?: any) {
        var keys: any = subpageEntityKeys();
        var chunks: any = EspControlModel.splitSubpageConfigChunks(full, keys.length, 255);
        if (!chunks)
            return;
        var previousPendingChunks: any = EspControlModel.splitSubpageConfigChunks(state.subpageSavePending[slot] || "", keys.length, 255) || [];
        state.subpageSavePending[slot] = full;
        var directPosts: any = [];
        for (var ki: any = 0; ki < keys.length; ki++) {
            var chunkName: any = entityNameForSlot(keys[ki], slot);
            var chunk: any = chunks[ki] || "";
            if (!subpageChunkShouldPost(slot, keys, chunks, ki, previousPendingChunks))
                continue;
            if (direct)
                directPosts.push(postTextLegacy(chunkName, chunk));
            else
                postText(chunkName, chunk);
        }
        if (direct)
            return Promise.all(directPosts);
    }
    function saveSubpageEntity(this: any, slot?: any) {
        var sp: any = state.subpages[slot];
        var full: any = sp ? serializeSubpageConfig(sp) : "";
        var keys: any = subpageEntityKeys();
        var chunks: any = EspControlModel.splitSubpageConfigChunks(full, keys.length, 255);
        if (!chunks) {
            showBanner("Subpage is too large to save. Shorten labels or entity IDs.", "error");
            return;
        }
        var nativeSave: any = nativePanelConfig
            ? nativePanelConfig.writeSubpage(Number.parseInt(String(slot), 10), full)
            : null;
        if (nativeSave) {
            state.subpageSavePending[slot] = full;
            _postQueue = _postQueue.then(function () { return nativeSave; }).then(function (result: any) {
                if (result === "legacy-fallback")
                    return saveSubpageEntityLegacy(slot, full, true);
                if (result !== "saved")
                    _postQueueHadError = true;
                return result;
            });
            return _postQueue;
        }
        saveSubpageEntityLegacy(slot, full);
    }
    function scheduleSliderSubpageMigration(this: any, slot?: any) {
        runtime.pendingSliderSubpageMigrations[slot] = true;
        clearTimeout(runtime.sliderMigrationTimer as any);
        runtime.sliderMigrationTimer = setTimeout(function (this: any) {
            var pending: any = runtime.pendingSliderSubpageMigrations;
            runtime.pendingSliderSubpageMigrations = {};
            for (var key in pending) {
                if (state.subpages[key])
                    saveSubpageEntity(key);
            }
        }, 5000);
    }
    return {
        connectCodec,
        globals: {
            "saveButtonConfig": staticGlobal(saveButtonConfig),
            "subpageEntityKeys": staticGlobal(subpageEntityKeys),
            "SUBPAGE_RAW_CHUNK_FIELDS": liveGlobal(() => SUBPAGE_RAW_CHUNK_FIELDS, (value?: any) => { SUBPAGE_RAW_CHUNK_FIELDS = value; }),
            "subpageChunkShouldPost": staticGlobal(subpageChunkShouldPost),
            "saveSubpageEntityLegacy": staticGlobal(saveSubpageEntityLegacy),
            "saveSubpageEntity": staticGlobal(saveSubpageEntity),
            "scheduleSliderSubpageMigration": staticGlobal(scheduleSliderSubpageMigration),
        },
        saveButtonConfig: (slot) => saveButtonConfig(slot),
        saveSubpageEntity: (slot) => saveSubpageEntity(slot),
    };
}
