import { describe, expect, it } from 'vitest';
import {
  ESSENTIAL_GATE_ENABLED,
  TOTAL_PAGES,
  TOTAL_SPREADS,
  buildBookFileName,
  getBookPagePlan,
  getSpreadInfo,
  getVisibleSpreadCount,
  sanitizeFilePart,
} from '../../src/lib/bookPages';

describe('bookPages — peta 50 spread / 100 halaman', () => {
  it('punya 50 spread = 100 halaman', () => {
    expect(TOTAL_SPREADS).toBe(50);
    expect(TOTAL_PAGES).toBe(100);
  });

  it('setiap spread menempati 2 halaman unik 1..100', () => {
    const seen: number[] = [];
    for (let i = 0; i < TOTAL_SPREADS; i += 1) {
      const info = getSpreadInfo(i);
      expect(info.spreadIndex).toBe(i);
      expect(info.pages).toHaveLength(2);
      expect(info.pages[0]).toBe(i * 2 + 1);
      expect(info.pages[1]).toBe(i * 2 + 2);
      seen.push(...info.pages);
    }
    expect(seen).toHaveLength(TOTAL_PAGES);
    expect(new Set(seen).size).toBe(TOTAL_PAGES);
    expect(Math.min(...seen)).toBe(1);
    expect(Math.max(...seen)).toBe(100);
  });

  it('semua minggu 5–40 punya spread dan tidak duplikat', () => {
    const weeks: number[] = [];
    for (let i = 0; i < TOTAL_SPREADS; i += 1) {
      const info = getSpreadInfo(i);
      if (info.type === 'weekly' && typeof info.week === 'number') weeks.push(info.week);
    }
    expect(weeks).toEqual(Array.from({ length: 36 }, (_, i) => i + 5));
  });

  it('rencana tier: vip 100 halaman, essential 30 halaman', () => {
    expect(getBookPagePlan('vip')).toEqual({ spreads: 50, pages: 100 });
    expect(getBookPagePlan('essential')).toEqual({ spreads: 15, pages: 30 });
  });

  it('gate essential default MATI; saat dinyalakan essential hanya 30 halaman', () => {
    expect(ESSENTIAL_GATE_ENABLED).toBe(false);
    expect(getVisibleSpreadCount('essential')).toBe(TOTAL_SPREADS);
    expect(getVisibleSpreadCount('essential', true)).toBe(15);
    expect(getVisibleSpreadCount('vip', true)).toBe(TOTAL_SPREADS);
  });
});

describe('bookPages — nama file PDF', () => {
  it('membersihkan karakter terlarang filesystem', () => {
    expect(sanitizeFilePart('Una / Ash: "Test"')).toBe('Una Ash Test');
  });

  it('membentuk nama file lengkap', () => {
    const name = buildBookFileName({ name: 'Una', babyNickname: 'Ash' }, new Date(2026, 10, 14));
    expect(name).toBe('Bunda Journal - Bunda Una - Ash - 2026-11-14');
  });

  it('tetap valid kalau profil kosong', () => {
    expect(buildBookFileName(null, new Date(2026, 0, 2))).toBe('Bunda Journal - 2026-01-02');
  });
});
