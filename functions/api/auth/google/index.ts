// GET /api/auth/google — mulai OAuth Google (redirect ke accounts.google.com).
import { json, randomHex } from '../../../_lib/auth';

const CANONICAL_ORIGIN = 'https://www.bundajournal.my.id';

export async function onRequestGet(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);

  const clientId = String(env.GOOGLE_CLIENT_ID || '').trim();
  const redirectUri = String(env.GOOGLE_REDIRECT_URI || '').trim() || `${CANONICAL_ORIGIN}/api/auth/google/callback`;

  // Belum dikonfigurasi -> balik ke landing dengan pesan jelas (jangan halaman blank)
  if (!clientId) {
    return Response.redirect(`${CANONICAL_ORIGIN}/?google_error=not_configured`, 302);
  }

  const plan = (url.searchParams.get('plan') || '').slice(0, 24);

  // state anti-CSRF (disimpan di D1, sekali pakai)
  const state = randomHex(16);
  try {
    await env.BUNDA_JOURNAL_DB.prepare(
      'INSERT INTO bunda_oauth_states (state, plan) VALUES (?, ?)'
    ).bind(state, plan || null).run();
    // bersihkan state lama (>10 menit)
    await env.BUNDA_JOURNAL_DB.prepare(
      "DELETE FROM bunda_oauth_states WHERE created_at < datetime('now','-10 minutes')"
    ).run();
  } catch {}

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
    access_type: 'online',
    include_granted_scopes: 'true',
  });

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, 302);
}

export async function onRequestOptions() {
  return json({ ok: true });
}
