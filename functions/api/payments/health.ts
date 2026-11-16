// GET /api/payments/health — cek konfigurasi pembayaran TANPA membocorkan kunci.
// Dipakai setelah deploy: memastikan mode dan jenis server key konsisten dengan
// client key yang tertanam di build.
import { json } from '../../_lib/auth';
import {
  getServerKey,
  hasSeparateSignatureKey,
  isPaymentPaused,
  paymentMode,
  serverKeyKind,
} from '../../_lib/payments';

async function probeServerKey(env: any, key: string): Promise<'valid' | 'invalid' | 'forbidden' | 'error'> {
  const base =
    paymentMode(env) === 'sandbox'
      ? 'https://api.sandbox.midtrans.com'
      : 'https://api.midtrans.com';
  try {
    // GET status untuk order yang tidak ada: tidak membuat transaksi.
    // 404 = kunci valid; 401 = kunci ditolak; 403 = kunci valid tapi tanpa izin.
    const res = await fetch(`${base}/v2/BJ-HEALTH-PROBE/status`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${btoa(`${key}:`)}`,
      },
    });
    if (res.status === 404) return 'valid';
    if (res.status === 401) return 'invalid';
    if (res.status === 403) return 'forbidden';
    return 'error';
  } catch {
    return 'error';
  }
}

export async function onRequestGet(context: any) {
  const { env } = context;
  const key = getServerKey(env);
  const kind = serverKeyKind(key);
  const mode = paymentMode(env);

  // Client key (bukan rahasia) dipakai build; di runtime Pages hanya ada kalau
  // diset sebagai env. Kalau tidak ada, biarkan null.
  const clientKey = String(env.VITE_MIDTRANS_CLIENT_KEY || env.MIDTRANS_CLIENT_KEY || '').trim();
  const clientKind = !clientKey
    ? 'unknown'
    : clientKey.startsWith('SB-')
      ? 'sandbox'
      : clientKey.startsWith('Mid-client-')
        ? 'production'
        : 'unknown';

  const warnings: string[] = [];
  if (kind === 'missing') warnings.push('MIDTRANS_SERVER_KEY belum diset.');
  if (kind !== 'missing' && kind !== 'unknown' && clientKind !== 'unknown' && kind !== clientKind) {
    warnings.push('Server key dan client key berbeda mode (sandbox vs production).');
  }
  if (mode === 'production' && kind === 'sandbox') {
    warnings.push('MIDTRANS_ENV=production tetapi server key terlihat sandbox.');
  }
  if (mode === 'sandbox' && kind === 'production') {
    warnings.push('MIDTRANS_ENV=sandbox tetapi server key terlihat production.');
  }

  // Uji kunci langsung ke Midtrans (GET status order dummy, tanpa transaksi).
  const keyCheck = kind === 'missing' ? 'missing' : await probeServerKey(env, key);
  if (keyCheck === 'invalid') {
    warnings.push('Midtrans menolak server key (401). Generate/ganti MIDTRANS_SERVER_KEY production.');
  } else if (keyCheck === 'forbidden') {
    warnings.push('Server key valid tetapi tidak punya izin Core API Read untuk cek status.');
  } else if (keyCheck === 'error') {
    warnings.push('Tidak bisa memverifikasi server key ke Midtrans (jaringan/status tak terduga).');
  }

  // Pastikan tabel pembayaran benar-benar ada (bukan hanya binding D1).
  let tablesReady = false;
  if (env.BUNDA_JOURNAL_DB) {
    try {
      await env.BUNDA_JOURNAL_DB.prepare('SELECT 1 FROM bunda_orders LIMIT 1').first();
      await env.BUNDA_JOURNAL_DB.prepare('SELECT 1 FROM bunda_subscriptions LIMIT 1').first();
      tablesReady = true;
    } catch {
      warnings.push('Tabel bunda_orders/bunda_subscriptions belum ada. Jalankan schema_payments.sql.');
    }
  } else {
    warnings.push('Binding D1 BUNDA_JOURNAL_DB belum ada.');
  }

  return json({
    ok: kind !== 'missing' && keyCheck === 'valid' && warnings.length === 0,
    mode,
    paused: isPaymentPaused(env),
    serverKey: kind,
    keyCheck,
    signatureKey: hasSeparateSignatureKey(env) ? 'separate' : 'server-key',
    clientKey: clientKind,
    database: Boolean(env.BUNDA_JOURNAL_DB),
    tablesReady,
    warnings,
  });
}
