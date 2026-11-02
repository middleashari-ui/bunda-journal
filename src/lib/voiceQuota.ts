// Kuota Voice Note per tier. Starter 3x, lengkap/vip 10x.
// Key localStorage tunggal, additive — tidak ganggu key jurnal existing.
// ponytail: pindah ke Supabase voice_notes count saat auth user_id stabil,
// tambah saat butuh sinkron antar device.

export type JournalTier = 'essential' | 'vip';

const VOICE_KEY = 'bunda_voice_count';

export function getVoiceCount(): number {
  try {
    return parseInt(localStorage.getItem(VOICE_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function voiceLimitFor(tier: JournalTier): number {
  return tier === 'vip' ? 10 : 3;
}

export function canRecordVoice(tier: JournalTier): boolean {
  return getVoiceCount() < voiceLimitFor(tier);
}

export function bumpVoiceCount(): number {
  const next = getVoiceCount() + 1;
  try {
    localStorage.setItem(VOICE_KEY, String(next));
  } catch {}
  return next;
}
