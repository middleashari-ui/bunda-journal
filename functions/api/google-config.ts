// Endpoint publik: client ID OAuth Google untuk Google Identity Services (Drive backup).
// Client ID bukan rahasia — memang dikirim ke browser oleh Google.
import { json } from '../_lib/auth';

export async function onRequestGet(context: any) {
  const { env } = context;
  const clientId = String(env.GOOGLE_CLIENT_ID || '').trim();
  return json({ ok: true, clientId });
}

export async function onRequestOptions() {
  return json({ ok: true });
}
