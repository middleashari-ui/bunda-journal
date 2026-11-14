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
- Service worker source: `v21` (live masih `v18`)
- Test: `npx playwright test` → 27 lulus (25 langsung + 2 flaky yang lulus retry), 1 visual WebKit di-skip
- Unit: `npm run test:unit` → 26 tes (habitStore, bookPages, batas catatan/emoji, migrasi skema)
- Bundle awal 918 KB → **628 KB** (buku, cetak, TabJurnal, TabProfil di-code-split; chunk gagal unduh di-retry sekali)
- `npm run audit:storage` → laporan pemakaian `localStorage` langsung + cek kebocoran key media
- Gate tier Essential sudah berkode tapi **mati**: `ESSENTIAL_GATE_ENABLED = false`
- `npx tsc --noEmit` bersih; `npm run build` sukses
- Skema data **v1** (`bunda_schema_version`) dengan migrasi index hari otomatis
- `SimulatorPanel` (panel dev) sudah dihapus dari `App.tsx`
- Media (foto USG, foto mingguan, isi bab 1–5) sudah pindah ke **IndexedDB** lewat
  `src/lib/mediaStore.ts` (cache sinkron dihidrasi saat boot); localStorage hanya
  menyimpan `bunda_media_index`
- Guard kuota: `src/lib/storageQuota.ts` → toast "Penyimpanan HP penuh" saat `QuotaExceededError`

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
- Foto & bab buku ada di IndexedDB (kuota besar); backup/sync tetap menyertakan
  isinya lewat `mediaSnapshot()`. Fallback ke localStorage otomatis kalau IDB gagal.

## Temuan bug hari — SUDAH DIPERBAIKI (14 Nov)

Diagnosis di handoff sebelumnya kurang tepat. `getWeekStrip()` tidak
mengembalikan urutan Senin–Minggu; ia mengisi array berdasarkan **index storage**.
Masalah sebenarnya: storage memakai `0=Rabu…6=Selasa` (`storageIndexOf`), sedangkan
`habitStore` dan buku memakai `0=Senin…6=Minggu`. Akibatnya data kebiasaan
(suplemen/hidrasi/jasmani) & mood tampil bergeser 2 hari di Beranda dan buku.

Perbaikan:
- Konvensi tunggal **Sen=0 … Min=6** (`src/lib/pregnancyDate.ts`).
- Migrasi data lama `+2 mod 7` via `src/lib/schemaMigration.ts`, idempoten lewat
  `bunda_schema_version`, jalan saat boot dan saat restore payload cloud.
- Key berbasis nama hari (`bunda_daily_w{week}`) dan slot foto (`bunda_{w}_foto_{i}`)
  tidak diubah; ada snapshot sementara `bunda_schema_backup_v1` (di-exclude dari sync).
- Regresi dijaga `tests/e2e/migration.spec.ts`.

## Langkah berikutnya (urut)

1. **Deploy production** (setelah tes HP):
   ```bash
   git checkout main && git merge --no-ff feat/journal-print-polish
   npm ci --legacy-peer-deps && npm run build
   npx wrangler pages deploy dist --project-name bunda-journal --branch main
   ```
2. **Tes HP**: print → Save as PDF; kartu jadwal → Kirim ke Ayah.
3. **Google Drive**: tambah `https://preview.bunda-journal.pages.dev` ke origins (opsional), lalu klik Backup sekali untuk consent.
4. **Refactor Fase 1 (sisa)**: audit 235 titik `localStorage` langsung (25 file) → modul storage bertipe.
5. Gate tier Essential — hanya setelah keputusan harga.

## Keputusan yang menunggu (jangan dieksekusi tanpa tanya)

| Hal | Kondisi sekarang |
|---|---|
| `PAYMENT_PAUSED` | masih `true` di `src/config/payments.ts`; kode Midtrans sudah ada tapi belum pernah aktif |
| Gate tier Essential (30 halaman) | kode siap: `ESSENTIAL_GATE_ENABLED = false` di `src/lib/bookPages.ts`; tinggal dinyalakan setelah keputusan harga |
| Voice QR | terblokir R2 (error 10042) |
| Commit working tree | puluhan file Midtrans/auth/legal/QA belum di-commit |

## Prompt pembuka sesi baru

> Lanjut dari branch `feat/journal-print-polish`. Baca `docs/handoff.md`, `docs/architecture.md`, dan `docs/deploy.md`. Kerjakan langkah berikutnya yang belum selesai; jangan ubah keputusan di tabel handoff tanpa bertanya.
