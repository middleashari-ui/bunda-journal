// Webhook Midtrans → aktifkan tier di D1.
// Verifikasi signature SHA512(order_id + status_code + gross_amount + serverKey).
// Order baru dibaca dari bunda_orders (order_id tidak lagi membawa email/tier).
import { json, normalizeEmail } from '../_lib/auth';
import {
  getServerKey,
  isFinalFailureStatus,
  isPaidStatus,
  parseLegacyOrderId,
  serverKeyKind,
  verifyMidtransSignature,
} from '../_lib/payments';

async function findOrder(env: any, orderId: string) {
  if (!env?.BUNDA_JOURNAL_DB) return null;
  try {
    return (await env.BUNDA_JOURNAL_DB.prepare(
      'SELECT order_id, email, tier, amount FROM bunda_orders WHERE order_id = ?'
    )
      .bind(orderId)
      .first()) as { order_id: string; email: string; tier?: string; amount?: number } | null;
  } catch {
    return null;
  }
}

async function setOrderStatus(env: any, orderId: string, status: string) {
  if (!env?.BUNDA_JOURNAL_DB) return;
  try {
    await env.BUNDA_JOURNAL_DB.prepare('UPDATE bunda_orders SET status = ? WHERE order_id = ?')
      .bind(status, orderId)
      .run();
  } catch (err) {
    console.warn('callback: gagal update status order', err);
  }
}

async function activateSubscription(env: any, email: string, tier: string, amount: number, orderId: string) {
  await env.BUNDA_JOURNAL_DB.prepare(
    `INSERT INTO bunda_subscriptions (email, tier, amount, is_paid, order_id, created_at)
     VALUES (?, ?, ?, 1, ?, datetime('now'))
     ON CONFLICT(email) DO UPDATE SET
       tier = CASE WHEN bunda_subscriptions.tier = 'vip' THEN 'vip' ELSE excluded.tier END,
       amount = excluded.amount,
       is_paid = 1,
       order_id = excluded.order_id`
  )
    .bind(email, tier === 'vip' ? 'vip' : 'essential', amount, orderId)
    .run();
}

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

  const orderId = String(body.order_id || '').trim();
  if (!orderId) return json({ error: 'order_id wajib ada.' }, 400);

  const signatureOk = await verifyMidtransSignature(
    {
      order_id: body.order_id,
      status_code: body.status_code,
      gross_amount: body.gross_amount,
      signature_key: body.signature_key,
    },
    serverKey
  );
  if (!signatureOk) {
    console.warn('callback: signature tidak valid', { order_id: orderId, mode: serverKeyKind(serverKey) });
    return json({ error: 'Invalid signature' }, 403);
  }

  const transactionStatus = String(body.transaction_status || '').trim();
  const fraudStatus = String(body.fraud_status || '').trim();
  const paid = isPaidStatus(transactionStatus, fraudStatus);

  // Sumber kebenaran: order yang kita catat saat charge.
  const order = await findOrder(env, orderId);
  const legacy = order ? null : parseLegacyOrderId(orderId);
  const email = normalizeEmail(order?.email || legacy?.email || '');
  const tier = order?.tier === 'vip' ? 'vip' : order?.tier === 'essential' ? 'essential' : legacy?.tier || 'essential';
  const amount = Number(body.gross_amount) || 0;

  if (!email) {
    console.warn('callback: order tidak dikenal', orderId);
    return json({ ok: true, ignored: true, reason: 'unknown_order' });
  }

  // Nominal harus sama dengan yang kita catat (order baru).
  if (order && Number(order.amount) !== amount) {
    console.warn('callback: nominal tidak cocok', { orderId, expected: order.amount, got: amount });
    return json({ error: 'Nominal tidak cocok dengan order.' }, 400);
  }

  if (paid) {
    try {
      await activateSubscription(env, email, tier, amount, orderId);
      await setOrderStatus(env, orderId, transactionStatus);
      return json({ ok: true, order_id: orderId, tier, upgrade_applied: true, persisted: true });
    } catch (err: any) {
      console.warn('callback: gagal menyimpan langganan', err);
      return json({ error: 'Gagal menyimpan status pembayaran.' }, 500);
    }
  }

  if (transactionStatus === 'pending') {
    await setOrderStatus(env, orderId, 'pending');
    return json({ ok: true, order_id: orderId, pending: true });
  }

  if (isFinalFailureStatus(transactionStatus)) {
    await setOrderStatus(env, orderId, transactionStatus);
    return json({ ok: true, order_id: orderId, failed: true, status: transactionStatus });
  }

  await setOrderStatus(env, orderId, transactionStatus || 'unknown');
  return json({ ok: true, order_id: orderId, ignored: true, status: transactionStatus });
}
