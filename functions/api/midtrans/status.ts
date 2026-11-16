// POST /api/midtrans/status — cek status transaksi langsung ke Midtrans.
// Fallback kalau webhook telat/belum diset: setelah Snap onSuccess, client
// memanggil endpoint ini sehingga tier tetap aktif tanpa menunggu callback.
import { json, normalizeEmail } from '../../_lib/auth';
import { checkRateLimit, tooManyRequests } from '../../_lib/rateLimit';
import { getServerKey, paymentMode } from '../../_lib/payments';
import { applyTransactionStatus, findOrder } from '../../_lib/paymentStore';

export async function onRequestPost(context: any) {
  const { request, env } = context;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body JSON tidak valid.' }, 400);
  }

  const orderId = String(body.order_id || '').trim();
  const email = normalizeEmail(body.email || body.customer_email);
  if (!orderId || !email) {
    return json({ error: 'order_id dan email wajib diisi.' }, 400);
  }

  const order = await findOrder(env, orderId);
  if (!order || normalizeEmail(order.email) !== email) {
    // Jangan bocorkan apakah order ada untuk email lain.
    return json({ error: 'Order tidak ditemukan.' }, 404);
  }

  const rl = await checkRateLimit(env, `status:${orderId}`, 20, 60);
  if (rl.limited) return tooManyRequests(rl.retryAfter);

  const serverKey = getServerKey(env);
  if (!serverKey) {
    return json({ error: 'MIDTRANS_SERVER_KEY belum diset.' }, 503);
  }

  const base =
    paymentMode(env) === 'sandbox'
      ? 'https://api.sandbox.midtrans.com'
      : 'https://api.midtrans.com';

  try {
    const res = await fetch(`${base}/v2/${encodeURIComponent(orderId)}/status`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${btoa(`${serverKey}:`)}`,
      },
    });
    const data: any = await res.json().catch(() => ({}));

    if (res.status === 404) {
      return json({ error: 'Transaksi tidak ditemukan di Midtrans.' }, 404);
    }
    if (!res.ok) {
      console.warn('status: Midtrans menolak cek status', res.status, data);
      return json({ error: 'Gagal mengecek status ke Midtrans.' }, 502);
    }

    const transactionStatus = String(data.transaction_status || '');
    const fraudStatus = String(data.fraud_status || '');
    const gross = Number(data.gross_amount) || Number(order.amount) || 0;

    // Nominal dari Midtrans harus sama dengan order kita.
    if (Number(order.amount) && gross !== Number(order.amount)) {
      console.warn('status: nominal Midtrans tidak cocok', { orderId, expected: order.amount, got: gross });
      return json({ error: 'Nominal tidak cocok dengan order.' }, 400);
    }

    const result = await applyTransactionStatus(env, order, transactionStatus, fraudStatus, gross);

    return json(
      {
        ok: true,
        order_id: orderId,
        status: transactionStatus,
        paid: result.paid === true,
        pending: result.pending === true,
        tier: result.tier,
        email: result.email,
      },
      200,
      { 'Cache-Control': 'no-store' }
    );
  } catch (err) {
    console.warn('status: gagal menghubungi Midtrans', err);
    return json({ error: 'Gagal menghubungi Midtrans.' }, 502);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
