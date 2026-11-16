// Rate limit sederhana berbasis D1 (dipakai login/register/charge).
// Fail-open: kalau tabel/DB belum ada, permintaan tetap dilayani.

export interface RateLimitResult {
  limited: boolean;
  retryAfter: number;
  remaining: number;
}

export function clientIp(request: Request): string {
  const anyReq = request as unknown as { headers: Headers };
  return (
    anyReq.headers.get('cf-connecting-ip') ||
    anyReq.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export async function checkRateLimit(
  env: any,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const db = env?.BUNDA_JOURNAL_DB;
  if (!db) return { limited: false, retryAfter: 0, remaining: limit };

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  try {
    await db
      .prepare(
        `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN rate_limits.window_start <= ? THEN 1 ELSE rate_limits.count + 1 END,
           window_start = CASE WHEN rate_limits.window_start <= ? THEN ? ELSE rate_limits.window_start END`
      )
      .bind(key, now, windowStart, windowStart, now)
      .run();

    const row: any = await db.prepare('SELECT count, window_start FROM rate_limits WHERE key = ?').bind(key).first();
    const count = Number(row?.count || 1);
    const startedAt = Number(row?.window_start || now);
    const retryAfter = Math.max(1, startedAt + windowSeconds - now);

    return { limited: count > limit, retryAfter, remaining: Math.max(0, limit - count) };
  } catch {
    return { limited: false, retryAfter: 0, remaining: limit };
  }
}

export function tooManyRequests(retryAfter: number) {
  return new Response(
    JSON.stringify({
      error: 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.',
      retry_after: retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
}
