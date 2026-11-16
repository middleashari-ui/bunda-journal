// POST /api/auth/register — daftar akun email + password (hash PBKDF2 di D1).
import {
  json, normalizeEmail, pbkdf2, randomHex, validateEmail, validatePassword, createSession, getTier,
} from '../../_lib/auth';
import { checkRateLimit, clientIp, tooManyRequests } from '../../_lib/rateLimit';

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
    const name = String(body.name || '').trim().slice(0, 80);

    const emailErr = validateEmail(email);
    if (emailErr) return json({ error: emailErr }, 400);
    const pwErr = validatePassword(password);
    if (pwErr) return json({ error: pwErr }, 400);

    // Rate limit: 5 pendaftaran / jam per IP.
    const rl = await checkRateLimit(env, `register:${clientIp(request)}`, 5, 3600);
    if (rl.limited) return tooManyRequests(rl.retryAfter);

    const existing: any = await env.BUNDA_JOURNAL_DB.prepare(
      'SELECT email FROM bunda_users WHERE email = ?'
    ).bind(email).first();
    if (existing) return json({ error: 'Email sudah terdaftar. Silakan masuk.' }, 409);

    const salt = randomHex(16);
    const hash = await pbkdf2(password, salt);

    await env.BUNDA_JOURNAL_DB.prepare(
      'INSERT INTO bunda_users (email, password_hash, salt, name) VALUES (?, ?, ?, ?)'
    ).bind(email, hash, salt, name || null).run();

    const token = await createSession(env, email);
    const tier = await getTier(env, email);
    return json({ ok: true, token, email, name, tier });
  } catch (err: any) {
    return json({ error: err?.message || 'Gagal mendaftar.' }, 500);
  }
}
