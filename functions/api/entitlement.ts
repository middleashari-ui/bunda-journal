// GET /api/entitlement?token=... — verifikasi hak ekspor di server.
// Client memakai ini sebagai gerbang sebelum membuka halaman cetak/PDF.
import { getSessionEmail, getTier, json } from '../_lib/auth';

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const bearer = String(request.headers.get('Authorization') || '').replace(/^bearer\s+/i, '').trim();
  const token = (url.searchParams.get('token') || bearer || '').trim();

  if (!token) return json({ ok: false, error: 'Sesi tidak disertakan.' }, 401);

  const email = String((await getSessionEmail(env, token)) || '').trim().toLowerCase();
  if (!email) return json({ ok: false, error: 'Sesi tidak valid / kedaluwarsa.' }, 401);

  const tier = await getTier(env, email);
  return json(
    { ok: true, email, tier, canExport: tier === 'vip' },
    200,
    { 'Cache-Control': 'no-store' }
  );
}
