// POST /api/upgrade — endpoint lama untuk upgrade Essential → VIP (Rp 80.000).
// Logika dipusatkan di charge.ts supaya validasi sesi, harga, order id, dan
// mode sandbox/production tidak berbeda antara beli baru dan upgrade.
import { handleCharge } from './midtrans/charge';

export async function onRequestPost(context: any) {
  return handleCharge(context, 'upgrade_vip');
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
