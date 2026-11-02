// Webhook Midtrans -> flip tier ke lengkap(vip) tanpa purge localStorage.
// Verifikasi signature SHA512 order_id+status_code+gross_amount+serverKey.
// ponytail: persist order ke Supabase bunda_subscriptions saat skema users.tier siap,
// tambah saat butuh rekonsiliasi server-side.
export async function onRequestPost(context: any) {
  try {
    const request = context.request;
    const env = context.env;
    const body = await request.json();
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body;

    const serverKey = env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-g.HZr8yP-y7EU4bK0e2uRtgm';
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
    // Server persist menyusul saat tabel users.tier live.
    return new Response(
      JSON.stringify({
        ok: true,
        order_id,
        tier: success ? 'lengkap' : 'starter',
        upgrade_applied: success,
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
