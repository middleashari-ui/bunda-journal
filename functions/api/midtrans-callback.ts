// Webhook Midtrans -> flip tier ke vip tanpa purge localStorage.
// Verifikasi signature SHA512 order_id+status_code+gross_amount+serverKey.
// order_id format: PREFIX-ts-rand|tier|email (dibuat charge.ts) -> parse & tulis D1 bunda_subscriptions.
export async function onRequestPost(context: any) {
  try {
    const request = context.request;
    const env = context.env;
    const body = await request.json();
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body;

    const serverKey = env.MIDTRANS_SERVER_KEY || '';
    const raw = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const enc = new TextEncoder().encode(raw);
    const digest = await crypto.subtle.digest('SHA-512', enc);
    const expected = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature_key !== expected) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const success =
      transaction_status === 'capture' ||
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    // Client flip tier via localStorage (jangan purge bunda_bab* / jurnal).
    // Server persist ke Cloudflare D1 bunda_subscriptions agar sinkron konsisten lintas device.
    let persisted = false;
    let assignedTier: 'essential' | 'vip' = 'essential';

    if (success) {
      try {
        const parts = String(order_id || '').split('|');
        assignedTier = parts[1] === 'vip' ? 'vip' : 'essential';
        const rawEmail: string = parts[2] || (body as any).customer_email || '';
        const email = rawEmail.trim().toLowerCase();
        const amt = Number(gross_amount) || 0;

        if (env.BUNDA_JOURNAL_DB && email) {
          // 1. Tulis / update status pembayaran di bunda_subscriptions
          await env.BUNDA_JOURNAL_DB.prepare(
            `INSERT OR REPLACE INTO bunda_subscriptions (email, tier, amount, is_paid, order_id, created_at)
             VALUES (?, ?, ?, 1, ?, datetime('now'))`
          ).bind(email, assignedTier, amt, order_id).run();

          // 2. Catat audit order di bunda_orders
          await env.BUNDA_JOURNAL_DB.prepare(
            `INSERT OR REPLACE INTO bunda_orders (order_id, email, tier, amount, status, created_at)
             VALUES (?, ?, ?, ?, ?, datetime('now'))`
          ).bind(order_id, email, assignedTier, amt, transaction_status).run();

          persisted = true;
        }
      } catch (dbErr) {
        console.warn('D1 callback persist error:', dbErr);
        persisted = false;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        order_id,
        tier: success ? assignedTier : 'essential',
        upgrade_applied: success,
        persisted,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
