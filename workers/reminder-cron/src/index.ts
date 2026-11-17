// Worker cron: kirim Web Push untuk pengingat yang jatuh tempo.
// Berjalan tiap menit. Hanya membaca tabel push_* (bukan data jurnal).
import { buildPushPayload, type VapidKeys } from '@block65/webcrypto-web-push';
import { utcClock } from '../../../functions/_lib/pushSchedule';

interface Env {
  BUNDA_JOURNAL_DB: any;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
}

interface DueRow {
  subscription_id: string;
  tag: string;
  title: string;
  body: string;
  time_local: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendOne(env: Env, row: DueRow, date: string): Promise<'sent' | 'gone' | 'failed'> {
  const vapid: VapidKeys = {
    subject: (env.VAPID_SUBJECT || 'mailto:support@bundajournal.my.id').trim(),
    publicKey: env.VAPID_PUBLIC_KEY.trim(),
    privateKey: env.VAPID_PRIVATE_KEY.trim(),
  };

  const payload = await buildPushPayload(
    {
      data: JSON.stringify({
        title: row.title,
        body: row.body || 'Pengingat dari Bunda Journal.',
        url: '/#/jurnal',
        tag: row.tag,
        time: row.time_local || '',
      }),
      options: { ttl: 300 },
    },
    {
      endpoint: row.endpoint,
      expirationTime: null,
      keys: { p256dh: row.p256dh, auth: row.auth },
    },
    vapid
  );

  try {
    const res = await fetch(row.endpoint, payload);
    if (res.ok) {
      await env.BUNDA_JOURNAL_DB.prepare(
        'UPDATE push_reminders SET last_sent_date = ?, updated_at = datetime("now") WHERE subscription_id = ? AND tag = ?'
      )
        .bind(date, row.subscription_id, row.tag)
        .run();
      return 'sent';
    }
    if (res.status === 404 || res.status === 410) {
      await env.BUNDA_JOURNAL_DB.batch([
        env.BUNDA_JOURNAL_DB.prepare('DELETE FROM push_reminders WHERE subscription_id = ?').bind(row.subscription_id),
        env.BUNDA_JOURNAL_DB.prepare('DELETE FROM push_subscriptions WHERE device_id = ?').bind(row.subscription_id),
      ]);
      return 'gone';
    }
    console.warn('push failed', res.status, row.subscription_id, row.tag);
    return 'failed';
  } catch (err) {
    console.warn('push fetch error', err);
    return 'failed';
  }
}

async function run(env: Env) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys belum diset');
    return;
  }

  const { time, date } = utcClock();
  const result: any = await env.BUNDA_JOURNAL_DB.prepare(
    `SELECT r.subscription_id, r.tag, r.title, r.body, r.time_local,
            s.endpoint, s.p256dh, s.auth
       FROM push_reminders r
       JOIN push_subscriptions s ON s.device_id = r.subscription_id
      WHERE r.enabled = 1
        AND r.time_utc = ?
        AND (r.last_sent_date IS NULL OR r.last_sent_date <> ?)
      LIMIT 500`
  )
    .bind(time, date)
    .all();

  const rows = (result?.results || []) as DueRow[];
  if (rows.length === 0) return;

  let sent = 0;
  let gone = 0;
  for (let i = 0; i < rows.length; i += 20) {
    const chunk = rows.slice(i, i + 20);
    const outcomes = await Promise.all(chunk.map((row) => sendOne(env, row, date)));
    sent += outcomes.filter((o) => o === 'sent').length;
    gone += outcomes.filter((o) => o === 'gone').length;
  }
  console.log(JSON.stringify({ at: `${date} ${time}`, due: rows.length, sent, gone }));
}

export default {
  async scheduled(_controller: any, env: Env, ctx: any) {
    ctx.waitUntil(run(env));
  },
  async fetch() {
    return new Response(JSON.stringify({ ok: true, service: 'bunda-reminder-cron' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
