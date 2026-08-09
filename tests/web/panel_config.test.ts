import {
  decodePanelConfig,
  encodePanelConfig,
  PanelConfigError,
  type PanelConfigDocument,
} from "../../src/webserver/model";

interface PanelConfigFixture {
  document: PanelConfigDocument;
  encoded_hex: string;
}

function equal<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
}
function deepEqual(actual: unknown, expected: unknown, message: string): void {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  if (actualText !== expectedText) throw new Error(`${message}: expected ${expectedText}, received ${actualText}`);
}
function hex(bytes: Uint8Array): string { return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join(""); }
function expectPanelConfigError(run: () => void, message: string): void {
  try { run(); } catch (error) {
    if (error instanceof PanelConfigError) return;
    throw error;
  }
  throw new Error(message);
}

export function runPanelConfigTests(fixture: PanelConfigFixture): void {
  const { document } = fixture;
  const encoded = encodePanelConfig(document);
  equal(hex(encoded), fixture.encoded_hex, "the browser encoder produces the shared codec fixture");
  deepEqual(decodePanelConfig(encoded), document, "document round-trips");
  const duplicateSlot = encoded.slice();
  duplicateSlot[55] = 2;
  duplicateSlot[58] = 1;
  expectPanelConfigError(() => decodePanelConfig(duplicateSlot), "duplicate slots must be rejected");
  const invalidUtf8 = encoded.slice();
  invalidUtf8[19] = 0xff;
  expectPanelConfigError(() => decodePanelConfig(invalidUtf8), "invalid UTF-8 must be rejected");
  expectPanelConfigError(() => encodePanelConfig({ ...document, deviceProfile: "x".repeat(65) }), "oversized device profiles must be rejected");
}
