// GET /api/auth/google/callback — tukar code -> token, cari/buat user D1, buat sesi.
// Redirect balik ke app dengan #glt=<token> (fragment: tidak dikirim ke server / tidak masuk log).
import { createSession } from '../../../_lib/auth';

const CANONICAL_ORIGIN = 'https://www.bundajournal.my.id';

export async function onRequestGet(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Deteksi origin target: kalau lokal (wrangler dev), balik ke Vite 5173. Kalau live, ke prod.
  const isLocal = url.origin.includes('localhost') || url.origin.includes('127.0.0.1');
  const targetOrigin = isLocal ? 'http://127.0.0.1:5173' : CANONICAL_ORIGIN;

  const back = (qs: string) => Response.redirect(`${targetOrigin}/?${qs}`, 302);

  const clientId = String(env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = String(env.GOOGLE_CLIENT_SECRET || '').trim();
  const redirectUri = String(env.GOOGLE_REDIRECT_URI || '').trim() || `${CANONICAL_ORIGIN}/api/auth/google/callback`;

  // 1) User batal / Google balikin error
  const gErr = url.searchParams.get('error');
  if (gErr) {
    return back(gErr === 'access_denied' ? 'google_error=cancelled' : `google_error=${encodeURIComponent(gErr)}`);
  }

  if (!clientId || !clientSecret) return back('google_error=not_configured');

  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';
  if (!code || !state) return back('google_error=invalid_request');

  // 2) Validasi state (CSRF, sekali pakai)
  let plan = '';
  try {
    const row: any = await env.BUNDA_JOURNAL_DB.prepare(
      'SELECT state, plan FROM bunda_oauth_states WHERE state = ?'
    ).bind(state).first();
    if (!row) return back('google_error=invalid_state');
    plan = row.plan || '';
    await env.BUNDA_JOURNAL_DB.prepare('DELETE FROM bunda_oauth_states WHERE state = ?').bind(state).run();
  } catch {
    return back('google_error=server_error');
  }

  // 3) Tukar authorization code jadi access token
  let accessToken = '';
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });
    const tokenJson: any = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      return back('google_error=token_exchange_failed');
    }
    accessToken = tokenJson.access_token;
  } catch {
    return back('google_error=network_error');
  }

  // 4) Ambil profil Google (email + nama)
  let email = '';
  let name = '';
  let verified = false;
  try {
    const uiRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const ui: any = await uiRes.json();
    email = String(ui.email || '').trim().toLowerCase();
    name = String(ui.name || '').trim().slice(0, 80);
    verified = ui.email_verified === true || ui.email_verified === 'true';
  } catch {
    return back('google_error=profile_failed');
  }

  if (!email) return back('google_error=no_email');
  if (!verified) return back('google_error=email_not_verified');

  // 5) Cari / buat user. Email sama = akun yang sama (JANGAN duplikat).
  try {
    const existing: any = await env.BUNDA_JOURNAL_DB.prepare(
      'SELECT email, name FROM bunda_users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      // Akun lama (email+password) -> sambungkan, jangan sentuh password-nya.
      if (name && !existing.name) {
        await env.BUNDA_JOURNAL_DB.prepare(
          'UPDATE bunda_users SET name = ? WHERE email = ?'
        ).bind(name, email).run();
      }
    } else {
      await env.BUNDA_JOURNAL_DB.prepare(
        "INSERT INTO bunda_users (email, password_hash, salt, name, provider) VALUES (?, '', '', ?, 'google')"
      ).bind(email, name || null).run();
    }

    const token = await createSession(env, email);
    const suffix = plan ? `&plan=${encodeURIComponent(plan)}` : '';
    return Response.redirect(`${targetOrigin}/#glt=${token}${suffix}`, 302);
  } catch {
    return back('google_error=db_error');
  }
}
