import '@testing-library/jest-dom';

// The jsdom build used in this environment does not expose localStorage to
// the test global, so polyfill a minimal in-memory implementation.
// `configurable: true` lets individual test files replace it with their own mock.
if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {};

  const localStorageMock: Storage = {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    }
  };

  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    configurable: true,
    writable: true
  });
}
