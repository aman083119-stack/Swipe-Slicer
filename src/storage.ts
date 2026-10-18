/**
 * Safe Storage utility that works seamlessly in restricted iframes,
 * sandboxed environments, private browsing, and environments where
 * window.localStorage is null, throws SecurityError, or is disabled.
 * Automatically falls back to an in-memory storage dictionary.
 */
class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

const memoryFallback = new MemoryStorage();

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    // Check if window.localStorage is null or undefined
    const storage = window.localStorage;
    if (!storage || typeof storage.getItem !== 'function') return false;
    const testKey = '__swipeslicer_storage_test__';
    storage.setItem(testKey, '1');
    const result = storage.getItem(testKey) === '1';
    storage.removeItem(testKey);
    return result;
  } catch {
    return false;
  }
}

let storageAvailable: boolean | null = null;

function checkAvailable(): boolean {
  if (storageAvailable === null) {
    storageAvailable = isLocalStorageAvailable();
  }
  return storageAvailable;
}

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (checkAvailable() && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      storageAvailable = false;
    }
    return memoryFallback.getItem(key);
  },

  setItem(key: string, value: string): void {
    try {
      if (checkAvailable() && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      storageAvailable = false;
    }
    memoryFallback.setItem(key, value);
  },

  removeItem(key: string): void {
    try {
      if (checkAvailable() && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      storageAvailable = false;
    }
    memoryFallback.removeItem(key);
  }
};
