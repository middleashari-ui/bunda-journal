import { getSessionEmail } from '../_lib/auth';
import { checkRateLimit, tooManyRequests } from '../_lib/rateLimit';

// Kill switch pembayaran (mode perbaikan). Set false untuk aktifkan lagi.
const PAYMENT_PAUSED = true; // production: payment OFF. 503 Service Unavailable.

// Endpoint upgrade essential(49k) -> vip(129k): charge selisih 80000 via Midtrans Snap.
// Additive — tidak ubah charge.ts existing. Jangan purge localStorage di sini;
// tier flip terjadi di webhook midtrans-callback setelah status success.
export async function onRequestPost(context: any) {
  // Mode perbaikan: charge upgrade dimatikan total.
  if (PAYMENT_PAUSED) {
    return new Response(JSON.stringify({ error: 'Pembayaran sedang dalam perbaikan. Coba lagi nanti.', maintenance: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const request = context.request;
    const env = context.env;
    const body = await request.json();
    const { user_id, customer_name, customer_email } = body;

    const email = String(customer_email || '').trim().toLowerCase();
    const safeEmail = String(customer_email || 'bunda@bundajournal.my.id').replace(/[^a-zA-Z0-9@._-]/g, '').slice(0, 60);

    // SESI WAJIB: Bearer token (getToken) atau bunda_session_token, dan email
    // sesi HARUS sama dengan email tujuan upgrade (anti-upgrade-akun-orang).
    const sessionAuthHeader = String(request.headers.get('Authorization') || '');
    const bearer = /^bearer\s+/i.test(sessionAuthHeader) ? sessionAuthHeader.replace(/^bearer\s+/i, '').trim() : '';
    const token = String(
      bearer || body.token || body.session_token || body.bunda_session_token ||
      request.headers.get('X-Bunda-Session-Token') || ''
    ).trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Sesi wajib disertakan (Authorization: Bearer <token> atau bunda_session_token)' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const sessionEmail = String((await getSessionEmail(env, token)) || '').trim().toLowerCase();
    if (!sessionEmail) {
      return new Response(JSON.stringify({ error: 'Sesi tidak valid / kedaluwarsa.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!email || sessionEmail !== email) {
      return new Response(JSON.stringify({ error: 'Sesi tidak cocok dengan email upgrade.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Rate limit: 10 permintaan charge / jam per akun.
    const rl = await checkRateLimit(env, `charge:${safeEmail.toLowerCase()}`, 10, 3600);
    if (rl.limited) return tooManyRequests(rl.retryAfter);

    // Selisih upgrade dipegang server (80000) — amount client hanya boleh cocok.
    if (body.amount !== undefined && Number(body.amount) !== 80000) {
      return new Response(JSON.stringify({ error: 'Amount upgrade tidak sesuai.', expected: 80000 }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cek tier di Cloudflare D1: SELECT tier FROM bunda_subscriptions WHERE email=?
    if (env.BUNDA_JOURNAL_DB && safeEmail) {
      try {
        const existing: any = await env.BUNDA_JOURNAL_DB.prepare(
          'SELECT tier FROM bunda_subscriptions WHERE email = ?'
        ).bind(safeEmail.toLowerCase()).first();
        if (existing?.tier === 'vip') {
          return new Response(JSON.stringify({ error: 'Akun Anda sudah berstatus VIP aktif', already_vip: true }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (checkErr) {
        console.warn('D1 tier check warning:', checkErr);
      }
    }

    const orderId = `UP-VIP-${Date.now()}-${Math.floor(Math.random() * 1000)}|vip|${safeEmail}`;
    const serverKey = env.MIDTRANS_SERVER_KEY || '';
    const authHeader = 'Basic ' + btoa(serverKey + ':');

    // Catat order pending ke D1 bunda_orders
    if (env.BUNDA_JOURNAL_DB) {
      try {
        await env.BUNDA_JOURNAL_DB.prepare(
          `INSERT OR REPLACE INTO bunda_orders (order_id, email, tier, amount, status, created_at)
           VALUES (?, ?, 'vip', 80000, 'pending', datetime('now'))`
        ).bind(orderId, safeEmail.toLowerCase()).run();
      } catch (orderErr) {
        console.warn('D1 pending order write warning:', orderErr);
      }
    }

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: 80000,
      },
      customer_details: {
        first_name: customer_name || 'Bunda',
        email: customer_email || 'bunda@bundajournal.my.id',
      },
      item_details: [
        {
          id: 'bunda-upgrade-80k',
          price: 80000,
          quantity: 1,
          name: 'Bunda Journal Upgrade Essential->VIP',
        },
      ],
      metadata: {
        from: 'essential',
        to: 'vip',
        plan: 'upgrade_vip',
        user_id: user_id || customer_email || '',
      },
      enabled_payments: ['gopay', 'qris'],
    };

    const response = await fetch('https://app.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data: any = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
