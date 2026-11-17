// Utilitas jadwal Web Push: konversi jam lokal → UTC dan validasi payload.

export interface PushReminderInput {
  tag?: unknown;
  title?: unknown;
  body?: unknown;
  timeLocal?: unknown;
  enabled?: unknown;
}

export interface NormalizedPushReminder {
  tag: string;
  title: string;
  body: string;
  timeLocal: string;
  timeUtc: string;
  enabled: number;
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TAG_RE = /^[A-Za-z0-9_-]{1,40}$/;

export function isTimeHHMM(value: string): boolean {
  return TIME_RE.test(value);
}

/** offset = Date.getTimezoneOffset() (menit; WIB = -420). */
export function localToUtcTime(timeLocal: string, tzOffsetMinutes: number): string | null {
  if (!isTimeHHMM(timeLocal) || !Number.isFinite(tzOffsetMinutes)) return null;
  const [h, m] = timeLocal.split(':').map(Number);
  const local = h * 60 + m;
  const utc = ((local + tzOffsetMinutes) % 1440 + 1440) % 1440;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(utc / 60))}:${pad(utc % 60)}`;
}

export function normalizePushReminders(
  input: unknown,
  tzOffsetMinutes: number
): NormalizedPushReminder[] {
  if (!Array.isArray(input)) return [];
  const out: NormalizedPushReminder[] = [];
  const seen = new Set<string>();

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as PushReminderInput;
    const tag = String(item.tag || '').trim();
    const title = String(item.title || '').trim().slice(0, 60);
    const body = String(item.body || '').trim().slice(0, 160);
    const timeLocal = String(item.timeLocal || '').trim();
    if (!TAG_RE.test(tag) || !title || !isTimeHHMM(timeLocal)) continue;
    if (seen.has(tag)) continue;
    const timeUtc = localToUtcTime(timeLocal, tzOffsetMinutes);
    if (!timeUtc) continue;
    seen.add(tag);
    out.push({
      tag,
      title,
      body,
      timeLocal,
      timeUtc,
      enabled: item.enabled === false ? 0 : 1,
    });
    if (out.length >= 20) break;
  }
  return out;
}

export function utcClock(date: Date = new Date()): { time: string; date: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    time: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`,
    date: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
  };
}
