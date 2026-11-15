// Shared auth helpers untuk Cloudflare Pages Functions.
// Disimpan di folder berawalan "_" supaya TIDAK menjadi route publik.

const enc = new TextEncoder();

export const json = (data: any, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      ...extraHeaders,
    },
  });

export const normalizeEmail = (email: any): string =>
  String(email || '').trim().toLowerCase();

export function randomHex(bytes = 24): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function pbkdf2(password: string, salt: string, iterations = 100000): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations, hash: 'SHA-256' },
    key,
    256
  );
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Bandingkan hash dengan waktu konstan (hindari timing leak). */
export function safeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function validatePassword(pw: string): string | null {
  if (!pw || pw.length < 6) return 'Password minimal 6 karakter.';
  if (pw.length > 200) return 'Password terlalu panjang.';
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email) return 'Email wajib diisi.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Format email tidak valid.';
  if (email.length > 120) return 'Email terlalu panjang.';
  return null;
}

/** Buat sesi baru, kembalikan token. */
export async function createSession(env: any, email: string): Promise<string> {
  const token = randomHex(32);
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.BUNDA_JOURNAL_DB.prepare(
    'INSERT INTO bunda_sessions (token, email, expires_at) VALUES (?, ?, ?)'
  ).bind(token, email, expires).run();
  return token;
}

/** Validasi token -> email, atau null. */
export async function getSessionEmail(env: any, token: string): Promise<string | null> {
  if (!token) return null;
  const row: any = await env.BUNDA_JOURNAL_DB.prepare(
    'SELECT email, expires_at FROM bunda_sessions WHERE token = ?'
  ).bind(token).first();
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await env.BUNDA_JOURNAL_DB.prepare('DELETE FROM bunda_sessions WHERE token = ?').bind(token).run();
    return null;
  }
  return row.email;
}

/** Tier efektif dari D1 (vip / essential / none). */
export async function getTier(env: any, email: string): Promise<string> {
  try {
    const row: any = await env.BUNDA_JOURNAL_DB.prepare(
      'SELECT tier, is_paid FROM bunda_subscriptions WHERE email = ?'
    ).bind(email).first();
    if (row && (row.tier === 'vip' || row.tier === 'essential') && row.is_paid) return row.tier;
  } catch {}
  return 'none';
}
