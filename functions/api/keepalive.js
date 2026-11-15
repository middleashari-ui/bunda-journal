// Health check Cloudflare D1 (Bunda Journal).
// Tidak perlu ping eksternal — Cloudflare D1 serverless & zero-pause.
export async function onRequestGet(context) {
  try {
    if (context.env.BUNDA_JOURNAL_DB) {
      const res = await context.env.BUNDA_JOURNAL_DB.prepare(
        "SELECT count(*) as total FROM bunda_subscriptions"
      ).first();
      return new Response(`d1 ok - subscriptions: ${res?.total ?? 0} - ${new Date().toISOString()}`, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    return new Response(`d1 binding not found - ${new Date().toISOString()}`, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (e) {
    return new Response(`d1 health error: ${e.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
