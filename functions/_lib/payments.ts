// Logika pembayaran bersama untuk Cloudflare Pages Functions.
// Satu sumber harga, order id aman Midtrans, mode sandbox/production, dan
// verifikasi signature webhook.

export type PlanKey = 'essential' | 'vip' | 'upgrade_vip' | 'hardcover';
export type Tier = 'essential' | 'vip';

export interface PlanInfo {
  amount: number;
  tier: Tier;
  label: string;
}

// Harga resmi — mirror src/config/pricing.ts dan schema_payments.sql.
export const PLANS: Record<PlanKey, PlanInfo> = {
  essential: { amount: 49000, tier: 'essential', label: 'Bunda Journal Essential' },
  vip: { amount: 129000, tier: 'vip', label: 'Bunda Journal VIP' },
  upgrade_vip: { amount: 80000, tier: 'vip', label: 'Upgrade Essential ke VIP' },
  hardcover: { amount: 249000, tier: 'vip', label: 'Bunda Journal Hardcover' },
};

export function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PLANS, value);
}

// Kill switch darurat: set env PAYMENT_PAUSED="true" di Cloudflare Pages untuk
// mematikan endpoint tanpa deploy ulang. Default: aktif.
export function isPaymentPaused(env: any): boolean {
  return String(env?.PAYMENT_PAUSED || '').trim().toLowerCase() === 'true';
}

export function getServerKey(env: any): string {
  return String(env?.MIDTRANS_SERVER_KEY || '').trim();
}

/**
 * Kunci verifikasi signature webhook.
 * Sejak 28 Okt 2026 Midtrans memisahkan Signature Secret Key dari Server Key.
 * Kalau belum diset, pakai Server Key (kompatibel dengan akun lama).
 */
export function getSignatureKey(env: any): string {
  return String(
    env?.MIDTRANS_SIGNATURE_SECRET_KEY || env?.MIDTRANS_SIGNATURE_KEY || getServerKey(env)
  ).trim();
}

export function hasSeparateSignatureKey(env: any): boolean {
  return Boolean(String(env?.MIDTRANS_SIGNATURE_SECRET_KEY || env?.MIDTRANS_SIGNATURE_KEY || '').trim());
}

export function serverKeyKind(key: string): 'sandbox' | 'production' | 'missing' | 'unknown' {
  if (!key) return 'missing';
  if (key.startsWith('SB-Mid-server-')) return 'sandbox';
  if (key.startsWith('Mid-server-')) return 'production';
  return 'unknown';
}

/** Mode Midtrans. Default production; set MIDTRANS_ENV=sandbox untuk uji lokal. */
export function paymentMode(env: any): 'sandbox' | 'production' {
  const explicit = String(env?.MIDTRANS_ENV || '').trim().toLowerCase();
  return explicit === 'sandbox' ? 'sandbox' : 'production';
}

export function snapBaseUrl(env: any): string {
  return paymentMode(env) === 'sandbox'
    ? 'https://app.sandbox.midtrans.com'
    : 'https://app.midtrans.com';
}

/**
 * Order id aman untuk Midtrans: alfanumerik + tanda hubung, < 50 karakter.
 * Email/tier TIDAK ditempel di sini (Midtrans menolak karakter tertentu dan
 * membocorkan email); data itu disimpan di tabel bunda_orders.
 */
export function makeOrderId(plan: PlanKey): string {
  const prefix =
    plan === 'upgrade_vip' ? 'UP' : plan === 'hardcover' ? 'HC' : plan === 'vip' ? 'VIP' : 'ESS';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = new Uint32Array(1);
  crypto.getRandomValues(rand);
  const suffix = rand[0].toString(36).toUpperCase().slice(0, 4).padStart(4, '0');
  return `BJ-${prefix}-${ts}-${suffix}`;
}

export function isValidOrderId(orderId: string): boolean {
  return /^[A-Za-z0-9._~-]{1,50}$/.test(orderId);
}

async function sha512Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Signature Midtrans: SHA512(order_id + status_code + gross_amount + serverKey). */
export async function verifyMidtransSignature(
  fields: { order_id?: unknown; status_code?: unknown; gross_amount?: unknown; signature_key?: unknown },
  serverKey: string
): Promise<boolean> {
  if (!serverKey) return false;
  const raw = `${fields.order_id ?? ''}${fields.status_code ?? ''}${fields.gross_amount ?? ''}${serverKey}`;
  const expected = await sha512Hex(raw);
  const actual = String(fields.signature_key || '').trim().toLowerCase();
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  return diff === 0;
}

/** Status Midtrans yang berarti uang sudah masuk. */
export function isPaidStatus(transactionStatus: string, fraudStatus?: string): boolean {
  if (transactionStatus === 'settlement') return true;
  if (transactionStatus === 'capture') return !fraudStatus || fraudStatus === 'accept';
  return false;
}

/** Status akhir yang tidak akan berubah lagi (aman untuk audit order). */
export function isFinalFailureStatus(transactionStatus: string): boolean {
  return ['expire', 'cancel', 'deny', 'failure', 'refund', 'chargeback'].includes(transactionStatus);
}

/**
 * Ekstrak info pembayaran dari order lama yang email/tier-nya ditempel di
 * order_id (`PREFIX-ts-rand|tier|email`). Hanya untuk order yang dibuat
 * sebelum migrasi; order baru selalu dibaca dari D1.
 */
export function parseLegacyOrderId(orderId: string): { tier: Tier; email: string } | null {
  const parts = String(orderId || '').split('|');
  if (parts.length < 3) return null;
  const tier: Tier = parts[1] === 'vip' ? 'vip' : 'essential';
  const email = String(parts.slice(2).join('|') || '').trim().toLowerCase();
  if (!email) return null;
  return { tier, email };
}
