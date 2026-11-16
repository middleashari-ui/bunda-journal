// GET /api/payments/health — cek konfigurasi pembayaran TANPA membocorkan kunci.
// Dipakai setelah deploy: memastikan mode dan jenis server key konsisten dengan
// client key yang tertanam di build.
import { json } from '../../_lib/auth';
import { getServerKey, isPaymentPaused, paymentMode, serverKeyKind } from '../../_lib/payments';

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
    ok: kind !== 'missing' && warnings.length === 0,
    mode,
    paused: isPaymentPaused(env),
    serverKey: kind,
    clientKey: clientKind,
    database: Boolean(env.BUNDA_JOURNAL_DB),
    tablesReady,
    warnings,
  });
}
