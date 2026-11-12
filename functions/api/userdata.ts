// /api/userdata — simpan & ambil seluruh data jurnal milik SATU email (per-user, lintas device).
// GET  ?token=...        -> { ok, payload }
// POST { token, payload } -> upsert
import { json, getSessionEmail } from '../_lib/auth';

const MAX_PAYLOAD = 900000; // ~900KB, aman di bawah limit baris D1

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet(context: any) {
  const { request, env } = context;
  try {
    if (!env.BUNDA_JOURNAL_DB) return json({ error: 'Database belum terhubung.' }, 500);
    const url = new URL(request.url);
    const email = await getSessionEmail(env, url.searchParams.get('token') || '');
    if (!email) return json({ ok: false, error: 'Sesi tidak valid.' }, 401);

    const row: any = await env.BUNDA_JOURNAL_DB.prepare(
      'SELECT payload, updated_at FROM bunda_user_data WHERE email = ?'
    ).bind(email).first();

    return json({
      ok: true,
      email,
      exists: !!row,
      payload: row?.payload || '',
      updated_at: row?.updated_at || null,
    });
  } catch (err: any) {
    return json({ error: err?.message || 'Gagal memuat data.' }, 500);
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    if (!env.BUNDA_JOURNAL_DB) return json({ error: 'Database belum terhubung.' }, 500);
    const body: any = await request.json().catch(() => ({}));
    const email = await getSessionEmail(env, String(body.token || ''));
    if (!email) return json({ ok: false, error: 'Sesi tidak valid.' }, 401);

    let payload = typeof body.payload === 'string' ? body.payload : JSON.stringify(body.payload || {});
    if (payload.length > MAX_PAYLOAD) return json({ error: 'Data terlalu besar.' }, 413);

    // PENGAMAN ANTI-HILANG: gabungkan dengan payload tersimpan (merge, bukan replace).
    // Client lama / device yang localStorage-nya kosong tidak boleh menghapus data
    // yang sudah ada di D1 hanya karena key-nya tidak ikut terkirim.
    // Key yang DIKIRIM tetap menang (jadi edit/isi kosong tetap tersimpan).
    try {
      const prevRow: any = await env.BUNDA_JOURNAL_DB.prepare(
        'SELECT payload FROM bunda_user_data WHERE email = ?'
      ).bind(email).first();
      if (prevRow && prevRow.payload) {
        const prev = JSON.parse(prevRow.payload);
        const next = JSON.parse(payload);
        const merged: any = { ...prev, ...next };
        // jadwal yang sudah terisi tidak boleh hilang karena payload tanpa key itu
        let prevAppt: any = null;
        try { prevAppt = JSON.parse(prev.bunda_appointment || 'null'); } catch { prevAppt = null; }
        if (prevAppt && (prevAppt.dokter || prevAppt.date) && !merged.bunda_appointment) {
          merged.bunda_appointment = prev.bunda_appointment;
        }
        payload = JSON.stringify(merged);
      }
    } catch {}

    await env.BUNDA_JOURNAL_DB.prepare(
      `INSERT INTO bunda_user_data (email, payload, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(email) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`
    ).bind(email, payload).run();

    return json({ ok: true, email, bytes: payload.length });
  } catch (err: any) {
    return json({ error: err?.message || 'Gagal menyimpan data.' }, 500);
  }
}
