import {
  PANEL_CONFIG_DOCUMENT_VERSION,
  decodePanelConfig,
  encodePanelConfig,
  type PanelConfigDocument,
} from "../model";

export interface NativePanelConfigResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly headers: { get(name: string): string | null };
  json(): Promise<unknown>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface NativePanelConfigRequest {
  readonly method?: "GET" | "PUT";
  readonly cache?: "no-store";
  readonly headers?: Record<string, string>;
  readonly body?: Uint8Array;
}

export type NativePanelConfigFetch = (
  path: string,
  request?: NativePanelConfigRequest,
) => Promise<NativePanelConfigResponse>;

export type NativePanelConfigSaveResult = "saved" | "unsupported" | "conflict" | "mirror-failed" | "failed";

interface Capabilities {
  configuration?: {
    read?: unknown;
    write?: unknown;
    document_versions?: unknown;
  };
}

function supportedCapabilities(value: unknown): boolean {
  const capabilities = value as Capabilities | null;
  const versions = capabilities?.configuration?.document_versions;
  return capabilities?.configuration?.read === true &&
    capabilities.configuration.write === true &&
    Array.isArray(versions) && versions.includes(PANEL_CONFIG_DOCUMENT_VERSION);
}

export class NativePanelConfigClient {
  private supported_ = false;
  private discovery_: Promise<boolean> | null = null;

  constructor(private readonly fetch_: NativePanelConfigFetch) {}

  supported(): boolean { return this.supported_; }

  async discover(): Promise<boolean> {
    if (this.discovery_) return this.discovery_;
    this.discovery_ = this.fetch_("/api/v1/capabilities", { cache: "no-store" })
      .then(async (response) => response.ok && supportedCapabilities(await response.json()))
      .catch(() => false)
      .then((supported) => {
        this.supported_ = supported;
        return supported;
      });
    return this.discovery_;
  }

  async save(update: (document: PanelConfigDocument) => PanelConfigDocument): Promise<NativePanelConfigSaveResult> {
    if (!await this.discover()) return "unsupported";
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const current = await this.fetch_("/api/v1/config", { cache: "no-store" });
        if (!current.ok) return "failed";
        const generation = current.headers.get("ETag");
        if (!generation) return "failed";
        const currentDocument = decodePanelConfig(new Uint8Array(await current.arrayBuffer()));
        const next = await this.fetch_("/api/v1/config", {
          method: "PUT",
          cache: "no-store",
          headers: {
            "Content-Type": "application/vnd.espcontrol.panel-config",
            "If-Match": generation,
          },
          body: encodePanelConfig(update(currentDocument)),
        });
        // A 202 means the document itself is safe, but firmware could not
        // update its legacy entity mirror. Treat it as a failed compatibility
        // save so callers do not claim that an older firmware can restore it.
        if (next.status === 202) return "mirror-failed";
        if (next.ok) return "saved";
        if (next.status !== 409) return "failed";
      } catch {
        return "failed";
      }
    }
    return "conflict";
  }
}

export function createNativePanelConfigClient(fetch: NativePanelConfigFetch): NativePanelConfigClient {
  return new NativePanelConfigClient(fetch);
}
