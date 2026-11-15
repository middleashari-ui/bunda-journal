/** Storage in-memory untuk unit test (bukan browser). */
export class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }
}

/** Pasang localStorage + window minimal untuk modul yang memakainya. */
export function installBrowserGlobals(): MemoryStorage {
  const storage = new MemoryStorage();
  const target = globalThis as unknown as Record<string, unknown>;
  target.localStorage = storage;
  target.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  target.CustomEvent = class CustomEvent {
    type: string;
    detail: unknown;
    constructor(type: string, init?: { detail?: unknown }) {
      this.type = type;
      this.detail = init?.detail;
    }
  };
  return storage;
}
