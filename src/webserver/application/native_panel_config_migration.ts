import { state } from "../state/app_instance";
import { liveGlobal, staticGlobal, type GlobalDescriptors } from "../runtime/globals";
import { createNativePanelConfigClient } from "../features/native_panel_config";

export function installNativePanelConfigMigrationModule(): GlobalDescriptors {
    // New panels store the card configuration as one atomic document. Older
    // firmware remains on the established per-entity API until it advertises
    // the native document capability.
    var _nativePanelConfigClient: any = createNativePanelConfigClient(function (path: any, request: any) {
        return fetch(path, request);
    });
    var _nativePanelConfigSaveTimer: any = null;
    var _nativePanelConfigSavePending: any = false;
    var _nativePanelConfigSavePromise: any = Promise.resolve("unsupported");
    var _nativePanelConfigSaveResolve: any = null;

    function beginNativePanelConfigMigration(this: any) {
        if (typeof fetch !== "function")
            return Promise.resolve(false);
        return _nativePanelConfigClient.discover();
    }
    function nativePanelConfigMigrationSupported(this: any) {
        return _nativePanelConfigClient.supported();
    }
    function nativePanelConfigDocumentFromState(this: any, current: any) {
        if (current.deviceProfile !== DEVICE_ID)
            throw new Error("The device configuration profile changed. Reload this page before saving.");
        var buttons: any = {};
        var subpages: any = {};
        for (var index: any = 0; index < NUM_SLOTS; index++) {
            var button: any = serializeButtonConfig(state.buttons[index]);
            if (button)
                buttons[index + 1] = button;
            var subpage: any = state.subpages[index + 1];
            var serializedSubpage: any = subpage ? serializeSubpageConfig(subpage) : "";
            if (serializedSubpage)
                subpages[index + 1] = serializedSubpage;
        }
        return {
            deviceProfile: current.deviceProfile,
            buttons: buttons,
            subpages: subpages,
            settings: {
                ...current.settings,
                button_order: serializeGrid(state.grid),
            },
        };
    }
    function flushNativePanelConfigSave(this: any) {
        _nativePanelConfigSaveTimer = null;
        if (!_nativePanelConfigSavePending)
            return Promise.resolve("unsupported");
        _nativePanelConfigSavePending = false;
        return _nativePanelConfigClient.save(nativePanelConfigDocumentFromState)
            .then(function (result: any) {
                if (result === "conflict")
                    showBanner("Configuration changed in another browser. Reload before saving again.", "error");
                else if (result === "mirror-failed")
                    showBanner("The configuration saved, but its older-firmware copy did not. Do not downgrade this panel yet.", "error");
                else if (result === "failed")
                    showBanner("Could not save the configuration. Check the connection and try again.", "error");
                if (_nativePanelConfigSaveResolve) {
                    _nativePanelConfigSaveResolve(result);
                    _nativePanelConfigSaveResolve = null;
                }
                return result;
            })
            .catch(function () {
                var result: any = "failed";
                showBanner("Could not save the configuration. Check the connection and try again.", "error");
                if (_nativePanelConfigSaveResolve) {
                    _nativePanelConfigSaveResolve(result);
                    _nativePanelConfigSaveResolve = null;
                }
                return result;
            });
    }
    function scheduleNativePanelConfigSave(this: any) {
        if (!nativePanelConfigMigrationSupported()) {
            beginNativePanelConfigMigration();
            return null;
        }
        _nativePanelConfigSavePending = true;
        if (_nativePanelConfigSaveTimer === null) {
            _nativePanelConfigSavePromise = new Promise(function (resolve: any) {
                _nativePanelConfigSaveResolve = resolve;
                _nativePanelConfigSaveTimer = setTimeout(flushNativePanelConfigSave, 40);
            });
        }
        return _nativePanelConfigSavePromise;
    }
    function nativePanelConfigTextWrite(this: any, name?: any) {
        var value: any = String(name || "");
        if (value === entityName("button_order"))
            return scheduleNativePanelConfigSave();
        var subpageKeys: any = subpageEntityKeys();
        for (var slot: any = 1; slot <= NUM_SLOTS; slot++) {
            if (value === entityNameForSlot("button_config", slot))
                return scheduleNativePanelConfigSave();
            for (var index: any = 0; index < subpageKeys.length; index++) {
                if (value === entityNameForSlot(subpageKeys[index], slot))
                    return scheduleNativePanelConfigSave();
            }
        }
        return false;
    }
    // Browser smoke tests and non-browser consumers deliberately do not
    // install fetch. The normal editor probes as soon as it is available.
    if (typeof fetch === "function")
        beginNativePanelConfigMigration();
    return {
        "_nativePanelConfigClient": liveGlobal(() => _nativePanelConfigClient, (value?: any) => { _nativePanelConfigClient = value; }),
        "_nativePanelConfigSaveTimer": liveGlobal(() => _nativePanelConfigSaveTimer, (value?: any) => { _nativePanelConfigSaveTimer = value; }),
        "_nativePanelConfigSavePending": liveGlobal(() => _nativePanelConfigSavePending, (value?: any) => { _nativePanelConfigSavePending = value; }),
        "_nativePanelConfigSavePromise": liveGlobal(() => _nativePanelConfigSavePromise, (value?: any) => { _nativePanelConfigSavePromise = value; }),
        "_nativePanelConfigSaveResolve": liveGlobal(() => _nativePanelConfigSaveResolve, (value?: any) => { _nativePanelConfigSaveResolve = value; }),
        "beginNativePanelConfigMigration": staticGlobal(beginNativePanelConfigMigration),
        "nativePanelConfigMigrationSupported": staticGlobal(nativePanelConfigMigrationSupported),
        "nativePanelConfigDocumentFromState": staticGlobal(nativePanelConfigDocumentFromState),
        "flushNativePanelConfigSave": staticGlobal(flushNativePanelConfigSave),
        "scheduleNativePanelConfigSave": staticGlobal(scheduleNativePanelConfigSave),
        "nativePanelConfigTextWrite": staticGlobal(nativePanelConfigTextWrite),
    };
}
