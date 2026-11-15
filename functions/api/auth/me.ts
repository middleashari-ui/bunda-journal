// GET /api/auth/me?token=... — validasi sesi, kembalikan identitas + tier.
import { json, getSessionEmail, getTier } from '../../_lib/auth';

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet(context: any) {
  const { request, env } = context;
  try {
    if (!env.BUNDA_JOURNAL_DB) return json({ error: 'Database belum terhubung.' }, 500);
    const url = new URL(request.url);
    const token = url.searchParams.get('token') || '';
    const email = await getSessionEmail(env, token);
    if (!email) return json({ ok: false, error: 'Sesi tidak valid / kedaluwarsa.' }, 401);

    const user: any = await env.BUNDA_JOURNAL_DB.prepare(
      'SELECT name FROM bunda_users WHERE email = ?'
    ).bind(email).first();

    const tier = await getTier(env, email);
    return json({ ok: true, email, name: user?.name || '', tier });
  } catch (err: any) {
    return json({ error: err?.message || 'Gagal memeriksa sesi.' }, 500);
  }
}
