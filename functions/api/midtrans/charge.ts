// POST /api/midtrans/charge — buat transaksi Midtrans Snap.
//
// Aturan:
// - Harga & tier dipegang server (client hanya memilih plan; amount harus cocok).
// - Order id aman Midtrans (alfanumerik + tanda hubung); email/tier disimpan di
//   D1 bunda_orders, bukan ditempel di order_id.
// - Kalau ada sesi login, email WAJIB sama dengan email sesi.
// - Upgrade hanya untuk akun Essential; VIP tidak bisa beli VIP lagi.
// - Kill switch: env PAYMENT_PAUSED="true" → 503 tanpa membuat transaksi.

import { getSessionEmail, json, normalizeEmail, validateEmail } from '../../_lib/auth';
import { checkRateLimit, tooManyRequests } from '../../_lib/rateLimit';
import {
  PLANS,
  getServerKey,
  isPaymentPaused,
  isPlanKey,
  makeOrderId,
  paymentMode,
  snapBaseUrl,
  type PlanKey,
} from '../../_lib/payments';

function readToken(request: any, body: any): string {
  const auth = String(request.headers.get('Authorization') || '');
  const bearer = /^bearer\s+/i.test(auth) ? auth.replace(/^bearer\s+/i, '').trim() : '';
  return String(
    bearer ||
      body?.token ||
      body?.session_token ||
      request.headers.get('X-Bunda-Session-Token') ||
      ''
  ).trim();
}

async function currentSubscription(env: any, email: string) {
  if (!env?.BUNDA_JOURNAL_DB || !email) return null;
  try {
    return (await env.BUNDA_JOURNAL_DB.prepare(
      'SELECT tier, is_paid FROM bunda_subscriptions WHERE email = ?'
    )
      .bind(email)
      .first()) as { tier?: string; is_paid?: number } | null;
  } catch {
    return null;
  }
}

/**
 * Inti handler charge. `forcedPlan` dipakai /api/upgrade supaya endpoint lama
 * tetap kompatibel tanpa menduplikasi logika.
 */
export async function handleCharge(context: any, forcedPlan?: PlanKey) {
  const { request, env } = context;

  if (isPaymentPaused(env)) {
    return json(
      { error: 'Pembayaran sedang dalam perbaikan. Coba lagi nanti.', maintenance: true },
      503
    );
  }

  const serverKey = getServerKey(env);
  if (!serverKey) {
    return json(
      {
        error: 'Pembayaran belum siap: MIDTRANS_SERVER_KEY belum diset di server.',
        code: 'MIDTRANS_KEY_MISSING',
      },
      503
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body JSON tidak valid.' }, 400);
  }

  // 1. Plan & amount divalidasi terhadap harga resmi.
  const planKey = forcedPlan ?? String(body.plan || '').trim().toLowerCase();
  if (!isPlanKey(planKey)) {
    return json({ error: 'Plan tidak dikenal.', allowed: Object.keys(PLANS) }, 400);
  }
  const plan = PLANS[planKey];

  if (body.amount !== undefined && Number(body.amount) !== plan.amount) {
    return json({ error: 'Amount tidak sesuai harga resmi plan.', expected: plan.amount }, 400);
  }

  // 2. Email: pakai email sesi kalau login; kalau belum punya akun (beli dulu),
  //    email dari form checkout tetap divalidasi formatnya.
  const token = readToken(request, body);
  const sessionEmail = token ? normalizeEmail(await getSessionEmail(env, token)) : '';
  const requestedEmail = normalizeEmail(body.customer_email || body.email);
  if (sessionEmail && requestedEmail && sessionEmail !== requestedEmail) {
    return json({ error: 'Email tidak cocok dengan sesi yang login.' }, 403);
  }
  const email = sessionEmail || requestedEmail;
  const emailError = validateEmail(email);
  if (emailError) {
    return json({ error: emailError }, 400);
  }

  // 3. Status akun: cegah beli VIP dua kali / upgrade dari akun non-essential.
  const existing = await currentSubscription(env, email);
  const existingTier = existing?.tier === 'vip' ? 'vip' : existing?.tier === 'essential' ? 'essential' : 'none';
  if (planKey === 'vip' && existingTier === 'vip') {
    return json({ error: 'Akun ini sudah VIP aktif.', code: 'ALREADY_VIP' }, 409);
  }
  if (planKey === 'upgrade_vip' && existingTier !== 'essential') {
    return json(
      { error: 'Upgrade hanya untuk akun Essential.', code: 'NOT_ESSENTIAL' },
      409
    );
  }

  // 4. Rate limit per email.
  const rl = await checkRateLimit(env, `charge:${email}`, 10, 3600);
  if (rl.limited) return tooManyRequests(rl.retryAfter);

  // 5. Catat order pending (sumber kebenaran untuk webhook).
  const orderId = makeOrderId(planKey);
  if (env.BUNDA_JOURNAL_DB) {
    try {
      await env.BUNDA_JOURNAL_DB.prepare(
        `INSERT INTO bunda_orders (order_id, email, tier, amount, status, created_at)
         VALUES (?, ?, ?, ?, 'pending', datetime('now'))`
      )
        .bind(orderId, email, plan.tier, plan.amount)
        .run();
    } catch (err) {
      console.warn('charge: gagal menulis order pending', err);
      return json({ error: 'Gagal mencatat order. Coba lagi.' }, 500);
    }
  } else {
    return json({ error: 'Database pembayaran belum tersedia.' }, 503);
  }

  // 6. Buat transaksi Snap.
  const payload = {
    transaction_details: { order_id: orderId, gross_amount: plan.amount },
    customer_details: {
      first_name: String(body.customer_name || 'Bunda').slice(0, 50),
      email,
    },
    item_details: [
      {
        id: `bunda-${planKey}`,
        price: plan.amount,
        quantity: 1,
        name: plan.label,
      },
    ],
    enabled_payments: ['gopay', 'qris'],
    metadata: {
      plan: planKey,
      tier: plan.tier,
      email,
    },
  };

  try {
    const response = await fetch(`${snapBaseUrl(env)}/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${serverKey}:`)}`,
      },
      body: JSON.stringify(payload),
    });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok || !data?.token) {
      console.warn('charge: Midtrans menolak transaksi', response.status, data);
      if (response.status === 401 || response.status === 403) {
        return json(
          {
            error: 'Pembayaran sedang tidak tersedia. Coba lagi nanti atau hubungi admin.',
            code: 'MIDTRANS_AUTH',
            order_id: orderId,
          },
          424
        );
      }
      return json(
        {
          error: data?.error_messages?.[0] || 'Midtrans gagal membuat transaksi.',
          code: 'MIDTRANS_ERROR',
          midtrans_status: response.status,
          order_id: orderId,
        },
        424
      );
    }
    return json({
      ok: true,
      token: data.token,
      redirect_url: data.redirect_url,
      order_id: orderId,
      mode: paymentMode(env),
    });
  } catch (err: any) {
    console.warn('charge: error jaringan ke Midtrans', err);
    return json({ error: 'Gagal menghubungi Midtrans. Coba lagi.', code: 'MIDTRANS_FETCH_ERROR' }, 424);
  }
}

export async function onRequestPost(context: any) {
  return handleCharge(context);
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
