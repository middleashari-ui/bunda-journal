import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { installBrowserGlobals, MemoryStorage } from './helpers';

let errorLog: typeof import('../../src/lib/errorLog');
let storage: MemoryStorage;

beforeAll(async () => {
  storage = installBrowserGlobals();
  errorLog = await import('../../src/lib/errorLog');
});

beforeEach(() => {
  storage.clear();
});

describe('errorLog — log lokal untuk diagnosis', () => {
  it('menyimpan error dan membacanya kembali', () => {
    errorLog.logError('Gagal memuat foto', { source: 'upload.ts', stack: 'at upload' });
    const list = errorLog.getErrorLog();
    expect(list).toHaveLength(1);
    expect(list[0].message).toBe('Gagal memuat foto');
    expect(list[0].source).toBe('upload.ts');
  });

  it('membatasi jumlah entri agar storage tidak bengkak', () => {
    for (let i = 0; i < 80; i += 1) errorLog.logError(`error-${i}`);
    const list = errorLog.getErrorLog();
    expect(list).toHaveLength(50);
    expect(list[list.length - 1].message).toBe('error-79');
  });

  it('bisa dibersihkan', () => {
    errorLog.logError('x');
    errorLog.clearErrorLog();
    expect(errorLog.getErrorLog()).toEqual([]);
  });

  it('tidak melempar untuk nilai aneh', () => {
    expect(() => errorLog.logError(undefined)).not.toThrow();
    expect(() => errorLog.logError({ message: 'objek error' })).not.toThrow();
    const list = errorLog.getErrorLog();
    expect(list[list.length - 1].message).toBe('objek error');
  });
});
