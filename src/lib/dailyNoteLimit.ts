import { clampDailyNote, splitDailyNoteChars } from '../config/journal';

/**
 * Batasi isi textarea agar maksimal `maxLines` baris visual pada lebar saat ini.
 * Dipakai di Jurnal dan halaman buku supaya wrapping tidak pernah lebih dari
 * area yang tercetak (2 baris).
 */
export function clampTextareaToLines(ta: HTMLTextAreaElement, maxLines = 2): string {
  const style = window.getComputedStyle(ta);
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2 || 16;
  const padding =
    (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
  // scrollHeight minimal sama dengan clientHeight, jadi ambil batas yang lebih
  // besar agar textarea kosong tidak terus dipotong.
  const maxHeight = Math.max(lineHeight * maxLines + padding + 1, ta.clientHeight + 1);

  const clamped = clampDailyNote(ta.value);
  ta.value = clamped;
  if (!clamped || ta.scrollHeight <= maxHeight) return clamped;

  // Binary search jumlah grapheme yang masih muat — jauh lebih cepat daripada
  // memotong satu per satu (halaman buku bisa berisi ratusan textarea).
  const chars = splitDailyNoteChars(clamped);
  let low = 0;
  let high = chars.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    ta.value = chars.slice(0, mid).join('');
    if (ta.scrollHeight <= maxHeight) low = mid;
    else high = mid - 1;
  }

  const fitted = chars.slice(0, low).join('');
  const lastSpace = fitted.lastIndexOf(' ');
  const value = lastSpace > 40 ? fitted.slice(0, lastSpace).trimEnd() : fitted.trimEnd();
  ta.value = value;
  return value;
}
