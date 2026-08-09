import { installGlobals, type GlobalDescriptors } from "./globals";

/** A named compatibility boundary that will be replaced by typed editor controllers. */
export interface EditorBootstrapModule {
  readonly name: string;
  readonly install: () => GlobalDescriptors;
}

export type GlobalInstaller = (descriptors: GlobalDescriptors) => void;

/**
 * Installs the editor's current compatibility modules in the declared order.
 * Names make the temporary global boundary visible and prevent a future
 * controller from being silently registered twice.
 */
export function installEditorBootstrap(
  modules: readonly EditorBootstrapModule[],
  install: GlobalInstaller = installGlobals,
  installed: Set<string> = new Set<string>(),
): void {
  for (const module of modules) {
    if (!module.name || installed.has(module.name)) {
      throw new Error(`Duplicate or unnamed editor bootstrap module: ${module.name || "(unnamed)"}`);
    }
    installed.add(module.name);
    install(module.install());
  }
}
