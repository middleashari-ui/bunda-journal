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
