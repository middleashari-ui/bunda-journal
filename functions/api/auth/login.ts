// POST /api/auth/login — masuk dengan email + password (verifikasi hash PBKDF2 di D1).
import {
  json, normalizeEmail, pbkdf2, safeEqual, createSession, getTier,
} from '../../_lib/auth';

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    if (!env.BUNDA_JOURNAL_DB) return json({ error: 'Database belum terhubung.' }, 500);

    const body: any = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');

    if (!email || !password) return json({ error: 'Email dan password wajib diisi.' }, 400);

    const user: any = await env.BUNDA_JOURNAL_DB.prepare(
      'SELECT email, password_hash, salt, name, provider FROM bunda_users WHERE email = ?'
    ).bind(email).first();

    if (!user) return json({ error: 'Akun belum terdaftar. Silakan daftar dulu.' }, 404, { 'X-Auth-Status': 'not_found' });

    // Akun yang dibuat lewat Google belum punya password -> arahkan ke tombol Google.
    if ((!user.password_hash || user.password_hash.length === 0) && user.provider === 'google') {
      return json({
        error: 'Akun ini terdaftar lewat Google. Silakan masuk dengan tombol "Lanjut dengan Google".',
        use_google: true,
      }, 409);
    }

    const hash = await pbkdf2(password, user.salt);
    if (!safeEqual(hash, user.password_hash)) {
      return json({ error: 'Password salah. Coba lagi.' }, 401);
    }

    const token = await createSession(env, email);
    const tier = await getTier(env, email);
    return json({ ok: true, token, email, name: user.name || '', tier });
  } catch (err: any) {
    return json({ error: err?.message || 'Gagal masuk.' }, 500);
  }
}
