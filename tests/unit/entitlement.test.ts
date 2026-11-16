import { beforeAll, describe, expect, it } from 'vitest';
import { installBrowserGlobals } from './helpers';

let entitlement: typeof import('../../src/lib/entitlement');
let bookPages: typeof import('../../src/lib/bookPages');

beforeAll(async () => {
  installBrowserGlobals();
  entitlement = await import('../../src/lib/entitlement');
  bookPages = await import('../../src/lib/bookPages');
});

describe('entitlement — gerbang ekspor', () => {
  it('selama gate mati, ekspor selalu diizinkan', async () => {
    expect(bookPages.ESSENTIAL_GATE_ENABLED).toBe(false);
    await expect(entitlement.verifyExportEntitlement()).resolves.toEqual({
      allowed: true,
      reason: 'gate-off',
    });
  });
});
