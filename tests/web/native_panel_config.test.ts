import {
  createNativePanelConfigClient,
  updateNativePanelConfigDocument,
  type NativePanelConfigRequest,
  type NativePanelConfigResponse,
} from "../../src/webserver/features/native_panel_config";
import { decodePanelConfig, encodePanelConfig, type PanelConfigDocument } from "../../src/webserver/model";

interface MigrationFixture {
  readonly scenarios: {
    readonly downgrade: {
      readonly native_document: PanelConfigDocument;
      readonly legacy_entities: Record<string, string>;
    };
    readonly partial_migration: {
      readonly native_document: PanelConfigDocument;
      readonly legacy_entity_update: { readonly collection: "buttons"; readonly key: number; readonly value: string };
      readonly expected_document: PanelConfigDocument;
    };
    readonly failed_legacy_mirror: {
      readonly document: PanelConfigDocument;
      readonly expected_result: "mirror-failed";
    };
  };
}

function equal<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
}

function deepEqual(actual: unknown, expected: unknown, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

const document = encodePanelConfig({
  deviceProfile: "panel-a",
  buttons: { 1: "light.kitchen" },
  subpages: {},
  settings: { button_order: "1" },
});

function response(
  status: number,
  body: Uint8Array = new Uint8Array(),
  etag: string | null = null,
): NativePanelConfigResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => name === "ETag" ? etag : null },
    json: async () => ({ configuration: { read: true, write: true, document_versions: [1] } }),
    arrayBuffer: async () => new Uint8Array(body).buffer as ArrayBuffer,
  };
}

export async function runNativePanelConfigTests(migrationFixture?: MigrationFixture): Promise<void> {
  const partialDocument = updateNativePanelConfigDocument({
    deviceProfile: "panel-a",
    buttons: { 1: "old-button", 2: "preserved-button" },
    subpages: { 2: "preserved-subpage" },
    settings: { button_order: "1,2", future_setting: "preserved" },
  }, "panel-a", "buttons", 1, "new-button");
  deepEqual(partialDocument, {
    deviceProfile: "panel-a",
    buttons: { 1: "new-button", 2: "preserved-button" },
    subpages: { 2: "preserved-subpage" },
    settings: { button_order: "1,2", future_setting: "preserved" },
  }, "one changed record preserves the configuration still arriving from the device");
  deepEqual(updateNativePanelConfigDocument(partialDocument, "panel-a", "buttons", 1, "").buttons,
    { 2: "preserved-button" }, "an empty record clears only that record");
  deepEqual(updateNativePanelConfigDocument(partialDocument, "panel-a", "settings", "button_on_color", "0088FF").settings,
    { button_order: "1,2", future_setting: "preserved", button_on_color: "0088FF" },
    "appearance settings use the same native document without replacing future settings");

  const requests: Array<{ path: string; request?: NativePanelConfigRequest }> = [];
  const client = createNativePanelConfigClient(async (path, request) => {
    requests.push(request ? { path, request } : { path });
    if (path === "/api/v1/capabilities") return response(200);
    if (request?.method === "PUT") return response(204);
    return response(200, document, "\"7\"");
  });
  equal(await client.discover(), true, "native capabilities are detected");
  equal(await client.save((current) => ({ ...current, settings: { ...current.settings, button_order: "1d" } })), "saved", "guarded native save succeeds");
  const put = requests.find((entry) => entry.request?.method === "PUT");
  equal(put?.request?.headers?.["If-Match"], "\"7\"", "native save uses the document generation");

  let retries = 0;
  const retryClient = createNativePanelConfigClient(async (path, request) => {
    if (path === "/api/v1/capabilities") return response(200);
    if (request?.method === "PUT") return response(retries++ === 0 ? 409 : 204);
    return response(200, document, `\"${retries + 1}\"`);
  });
  equal(await retryClient.save((current) => current), "saved", "a stale generation retries once");

  const mirrorFailureClient = createNativePanelConfigClient(async (path, request) => {
    if (path === "/api/v1/capabilities") return response(200);
    if (request?.method === "PUT") return response(202);
    return response(200, document, "\"1\"");
  });
  equal(await mirrorFailureClient.save((current) => current), "mirror-failed", "a failed legacy mirror is reported");

  const legacyClient = createNativePanelConfigClient(async () => ({
    ...response(200),
    json: async () => ({ configuration: { read: false, write: false, document_versions: [] } }),
  }));
  equal(await legacyClient.save((current) => current), "unsupported", "legacy firmware stays on the entity path");

  if (!migrationFixture) return;
  const downgrade = migrationFixture.scenarios.downgrade;
  const downgradedDocument = decodePanelConfig(encodePanelConfig(downgrade.native_document));
  equal(downgradedDocument.buttons[1], downgrade.legacy_entities.button_config_1,
    "downgrade fixture retains the first button's legacy value");
  equal(downgradedDocument.subpages[1], downgrade.legacy_entities.button_subpage_config_1,
    "downgrade fixture retains the first subpage's legacy value");
  equal(downgradedDocument.settings.button_on_color, downgrade.legacy_entities.button_on_color,
    "downgrade fixture retains the active colour");
  equal(downgradedDocument.settings.button_order, downgrade.legacy_entities.button_order,
    "downgrade fixture retains button order");

  const partialMigration = migrationFixture.scenarios.partial_migration;
  deepEqual(updateNativePanelConfigDocument(
    partialMigration.native_document,
    partialMigration.native_document.deviceProfile,
    partialMigration.legacy_entity_update.collection,
    partialMigration.legacy_entity_update.key,
    partialMigration.legacy_entity_update.value,
  ), partialMigration.expected_document, "partial migration preserves native records that legacy firmware cannot see");

  const mirrorScenario = migrationFixture.scenarios.failed_legacy_mirror;
  const mirrorScenarioDocument = encodePanelConfig(mirrorScenario.document);
  const fixtureMirrorClient = createNativePanelConfigClient(async (path, request) => {
    if (path === "/api/v1/capabilities") return response(200);
    if (request?.method === "PUT") return response(202);
    return response(200, mirrorScenarioDocument, "\"1\"");
  });
  equal(await fixtureMirrorClient.save((current) => current), mirrorScenario.expected_result,
    "failed legacy mirrors keep the native document durable but block a downgrade claim");
}
