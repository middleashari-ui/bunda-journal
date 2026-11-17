// POST /api/push/subscribe — simpan subscription push + jadwal pengingat.
// Hanya metadata pengingat (judul, jam, timezone); isi jurnal tidak dikirim.
import { getSessionEmail, json, normalizeEmail } from '../../_lib/auth';
import { checkRateLimit, clientIp, tooManyRequests } from '../../_lib/rateLimit';
import { normalizePushReminders } from '../../_lib/pushSchedule';

const DEVICE_RE = /^[A-Za-z0-9_-]{8,80}$/;

export async function onRequestPost(context: any) {
  const { request, env } = context;
  if (!env.BUNDA_JOURNAL_DB) {
    return json({ error: 'Database belum tersedia.' }, 503);
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body JSON tidak valid.' }, 400);
  }

  const rl = await checkRateLimit(env, `push-sub:${clientIp(request)}`, 30, 3600);
  if (rl.limited) return tooManyRequests(rl.retryAfter);

  const deviceId = String(body.deviceId || '').trim();
  if (!DEVICE_RE.test(deviceId)) {
    return json({ error: 'deviceId tidak valid.' }, 400);
  }

  const sub = body.subscription || {};
  const endpoint = String(sub.endpoint || '').trim();
  const p256dh = String(sub.keys?.p256dh || '').trim();
  const auth = String(sub.keys?.auth || '').trim();
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth) {
    return json({ error: 'Subscription push tidak valid.' }, 400);
  }

  const rawOffset = Number(body.tzOffsetMinutes);
  const tzOffsetMinutes = Number.isFinite(rawOffset) && rawOffset >= -840 && rawOffset <= 840
    ? Math.round(rawOffset)
    : 0;

  const reminders = normalizePushReminders(body.reminders, tzOffsetMinutes);

  // Email hanya kalau ada sesi; aplikasi tetap bisa dipakai tanpa akun.
  const authHeader = String(request.headers.get('Authorization') || '');
  const bearer = /^bearer\s+/i.test(authHeader) ? authHeader.replace(/^bearer\s+/i, '').trim() : '';
  const token = bearer || String(body.token || '').trim();
  const email = token ? normalizeEmail(await getSessionEmail(env, token)) : '';

  try {
    const statements = [
      env.BUNDA_JOURNAL_DB.prepare(
        'DELETE FROM push_reminders WHERE subscription_id = ?'
      ).bind(deviceId),
      env.BUNDA_JOURNAL_DB.prepare(
        'DELETE FROM push_subscriptions WHERE endpoint = ? AND device_id <> ?'
      ).bind(endpoint, deviceId),
      env.BUNDA_JOURNAL_DB.prepare(
        `INSERT INTO push_subscriptions
          (device_id, endpoint, p256dh, auth, user_email, tz_offset_minutes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(device_id) DO UPDATE SET
           endpoint = excluded.endpoint,
           p256dh = excluded.p256dh,
           auth = excluded.auth,
           user_email = excluded.user_email,
           tz_offset_minutes = excluded.tz_offset_minutes,
           updated_at = datetime('now')`
      ).bind(deviceId, endpoint, p256dh, auth, email || null, tzOffsetMinutes),
    ];

    for (const reminder of reminders) {
      statements.push(
        env.BUNDA_JOURNAL_DB.prepare(
          `INSERT INTO push_reminders
            (subscription_id, tag, title, body, time_local, time_utc, enabled, last_sent_date, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'))`
        ).bind(
          deviceId,
          reminder.tag,
          reminder.title,
          reminder.body,
          reminder.timeLocal,
          reminder.timeUtc,
          reminder.enabled
        )
      );
    }

    await env.BUNDA_JOURNAL_DB.batch(statements);
    return json({ ok: true, reminders: reminders.length });
  } catch (err: any) {
    console.warn('push subscribe error', err);
    return json({ error: 'Gagal menyimpan subscription push.' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
