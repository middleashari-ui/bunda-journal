import { describe, expect, it } from 'vitest';
import { migrateLocalStorage, migratePayload, SCHEMA_VERSION, SCHEMA_VERSION_KEY } from '../../src/lib/schemaMigration';
import { MemoryStorage } from './helpers';

describe('schemaMigration — index hari Rab=0 → Sen=0', () => {
  it('menggeser key index-harian +2 mod 7', () => {
    const s = new MemoryStorage();
    s.setItem('bunda_12_0_catatan', 'rabu');
    s.setItem('bunda_12_6_suplemen', 'selasa');
    s.setItem('bunda_12_5_hidrasi', 'senin');

    expect(migrateLocalStorage(s)).toBe(true);
    expect(s.getItem('bunda_12_2_catatan')).toBe('rabu');
    expect(s.getItem('bunda_12_1_suplemen')).toBe('selasa');
    expect(s.getItem('bunda_12_0_hidrasi')).toBe('senin');
    expect(s.getItem('bunda_12_0_catatan')).toBeNull();
  });

  it('tidak menyentuh slot foto, key nama hari, dan key lain', () => {
    const s = new MemoryStorage();
    s.setItem('bunda_12_foto_0', 'slot');
    s.setItem('bunda_daily_w12', '{"Sen":"x"}');
    s.setItem('bunda_profile', '{"name":"Una"}');
    s.setItem('bunda_12_0_catatan', 'rabu');

    migrateLocalStorage(s);

    expect(s.getItem('bunda_12_foto_0')).toBe('slot');
    expect(s.getItem('bunda_daily_w12')).toBe('{"Sen":"x"}');
    expect(s.getItem('bunda_profile')).toBe('{"name":"Una"}');
  });

  it('merotasi array mood sesuai index baru', () => {
    const s = new MemoryStorage();
    s.setItem('bunda_daily_moods_w12', JSON.stringify([0, 1, 2, 3, 4, 5, 6]));
    migrateLocalStorage(s);
    expect(JSON.parse(s.getItem('bunda_daily_moods_w12') as string)).toEqual([5, 6, 0, 1, 2, 3, 4]);
  });

  it('idempoten lewat bunda_schema_version', () => {
    const s = new MemoryStorage();
    s.setItem('bunda_13_0_catatan', 'rabu');
    migrateLocalStorage(s);
    const first = s.getItem('bunda_13_2_catatan');
    expect(migrateLocalStorage(s)).toBe(false);
    expect(s.getItem('bunda_13_2_catatan')).toBe(first);
    expect(s.getItem(SCHEMA_VERSION_KEY)).toBe(String(SCHEMA_VERSION));
  });

  it('payload lama dimigrasikan tanpa menyentuh payload versi baru', () => {
    const oldPayload = {
      bunda_14_0_catatan: 'rabu',
      bunda_daily_moods_w14: JSON.stringify([0, 1, 2, 3, 4, 5, 6]),
      bunda_daily_w14: JSON.stringify({ Rab: 'x' }),
    };
    const migrated = migratePayload(oldPayload);
    expect(migrated.bunda_14_2_catatan).toBe('rabu');
    expect(migrated.bunda_daily_moods_w14).toBe(JSON.stringify([5, 6, 0, 1, 2, 3, 4]));
    expect(migrated.bunda_daily_w14).toBe(oldPayload.bunda_daily_w14);
    expect(migrated[SCHEMA_VERSION_KEY]).toBe(String(SCHEMA_VERSION));

    const fresh = { ...migrated, bunda_14_0_catatan: 'senin' };
    expect(migratePayload(fresh)).toBe(fresh);
  });
});
