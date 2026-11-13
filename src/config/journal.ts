// Batas catatan harian — SATU sumber untuk app (Jurnal) dan buku cetak.
//
// Dihitung dari ruang halaman A4: lebar kolom catatan ±605 px,
// font 16 px → ±83 karakter per baris, dan tiap hari dialokasikan
// maksimal 2 baris agar 7 hari + widget pemantauan + ceklis tetap muat.
//
// 160 karakter = ±1,9 baris → aman, tidak terpotong di buku.
export const DAILY_NOTE_MAX_CHARS = 160;

/** Di atas jumlah ini, catatan butuh 2 baris di buku. */
export const DAILY_NOTE_LINE_CHARS = 80;

/**
 * Batasi catatan harian dengan aman untuk emoji.
 * Panjang dihitung per code point (bukan UTF-16), supaya emoji tidak terbelah
 * menjadi karakter rusak saat dipotong.
 */
export function clampDailyNote(value: string): string {
  const chars = Array.from(String(value ?? ''));
  if (chars.length <= DAILY_NOTE_MAX_CHARS) return String(value ?? '');
  const cut = chars.slice(0, DAILY_NOTE_MAX_CHARS).join('');
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
}

/** Jumlah karakter yang dilihat user (emoji = 1). */
export function countDailyNoteChars(value: string): number {
  return Array.from(String(value ?? '')).length;
}
