// Kill switch pembayaran (mode perbaikan). Set false untuk aktifkan lagi.
const PAYMENT_PAUSED = true; // production: payment OFF. 503 Service Unavailable.

export async function onRequestPost(context: any) {
  // Mode perbaikan: charge Midtrans dimatikan total. Balikin 503, jangan buat transaksi.
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
    const { amount, customer_name, customer_email, plan } = body;

    // Harga resmi per plan — mirror src/config/pricing.ts. ANGKA DIPEGANG SERVER:
    // plan & amount dari client divalidasi dulu, mismatch = reject (anti-tamper).
    const PRICING: Record<string, number> = {
      essential: 49000,
      vip: 129000,
      upgrade_vip: 80000,
      hardcover: 249000,
    };
    const planKey = String(plan || '').trim().toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(PRICING, planKey)) {
      return new Response(
        JSON.stringify({ error: 'Plan tidak dikenal.', allowed: Object.keys(PRICING) }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
    const grossAmount = PRICING[planKey];
    const requestedAmount = Number(amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount !== grossAmount) {
      return new Response(
        JSON.stringify({ error: 'Amount tidak sesuai harga resmi plan.', expected: grossAmount }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Tier selalu diturunkan dari plan yang sudah tervalidasi — bukan dari client.
    const tier: 'essential' | 'vip' = planKey === 'essential' ? 'essential' : 'vip';
    const isUpgrade = planKey === 'upgrade_vip';
    const prefix = isUpgrade ? 'UP-VIP' : tier === 'vip' ? 'BU-VIP' : 'BU-ESS';
    // Embed tier + email di order_id agar webhook bisa tulis DB tanpa body tambahan.
    const safeEmail = String(customer_email || 'bunda@bundajournal.my.id').replace(/[^a-zA-Z0-9@._-]/g, '').slice(0, 60);

    // Cek tier di Cloudflare D1: SELECT tier FROM bunda_subscriptions WHERE email=?
    if (env.BUNDA_JOURNAL_DB && safeEmail) {
      try {
        const existing: any = await env.BUNDA_JOURNAL_DB.prepare(
          'SELECT tier FROM bunda_subscriptions WHERE email = ?'
        ).bind(safeEmail.toLowerCase()).first();
        if (existing?.tier === 'vip' && !isUpgrade) {
          console.log(`User ${safeEmail} sudah aktif di tier VIP.`);
        }
      } catch (checkErr) {
        console.warn('D1 check tier in charge.ts warning:', checkErr);
      }
    }

    const orderId = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}|${tier}|${safeEmail}`;
    const serverKey = env.MIDTRANS_SERVER_KEY || '';
    const authHeader = 'Basic ' + btoa(serverKey + ':');

    // Catat order pending ke D1 bunda_orders
    if (env.BUNDA_JOURNAL_DB) {
      try {
        await env.BUNDA_JOURNAL_DB.prepare(
          `INSERT OR REPLACE INTO bunda_orders (order_id, email, tier, amount, status, created_at)
           VALUES (?, ?, ?, ?, 'pending', datetime('now'))`
        ).bind(orderId, safeEmail.toLowerCase(), tier, grossAmount).run();
      } catch (orderErr) {
        console.warn('D1 pending order write in charge.ts warning:', orderErr);
      }
    }

    const midtransPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount
      },
      customer_details: {
        first_name: customer_name || 'Bunda',
        email: customer_email || 'bunda@bundajournal.my.id'
      },
      item_details: [
        {
          id: isUpgrade ? 'bunda-upgrade-80k' : 'bunda-journal-tier',
          price: grossAmount,
          quantity: 1,
          name: isUpgrade ? 'Bunda Journal Upgrade Essential->VIP' : (tier === 'vip' ? 'Bunda Journal VIP' : 'Bunda Journal Essential')
        }
      ],
      enabled_payments: ['gopay', 'qris']
    };

    const response = await fetch('https://app.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(midtransPayload)
    });

    const data: any = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
