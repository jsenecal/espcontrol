import {
  createNativePanelConfigClient,
  updateNativePanelConfigDocument,
  type NativePanelConfigRequest,
  type NativePanelConfigResponse,
} from "../../src/webserver/features/native_panel_config";
import { encodePanelConfig } from "../../src/webserver/model";

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

export async function runNativePanelConfigTests(): Promise<void> {
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
}
