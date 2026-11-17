// GET /api/push/config — public VAPID key untuk subscription browser.
import { json } from '../../_lib/auth';

export async function onRequestGet(context: any) {
  const { env } = context;
  const publicKey = String(env.VAPID_PUBLIC_KEY || '').trim();
  const enabled = Boolean(publicKey) && String(env.PUSH_ENABLED || 'true') !== 'false';
  return json(
    { ok: enabled, enabled, publicKey: enabled ? publicKey : '' },
    200,
    { 'Cache-Control': 'no-store' }
  );
}
