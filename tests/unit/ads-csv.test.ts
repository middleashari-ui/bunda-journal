import { describe, expect, it } from 'vitest';
import { ordersToCsv, parseMoney, parseOrdersCsv } from '../../src/ads/lib/csv';

describe('parseMoney', () => {
  it('menerima format Indonesia dan plain', () => {
    expect(parseMoney('129.000')).toBe(129000);
    expect(parseMoney('Rp 129.000')).toBe(129000);
    expect(parseMoney('129000')).toBe(129000);
    expect(parseMoney('1.234,50')).toBe(1234.5);
    expect(parseMoney('')).toBe(0);
  });
});

describe('parseOrdersCsv', () => {
  it('parse CSV valid', () => {
    const csv = [
      'order_id,product,gross,status,paid_at,campaign_id',
      'BJ-001,vip,129000,settlement,2026-11-15T10:21:00+07:00,cmp_vip_interest',
      'BJ-002,hardcover,249000,paid,2026-11-15T11:00:00+07:00,cmp_hc_interest',
    ].join('\n');
    const result = parseOrdersCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.orders).toHaveLength(2);
    expect(result.orders[0].productId).toBe('vip');
    expect(result.orders[0].status).toBe('paid');
    expect(result.orders[0].net).toBeCloseTo(128097, 0);
    expect(result.orders[0].campaignId).toBe('cmp_vip_interest');
    expect(result.orders[1].productId).toBe('hardcover');
  });

  it('menolak kolom wajib yang hilang', () => {
    const result = parseOrdersCsv('order_id,product,gross\nBJ-001,vip,129000');
    expect(result.orders).toHaveLength(0);
    expect(result.errors[0]).toContain('status');
  });

  it('menolak produk tidak dikenal dan gross invalid', () => {
    const csv = [
      'order_id,product,gross,status,paid_at',
      'BJ-003,unknown,129000,paid,2026-11-15',
      'BJ-004,vip,0,paid,2026-11-15',
      'BJ-005,vip,129000,paid,2026-11-15',
    ].join('\n');
    const result = parseOrdersCsv(csv);
    expect(result.orders).toHaveLength(1);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toContain('tidak dikenal');
    expect(result.errors[1]).toContain('gross');
  });

  it('mendukung tanda kutip dan koma dalam nilai', () => {
    const csv = [
      'order_id,product,gross,status,paid_at,campaign_id',
      '"BJ-006",vip,129000,paid,2026-11-15,"cmp,special"',
    ].join('\n');
    const result = parseOrdersCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.orders[0].campaignId).toBe('cmp,special');
  });

  it('refund dihitung dan net 0', () => {
    const csv = [
      'order_id,product,gross,status,paid_at',
      'BJ-007,vip,129000,refunded,2026-11-15',
    ].join('\n');
    const result = parseOrdersCsv(csv);
    expect(result.orders[0].refund).toBe(129000);
    expect(result.orders[0].net).toBe(0);
  });

  it('export CSV bisa dibaca ulang', () => {
    const parsed = parseOrdersCsv(
      ['order_id,product,gross,status,paid_at', 'BJ-008,vip,129000,paid,2026-11-15'].join('\n')
    );
    const exported = ordersToCsv(parsed.orders);
    const reparsed = parseOrdersCsv(exported);
    expect(reparsed.errors).toEqual([]);
    expect(reparsed.orders[0].externalOrderId).toBe('BJ-008');
    expect(reparsed.orders[0].gross).toBe(129000);
  });
});
