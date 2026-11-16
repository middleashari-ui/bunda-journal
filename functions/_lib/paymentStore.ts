// Operasi D1 untuk pembayaran: baca order, update status, aktifkan langganan.
// Dipakai webhook Midtrans dan endpoint cek status (fallback bila webhook telat).
import { isFinalFailureStatus, isPaidStatus } from './payments';

export interface OrderRow {
  order_id: string;
  email: string;
  tier?: string;
  amount?: number;
  status?: string;
}

export async function findOrder(env: any, orderId: string): Promise<OrderRow | null> {
  if (!env?.BUNDA_JOURNAL_DB) return null;
  try {
    return (await env.BUNDA_JOURNAL_DB.prepare(
      'SELECT order_id, email, tier, amount, status FROM bunda_orders WHERE order_id = ?'
    )
      .bind(orderId)
      .first()) as OrderRow | null;
  } catch {
    return null;
  }
}

export async function setOrderStatus(env: any, orderId: string, status: string) {
  if (!env?.BUNDA_JOURNAL_DB) return;
  try {
    await env.BUNDA_JOURNAL_DB.prepare('UPDATE bunda_orders SET status = ? WHERE order_id = ?')
      .bind(status, orderId)
      .run();
  } catch (err) {
    console.warn('paymentStore: gagal update status order', err);
  }
}

export async function activateSubscription(
  env: any,
  email: string,
  tier: string,
  amount: number,
  orderId: string
) {
  // Tier tidak pernah turun: pembelian Essential tidak menimpa akun VIP.
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

/**
 * Terapkan status transaksi Midtrans ke D1. Idempoten.
 * Mengembalikan ringkasan untuk respons HTTP.
 */
export async function applyTransactionStatus(
  env: any,
  order: { order_id: string; email: string; tier?: string; amount?: number },
  transactionStatus: string,
  fraudStatus?: string,
  grossAmount?: number
) {
  const amount = Number(grossAmount ?? order.amount ?? 0);
  const tier = order.tier === 'vip' ? 'vip' : 'essential';
  const paid = isPaidStatus(transactionStatus, fraudStatus);

  if (paid) {
    await activateSubscription(env, order.email, tier, amount, order.order_id);
    await setOrderStatus(env, order.order_id, transactionStatus);
    return { paid: true, tier, email: order.email };
  }

  if (transactionStatus === 'pending') {
    await setOrderStatus(env, order.order_id, 'pending');
    return { paid: false, pending: true, tier, email: order.email };
  }

  if (isFinalFailureStatus(transactionStatus)) {
    await setOrderStatus(env, order.order_id, transactionStatus);
    return { paid: false, failed: true, status: transactionStatus, tier, email: order.email };
  }

  await setOrderStatus(env, order.order_id, transactionStatus || 'unknown');
  return { paid: false, ignored: true, status: transactionStatus, tier, email: order.email };
}
