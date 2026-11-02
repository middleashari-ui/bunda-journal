// Endpoint upgrade starter(49k) -> lengkap(129k): charge selisih 80000 via Midtrans Snap.
// Additive — tidak ubah charge.ts existing. Jangan purge localStorage di sini;
// tier flip terjadi di webhook midtrans-callback setelah status success.
export async function onRequestPost(context: any) {
  try {
    const request = context.request;
    const env = context.env;
    const body = await request.json();
    const { user_id, customer_name, customer_email } = body;

    const orderId = `UP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const serverKey = env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-g.HZr8yP-y7EU4bK0e2uRtgm';
    const authHeader = 'Basic ' + btoa(serverKey + ':');

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
          name: 'Bunda Journal Upgrade Starter->Lengkap',
        },
      ],
      metadata: {
        from: 'starter',
        to: 'lengkap',
        user_id: user_id || customer_email || '',
      },
      enabled_payments: ['gopay', 'qris'],
    };

    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
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
