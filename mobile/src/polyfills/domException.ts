// Minimal DOMException polyfill for React Native environments
if (typeof globalThis.DOMException === "undefined") {
  class DOMExceptionPolyfill extends Error {
    name: string;
    constructor(message = "", name = "DOMException") {
      super(message);
      this.name = name;
    }
  }

  // @ts-expect-error - injecting into global scope
  globalThis.DOMException = DOMExceptionPolyfill;
}
