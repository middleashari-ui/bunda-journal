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

// Segmentasi per grapheme: "👨‍👩‍👧" atau "👍🏽" dihitung 1 karakter (sesuai
// keputusan produk "emoji = 1"), bukan 5-8 code point. Fallback ke code point
// untuk browser lama yang belum punya Intl.Segmenter.
const segmenter: { segment(input: string): Iterable<{ segment: string }> } | null = (() => {
  try {
    const SegmenterCtor = (Intl as unknown as {
      Segmenter?: new (locale?: string, options?: { granularity: string }) => {
        segment(input: string): Iterable<{ segment: string }>;
      };
    }).Segmenter;
    return SegmenterCtor ? new SegmenterCtor('id', { granularity: 'grapheme' }) : null;
  } catch {
    return null;
  }
})();

/** Pecah teks menjadi karakter yang dilihat user (grapheme). */
export function splitDailyNoteChars(value: string): string[] {
  const text = String(value ?? '');
  if (segmenter) {
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

/**
 * Batasi catatan harian dengan aman untuk emoji.
 * Tidak memotong di tengah grapheme, dan kalau kepanjangan memotong di spasi
 * terakhir supaya tidak ada kata yang terbelah.
 */
export function clampDailyNote(value: string): string {
  const text = String(value ?? '');
  const chars = splitDailyNoteChars(text);
  if (chars.length <= DAILY_NOTE_MAX_CHARS) return text;
  const cut = chars.slice(0, DAILY_NOTE_MAX_CHARS).join('');
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
}

/** Jumlah karakter yang dilihat user (emoji = 1). */
export function countDailyNoteChars(value: string): number {
  return splitDailyNoteChars(value).length;
}
