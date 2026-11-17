// GET /api/push/status?deviceId=... — cek apakah subscription & jadwal tersimpan.
import { json } from '../../_lib/auth';
import { checkRateLimit, clientIp, tooManyRequests } from '../../_lib/rateLimit';

export async function onRequestGet(context: any) {
  const { request, env } = context;
  if (!env.BUNDA_JOURNAL_DB) return json({ error: 'Database belum tersedia.' }, 503);

  const url = new URL(request.url);
  const deviceId = String(url.searchParams.get('deviceId') || '').trim();
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(deviceId)) {
    return json({ error: 'deviceId tidak valid.' }, 400);
  }

  const rl = await checkRateLimit(env, `push-status:${clientIp(request)}`, 60, 60);
  if (rl.limited) return tooManyRequests(rl.retryAfter);

  try {
    const sub: any = await env.BUNDA_JOURNAL_DB.prepare(
      'SELECT device_id, tz_offset_minutes, updated_at FROM push_subscriptions WHERE device_id = ?'
    )
      .bind(deviceId)
      .first();
    if (!sub) return json({ ok: true, exists: false, reminders: 0 }, 200, { 'Cache-Control': 'no-store' });

    const count: any = await env.BUNDA_JOURNAL_DB.prepare(
      'SELECT COUNT(*) AS total FROM push_reminders WHERE subscription_id = ? AND enabled = 1'
    )
      .bind(deviceId)
      .first();

    return json(
      {
        ok: true,
        exists: true,
        reminders: Number(count?.total || 0),
        tzOffsetMinutes: sub.tz_offset_minutes,
        updatedAt: sub.updated_at,
      },
      200,
      { 'Cache-Control': 'no-store' }
    );
  } catch (err) {
    console.warn('push status error', err);
    return json({ error: 'Gagal membaca status push.' }, 500);
  }
}
