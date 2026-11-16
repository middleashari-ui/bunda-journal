// Webhook Midtrans → aktifkan tier di D1.
// Verifikasi signature SHA512(order_id + status_code + gross_amount + serverKey).
// Order baru dibaca dari bunda_orders (order_id tidak lagi membawa email/tier).
import { json, normalizeEmail } from '../_lib/auth';
import {
  getServerKey,
  getSignatureKey,
  parseLegacyOrderId,
  serverKeyKind,
  verifyMidtransSignature,
} from '../_lib/payments';
import { applyTransactionStatus, findOrder } from '../_lib/paymentStore';

export async function onRequestPost(context: any) {
  const { request, env } = context;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body JSON tidak valid.' }, 400);
  }

  const serverKey = getServerKey(env);
  if (!serverKey) {
    // Jangan pernah mempercayai webhook tanpa kunci verifikasi.
    return json({ error: 'MIDTRANS_SERVER_KEY belum diset.' }, 503);
  }

  // Signature memakai Signature Secret Key kalau ada (perubahan Midtrans 28 Okt 2026).
  const signatureKey = getSignatureKey(env);

  const orderId = String(body.order_id || '').trim();
  if (!orderId) return json({ error: 'order_id wajib ada.' }, 400);

  const signatureOk = await verifyMidtransSignature(
    {
      order_id: body.order_id,
      status_code: body.status_code,
      gross_amount: body.gross_amount,
      signature_key: body.signature_key,
    },
    signatureKey
  );
  if (!signatureOk) {
    console.warn('callback: signature tidak valid', { order_id: orderId, mode: serverKeyKind(serverKey) });
    return json({ error: 'Invalid signature' }, 403);
  }

  const transactionStatus = String(body.transaction_status || '').trim();
  const fraudStatus = String(body.fraud_status || '').trim();
  const amount = Number(body.gross_amount) || 0;

  // Sumber kebenaran: order yang kita catat saat charge.
  const order = await findOrder(env, orderId);
  const legacy = order ? null : parseLegacyOrderId(orderId);
  const email = normalizeEmail(order?.email || legacy?.email || '');
  if (!email) {
    console.warn('callback: order tidak dikenal', orderId);
    return json({ ok: true, ignored: true, reason: 'unknown_order' });
  }

  // Nominal harus sama dengan yang kita catat (order baru).
  if (order && Number(order.amount) !== amount) {
    console.warn('callback: nominal tidak cocok', { orderId, expected: order.amount, got: amount });
    return json({ error: 'Nominal tidak cocok dengan order.' }, 400);
  }

  const target = order ?? {
    order_id: orderId,
    email,
    tier: legacy?.tier ?? 'essential',
    amount,
  };

  try {
    const result = await applyTransactionStatus(env, target, transactionStatus, fraudStatus, amount);
    return json({
      ok: true,
      order_id: orderId,
      tier: result.tier,
      upgrade_applied: result.paid === true,
      pending: result.pending === true,
      failed: result.failed === true,
      persisted: result.paid === true,
    });
  } catch (err) {
    console.warn('callback: gagal menyimpan status pembayaran', err);
    return json({ error: 'Gagal menyimpan status pembayaran.' }, 500);
  }
}
