# Handoff — lanjutan sesi berikutnya

Terakhir diperbarui: 14 Nov 2026
Branch: `feat/journal-print-polish` (belum di-merge, production belum di-update)

## Baca dulu

1. `docs/status-2026-11-13.md` — apa yang selesai & bukti
2. `docs/architecture.md` — peta arsitektur + utang teknis (P0–P3)
3. `docs/deploy.md` — langkah deploy + rollback
4. `docs/google-drive-setup.md` — konfigurasi OAuth Drive

## Kondisi sekarang

- Preview live: `https://preview.bunda-journal.pages.dev` (build terakhir: landing + screenshot)
- Production: **masih versi lama**, sengaja belum disentuh
- Service worker source: `v20` (live masih `v18`)
- Test: `npm run test:e2e:chromium` 9/9, `test:e2e:webkit` lulus dengan retry, `test:visual` 5 baseline Chromium
- `npx tsc --noEmit` bersih

## Keputusan yang sudah diambil (jangan diubah tanpa alasan)

| Keputusan | Alasan |
|---|---|
| Mode lokal: jurnal TIDAK dikirim ke D1 | USP privasi; server hanya akun/tier/order |
| Buku A4 210×297, bukan B5 | viewer HP Android/iOS menampilkan A4 dengan baik |
| Catatan harian maks 160 karakter (emoji = 1) | 83 karakter/baris → 2 baris; sumber: `src/config/journal.ts` |
| Preview = hasil cetak | satu layout; `PrintBookView` + `print CSS` |
| Voice QR **ditunda** | butuh hosting permanen (R2/KV) + transcode MP3; klaim sudah dihapus dari landing & pricing |
| Landing pakai screenshot asli + lightbox | klaim jujur, screenshot 3× DPI |

## Yang perlu diketahui sebelum lanjut

- `PAYMENT_PAUSED` masih aktif → CTA landing “VIP Segera Hadir”.
- `GOOGLE_CLIENT_ID` sudah di-set sebagai **secret production** di Pages, dan juga `VITE_GOOGLE_CLIENT_ID` (build-time, agar preview ikut).
- **R2 belum diaktifkan** di akun Cloudflare (error 10042) → Voice QR belum bisa dibangun.
- Domain preview `preview.bunda-journal.pages.dev` belum terdaftar di Authorized JavaScript origins → consent Drive akan gagal jika dites di preview.
- Foto masih base64 di `localStorage` (kuota ~5 MB) — lihat P0 di `docs/architecture.md`.

## Temuan bug yang belum diperbaiki

`TabJurnal` memakai `DAY_KEYS = ['Rab','Kam','Jum','Sab','Min','Sen','Sel']`
tetapi `getWeekStrip()` mengembalikan urutan Senin–Minggu. Artinya label hari
bisa tidak cocok dengan tanggal (mis. catatan “Sen” tersimpan di slot Kamis).
Catatan buku (`WeeklyJournalSpread`) memakai nama hari, jadi bisa beda.

Dampak: data tetap tersimpan, tetapi penempatan hari bisa meleset. Perbaiki dengan
satu konvensi: Sen=0 … Min=6, lalu migrasi key lama (lihat `habitStore` yang sudah benar).

## Langkah berikutnya (urut)

1. **Deploy production** (setelah tes HP):
   ```bash
   git checkout main && git merge --no-ff feat/journal-print-polish
   npm ci --legacy-peer-deps && npm run build
   npx wrangler pages deploy dist --project-name bunda-journal --branch main
   ```
2. **Tes HP**: print → Save as PDF; kartu jadwal → Kirim ke Ayah.
3. **Google Drive**: tambah `https://preview.bunda-journal.pages.dev` ke origins (opsional), lalu klik Backup sekali untuk consent.
4. **Refactor Fase 1** (data safety): foto ke IndexedDB, guard kuota, `schema_version`.
5. Gate tier Essential — hanya setelah keputusan harga.

## Prompt pembuka sesi baru

> Lanjut dari branch `feat/journal-print-polish`. Baca `docs/handoff.md`, `docs/architecture.md`, dan `docs/deploy.md`. Kerjakan langkah berikutnya yang belum selesai; jangan ubah keputusan di tabel handoff tanpa bertanya.
