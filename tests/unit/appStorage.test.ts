import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { installBrowserGlobals, MemoryStorage } from './helpers';

let store: typeof import('../../src/lib/storage/appStorage');
let storage: MemoryStorage;

beforeAll(async () => {
  storage = installBrowserGlobals();
  store = await import('../../src/lib/storage/appStorage');
});

beforeEach(() => {
  storage.clear();
});

describe('appStorage — satu pintu data lokal', () => {
  it('menulis & membaca string', () => {
    expect(store.storageSet('bunda_test', 'halo')).toBe(true);
    expect(store.storageGet('bunda_test')).toBe('halo');
  });

  it('membaca JSON dengan fallback kalau rusak', () => {
    store.storageSetJson('bunda_json', { a: 1 });
    expect(store.storageGetJson('bunda_json', {})).toEqual({ a: 1 });

    storage.setItem('bunda_rusak', '{bukan json');
    expect(store.storageGetJson('bunda_rusak', { ok: false })).toEqual({ ok: false });
    expect(store.storageGetJson('bunda_tidak_ada', 'default')).toBe('default');
  });

  it('menghapus satu key', () => {
    store.storageSet('bunda_hapus', 'x');
    store.storageRemove('bunda_hapus');
    expect(store.storageGet('bunda_hapus')).toBeNull();
  });

  it('clear menghapus semua data', () => {
    store.storageSet('bunda_a', '1');
    store.storageSet('bunda_b', '2');
    store.storageClear();
    expect(store.storageGet('bunda_a')).toBeNull();
    expect(store.storageGet('bunda_b')).toBeNull();
  });
});
