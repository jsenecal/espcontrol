export type GlobalDescriptors = PropertyDescriptorMap;

export function liveGlobal(get: () => unknown, set: (value: unknown) => void): PropertyDescriptor {
  return { configurable: true, enumerable: false, get, set };
}

export function staticGlobal(value: unknown): PropertyDescriptor {
  return { configurable: true, enumerable: false, writable: true, value };
}

export function installGlobals(descriptors: GlobalDescriptors): void {
  Object.defineProperties(globalThis, descriptors);
}
