// POST /api/push/unsubscribe — hapus subscription + seluruh jadwal perangkat.
import { json } from '../../_lib/auth';

export async function onRequestPost(context: any) {
  const { request, env } = context;
  if (!env.BUNDA_JOURNAL_DB) return json({ error: 'Database belum tersedia.' }, 503);

  let body: any = {};
  try {
    body = await request.json();
  } catch {}

  const deviceId = String(body.deviceId || '').trim();
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(deviceId)) {
    return json({ error: 'deviceId tidak valid.' }, 400);
  }

  try {
    await env.BUNDA_JOURNAL_DB.batch([
      env.BUNDA_JOURNAL_DB.prepare('DELETE FROM push_reminders WHERE subscription_id = ?').bind(deviceId),
      env.BUNDA_JOURNAL_DB.prepare('DELETE FROM push_subscriptions WHERE device_id = ?').bind(deviceId),
    ]);
    return json({ ok: true });
  } catch (err) {
    console.warn('push unsubscribe error', err);
    return json({ error: 'Gagal menghapus subscription.' }, 500);
  }
}
