// Endpoint /api/subscription: CRUD & query tier Bunda Journal via Cloudflare D1.
// Bebas Supabase pause, zero external ping, offline-first & edge-native.
import { getSessionEmail } from '../_lib/auth';

// Harga resmi per plan — mirror src/config/pricing.ts. ANGKA DIPEGANG SERVER,
// jangan pernah percaya tier/amount yang dikirim client mentah.
const PLAN_PRICE: Record<string, { amount: number; tier: 'essential' | 'vip' }> = {
  essential: { amount: 49000, tier: 'essential' },
  vip: { amount: 129000, tier: 'vip' },
  upgrade_vip: { amount: 80000, tier: 'vip' },
  hardcover: { amount: 249000, tier: 'vip' },
};

const AMOUNT_TO_PLAN: Record<number, string> = {
  49000: 'essential',
  129000: 'vip',
  80000: 'upgrade_vip',
  249000: 'hardcover',
};

/** Ambil token sesi: header Authorization Bearer (getToken) atau bunda_session_token. */
function readSessionToken(request: any, body: any): string {
  const authHeader = String(request.headers.get('Authorization') || '');
  const bearer = /^bearer\s+/i.test(authHeader) ? authHeader.replace(/^bearer\s+/i, '').trim() : '';
  return (
    bearer ||
    String(
      body?.token ||
        body?.session_token ||
        body?.bunda_session_token ||
        request.headers.get('X-Bunda-Session-Token') ||
        ''
    ).trim()
  );
}

export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const email = (url.searchParams.get('email') || '').trim().toLowerCase();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Parameter email wajib disertakan' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (!env.BUNDA_JOURNAL_DB) {
      return new Response(JSON.stringify({ error: 'BUNDA_JOURNAL_DB D1 binding tidak ditemukan' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const row: any = await env.BUNDA_JOURNAL_DB.prepare(
      'SELECT email, tier, amount, is_paid, order_id, created_at FROM bunda_subscriptions WHERE email = ?'
    )
      .bind(email)
      .first();

    if (!row) {
      return new Response(
        JSON.stringify({
          ok: true,
          exists: false,
          email,
          tier: 'none',
          is_paid: false,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        exists: true,
        email: row.email,
        tier: row.tier || 'essential',
        amount: row.amount,
        is_paid: Boolean(row.is_paid),
        order_id: row.order_id,
        created_at: row.created_at,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const email = (body.email || body.user_email || '').trim().toLowerCase();
    const rawAmount = Number(body.amount || body.amount_paid) || 0;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email wajib diisi' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (!env.BUNDA_JOURNAL_DB) {
      return new Response(JSON.stringify({ error: 'BUNDA_JOURNAL_DB D1 binding tidak ditemukan' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // (1) SESI WAJIB: Bearer token (getToken) atau bunda_session_token.
    const token = readSessionToken(request, body);
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Sesi wajib disertakan (Authorization: Bearer <token> atau bunda_session_token)' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
    const sessionEmail = String((await getSessionEmail(env, token)) || '').trim().toLowerCase();
    if (!sessionEmail) {
      return new Response(JSON.stringify({ error: 'Sesi tidak valid / kedaluwarsa.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    if (sessionEmail !== email) {
      return new Response(JSON.stringify({ error: 'Sesi tidak cocok dengan email tujuan.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // (2) PLAN & AMOUNT divalidasi terhadap harga resmi di server.
    // tier TIDAK pernah diambil dari body client — selalu diturunkan dari plan/amount.
    const planKey = String(body.plan || '').trim().toLowerCase();
    const plan = planKey && PLAN_PRICE[planKey] ? planKey : AMOUNT_TO_PLAN[rawAmount];
    if (!plan) {
      return new Response(
        JSON.stringify({ error: 'Plan tidak dikenal atau amount bukan harga resmi.', allowed: Object.keys(PLAN_PRICE) }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
    if (rawAmount && rawAmount !== PLAN_PRICE[plan].amount) {
      return new Response(
        JSON.stringify({ error: 'Amount tidak sesuai harga resmi plan.', expected: PLAN_PRICE[plan].amount }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
    const tier = PLAN_PRICE[plan].tier;
    const amount = PLAN_PRICE[plan].amount;
    const isPaid = body.is_paid !== undefined ? (body.is_paid ? 1 : 0) : 1;
    const orderId = body.order_id || `D1-MANUAL-${Date.now()}`;

    // (3) INSERT tanpa bukti bayar dilarang: is_paid=1 hanya jika sudah ada
    // langganan berbayar ATAU order yang benar-benar sukses di Midtrans.
    if (isPaid) {
      let hasProof = false;
      try {
        const existing: any = await env.BUNDA_JOURNAL_DB.prepare(
          'SELECT is_paid FROM bunda_subscriptions WHERE email = ?'
        )
          .bind(email)
          .first();
        hasProof = Boolean(existing && existing.is_paid);
      } catch (proofErr) {
        console.warn('D1 subscription proof check warning:', proofErr);
      }
      if (!hasProof) {
        try {
          const order: any = await env.BUNDA_JOURNAL_DB.prepare(
            `SELECT order_id FROM bunda_orders
             WHERE email = ? AND status IN ('settlement', 'capture', 'success', 'paid')
             LIMIT 1`
          )
            .bind(email)
            .first();
          hasProof = Boolean(order);
        } catch (orderErr) {
          console.warn('D1 order proof check warning:', orderErr);
        }
      }
      if (!hasProof) {
        return new Response(JSON.stringify({ error: 'Pembayaran belum terverifikasi server.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

    await env.BUNDA_JOURNAL_DB.prepare(
      `INSERT OR REPLACE INTO bunda_subscriptions (email, tier, amount, is_paid, order_id, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(email, tier, amount, isPaid, orderId)
      .run();

    return new Response(
      JSON.stringify({
        ok: true,
        persisted: true,
        email,
        tier,
        amount,
        is_paid: Boolean(isPaid),
        order_id: orderId,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
