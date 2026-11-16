import { describe, expect, it } from 'vitest';
import {
  PLANS,
  isFinalFailureStatus,
  isPaidStatus,
  isValidOrderId,
  makeOrderId,
  parseLegacyOrderId,
  paymentMode,
  serverKeyKind,
  verifyMidtransSignature,
} from '../../functions/_lib/payments';

async function signature(orderId: string, statusCode: string, grossAmount: string, serverKey: string) {
  const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

describe('harga pembayaran', () => {
  it('sama dengan harga resmi di client', () => {
    expect(PLANS.essential).toMatchObject({ amount: 49000, tier: 'essential' });
    expect(PLANS.vip).toMatchObject({ amount: 129000, tier: 'vip' });
    expect(PLANS.upgrade_vip).toMatchObject({ amount: 80000, tier: 'vip' });
    expect(PLANS.hardcover).toMatchObject({ amount: 249000, tier: 'vip' });
  });
});

describe('order id Midtrans', () => {
  it('aman dan pendek untuk semua plan', () => {
    (['essential', 'vip', 'upgrade_vip', 'hardcover'] as const).forEach((plan) => {
      const id = makeOrderId(plan);
      expect(id.length).toBeLessThanOrEqual(50);
      expect(id).toMatch(/^[A-Za-z0-9-]+$/);
      expect(isValidOrderId(id)).toBe(true);
    });
  });

  it('tidak membocorkan email dan unik', () => {
    const a = makeOrderId('vip');
    const b = makeOrderId('vip');
    expect(a).not.toContain('@');
    expect(a).not.toContain('|');
    expect(a).not.toBe(b);
  });
});

describe('signature webhook', () => {
  const key = 'SB-Mid-server-TEST';
  it('menerima signature yang benar', async () => {
    const fields = {
      order_id: 'BJ-VIP-1-ABCD',
      status_code: '200',
      gross_amount: '129000.00',
      signature_key: await signature('BJ-VIP-1-ABCD', '200', '129000.00', key),
    };
    await expect(verifyMidtransSignature(fields, key)).resolves.toBe(true);
  });

  it('menolak signature salah atau kunci kosong', async () => {
    await expect(
      verifyMidtransSignature(
        { order_id: 'BJ-VIP-1-ABCD', status_code: '200', gross_amount: '129000.00', signature_key: 'deadbeef' },
        key
      )
    ).resolves.toBe(false);
    await expect(
      verifyMidtransSignature(
        { order_id: 'X', status_code: '200', gross_amount: '1', signature_key: 'x' },
        ''
      )
    ).resolves.toBe(false);
  });
});

describe('status transaksi', () => {
  it('settlement dan capture-accept dianggap lunas', () => {
    expect(isPaidStatus('settlement')).toBe(true);
    expect(isPaidStatus('capture', 'accept')).toBe(true);
    expect(isPaidStatus('capture', 'challenge')).toBe(false);
    expect(isPaidStatus('pending')).toBe(false);
  });

  it('status gagal final dikenali', () => {
    expect(isFinalFailureStatus('expire')).toBe(true);
    expect(isFinalFailureStatus('deny')).toBe(true);
    expect(isFinalFailureStatus('pending')).toBe(false);
  });
});

describe('kompatibilitas order lama', () => {
  it('membaca email dan tier dari order_id format lama', () => {
    expect(parseLegacyOrderId('VIP-123-4|vip|una@example.com')).toEqual({
      tier: 'vip',
      email: 'una@example.com',
    });
    expect(parseLegacyOrderId('BJ-VIP-1-ABCD')).toBeNull();
  });
});

describe('mode & jenis kunci', () => {
  it('default production, bisa dipaksa sandbox', () => {
    expect(paymentMode({})).toBe('production');
    expect(paymentMode({ MIDTRANS_ENV: 'sandbox' })).toBe('sandbox');
  });

  it('mendeteksi kunci sandbox/production', () => {
    expect(serverKeyKind('')).toBe('missing');
    expect(serverKeyKind('SB-Mid-server-x')).toBe('sandbox');
    expect(serverKeyKind('Mid-server-x')).toBe('production');
  });
});
