// POST /api/auth/logout — hapus sesi.
import { json } from '../../_lib/auth';

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    const body: any = await request.json().catch(() => ({}));
    const token = String(body.token || '');
    if (token && env.BUNDA_JOURNAL_DB) {
      await env.BUNDA_JOURNAL_DB.prepare('DELETE FROM bunda_sessions WHERE token = ?').bind(token).run();
    }
    return json({ ok: true });
  } catch (err: any) {
    return json({ ok: true });
  }
}
