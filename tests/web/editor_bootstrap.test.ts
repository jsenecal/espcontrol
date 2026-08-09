import { installEditorBootstrap, type EditorBootstrapModule } from "../../src/webserver/runtime/editor_bootstrap";

function equal<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
}

export function runEditorBootstrapTests(): void {
  const calls: string[] = [];
  const modules: readonly EditorBootstrapModule[] = [
    { name: "store", install: () => ({ store: { value: "store" } }) },
    { name: "preview-controller", install: () => ({ preview: { value: "preview" } }) },
  ];
  installEditorBootstrap(modules, (descriptors) => {
    calls.push(String(descriptors.store?.value || descriptors.preview?.value));
  });
  equal(calls.join(","), "store,preview", "bootstrap preserves declared controller order");

  let duplicateError = "";
  const installed = new Set<string>();
  try {
    installEditorBootstrap([modules[0]!], () => undefined, installed);
    installEditorBootstrap([modules[0]!], () => undefined, installed);
  } catch (error) {
    duplicateError = String(error);
  }
  equal(duplicateError.includes("Duplicate or unnamed"), true,
    "bootstrap rejects duplicate compatibility modules across bootstrap phases");
}
