/** Utilitas jadwal pengingat harian (HH:MM, zona waktu perangkat). */

export function minutesOfDay(value: string): number | null {
  const [h, m] = String(value || '').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/**
 * Pengingat dianggap jatuh tempo kalau jamnya sudah lewat, maksimal `graceMinutes`.
 * Dipakai supaya alarm tetap muncul saat Android menahan timer di background,
 * bukan hanya pada kecocokan menit yang persis.
 */
export function isReminderDue(
  time: string,
  now: Date = new Date(),
  graceMinutes = 720
): boolean {
  const target = minutesOfDay(time);
  if (target === null) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= target && current - target <= graceMinutes;
}

/** Kunci "sudah dikirim hari ini" per pengingat. */
export function reminderDayKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}
