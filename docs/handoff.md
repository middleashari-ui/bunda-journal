# Handoff — lanjutan sesi berikutnya

Terakhir diperbarui: 17 Nov 2026
Branch: `main`
Production: `https://www.bundajournal.my.id` (deployment Cloudflare `3e6595d2`,
17 Nov 2026; SW v27; Worker cron `bunda-reminder-cron` aktif; health `keyCheck: invalid` — server key production perlu diganti)

## Baca dulu

1. `docs/status-2026-11-13.md` — apa yang selesai & bukti
2. `docs/architecture.md` — peta arsitektur + utang teknis (P0–P3)
3. `docs/deploy.md` — langkah deploy + rollback
4. `docs/google-drive-setup.md` — konfigurasi OAuth Drive
5. `docs/meta-ads-command-center/IMPLEMENTATION-STATUS.md` — status Ruang Iklan (`/ads`)
6. `docs/accessibility-audit.md` — hasil audit aksesibilitas 16 Nov

## Kondisi sekarang

- Production berjalan dari `main`; commit terakhir sebelum sesi 16 Nov: `d01c325`
  (rate limit API sensitif + gerbang ekspor diverifikasi server).
- Test: `npm run test:unit` → **81 tes / 11 file**; E2E utama + checkout **23**;
  E2E Ruang Iklan **12/12** (6 Chromium + 6 WebKit).
- Bundle awal tetap di-code-split: `index` ±625 KB, `AdsApp` 212 KB dimuat hanya di `/ads`.
- `npm run audit:storage` → **58 pemanggilan** di satu file arsip
  `src/utils/_legacy/JournalPdfDocument.tsx`; **0 di kode aktif**. Kode aktif lewat
  `src/lib/storage/appStorage.ts` (termasuk tema `/ads`).
- Gate tier Essential sudah berkode tapi **mati**: `ESSENTIAL_GATE_ENABLED = false`.
- **Pembayaran aktif**: `PAYMENT_PAUSED = false`; kill switch server lewat env
  `PAYMENT_PAUSED=true`. Detail: `docs/payment-setup.md`.
- Skema data **v1** (`bunda_schema_version`), index hari **Sen=0 … Min=6**.
- Foto & isi bab 1–5 di **IndexedDB** (`src/lib/mediaStore.ts`); localStorage hanya
  `bunda_media_index`. Guard kuota `src/lib/storageQuota.ts`.
- Service worker source `v27` (`public/sw.js`), install resilien, handler push/klik notifikasi, cache nada notifikasi.
- **Ruang Iklan `/ads`** (demo, terpisah dari PWA): 5 tab, 14 kalkulator, CSV,
  approval lokal. Data demo deterministik; **tidak ada request ke Meta** dan token
  tidak disimpan. Route `/ads*` memakai fallback SPA otomatis Cloudflare Pages.

## Yang sudah selesai

| Area | Bukti |
|---|---|
| Migrasi skema hari (Sen=0) + migrasi idempoten | `src/lib/schemaMigration.ts`, `tests/e2e/migration.spec.ts` |
| Foto → IndexedDB + fallback localStorage | `src/lib/mediaStore.ts` |
| Semua akses localStorage aktif lewat `appStorage` | `npm run audit:storage` → 0 di kode aktif |
| Code-split buku/cetak/TabJurnal/TabProfil/Ruang Iklan | `src/main.tsx`, `npm run build` |
| Jasmani harian/mingguan/bulanan + rings di buku & kartu "Gerak & Tidur Bunda" | `habitStore`, Beranda |
| Log error lokal, storage usage nyata, pengingat backup | commit `437e70d` |
| Rate limit login/register/charge (D1) + gerbang ekspor `/api/entitlement` | commit `d01c325` (gate dormant) |
| Ruang Iklan demo `/ads` | `src/ads/`, `docs/meta-ads-command-center/` |
| Audit aksesibilitas (axe WCAG A/AA) | `docs/accessibility-audit.md`; Lighthouse landing 1.00; semua layar utama 0 violation |
| Payment gateway Midtrans Snap | `functions/_lib/payments.ts`, charge/callback/upgrade, health; uji sandbox 15/15 di `docs/payment-setup.md` |
| Notifikasi PWA (logo + klik) + toast unduhan + catatan Ayah di WhatsApp + backup Drive tahan ganti HP | `src/utils/notifications.ts`, `public/sw.js`, `TabJurnal`, `driveBackup` |
| Riwayat timer kontraksi (durasi + jam otomatis) & hitungan tendangan (sesi + waktu) | `TabProfil` |
| Isi otomatis jurnal dengan review (contoh kalimat, bukan catatan asli) | `AutoFillJournalModal`, tombol di Profil |
| Notifikasi custom (judul, pesan, jam) + semua notifikasi berlogo "Bunda Journal — …" | Profil → Notifikasi Custom, scheduler di `App.tsx` |
| Nada notifikasi custom (audio dari Bunda) | `public/sounds/bunda-notif.mp3`, `playGentleChime()` |
| Auto-backup Drive tidak membuka popup/izin sendiri | `requestDriveToken(false)` return null tanpa token; auto-backup hanya saat app hidden/online |
| Alarm pengingat toleran keterlambatan 3 jam + cek saat app kembali terlihat | `src/lib/reminderSchedule.ts`, scheduler `App.tsx` |
| Notifikasi tidak dobel (tag + tanpa fallback `new Notification` saat SW ada) | `src/utils/notifications.ts` |
| Pop-up pengingat saat app terlihat + tombol Buka Jurnal; klik notifikasi sistem membuka `/#/jurnal` | `ReminderPopup.tsx`, scheduler `App.tsx`, `sw.js` |
| Reset penanda pengingat versi lama + tombol "Cek Pengingat Sekarang" | `bunda_reminder_engine=v2`, `TabProfil` |
| Toleransi pengingat 12 jam + tombol "Tampilkan Contoh Pop-up" | `reminderSchedule.ts`, `TabProfil` |
| Install PWA cepat (bukan 15 menit) | `public/sw.js` v26: hapus URL yang kena 308 (`/index.html`, `/offline.html`), cache per-file |
| Web Push saat app ditutup (default aktif, jadwal saja bukan jurnal) | `src/lib/pushNotifications.ts`, `/api/push/*` (termasuk status), Worker `workers/reminder-cron`, `schema_push.sql`; cron teruji `due:1 sent:1`; detail `docs/push-notifications.md` |
| Catatan harian per hari (tidak membawa teks kemarin) + batas 2 baris di Jurnal & buku | `dailyNoteLimit.ts`, tes e2e |

## Keputusan yang sudah diambil (jangan diubah tanpa alasan)

| Keputusan | Alasan |
|---|---|
| Mode lokal: jurnal TIDAK dikirim ke D1 | USP privasi; server hanya akun/tier/order |
| Buku A4 210×297, bukan B5 | viewer HP Android/iOS menampilkan A4 dengan baik |
| Catatan harian maks 160 karakter (emoji = 1) | 83 karakter/baris → 2 baris; sumber: `src/config/journal.ts` |
| Preview = hasil cetak | satu layout; `PrintBookView` + `print CSS` |
| Voice QR **ditunda** | butuh hosting permanen (R2/KV) + transcode MP3; klaim sudah dihapus dari landing & pricing |
| Landing pakai screenshot asli + lightbox | klaim jujur, screenshot 3× DPI |
| Ruang Iklan terpisah dari PWA | user PWA tidak membayar bundle 212 KB; SW consumer tidak dipakai di `/ads` |

## Yang belum selesai (urut prioritas)

1. **Tes restore backup di HP asli** — ekspor lalu impor ulang; pastikan foto/bab
   IndexedDB ikut kembali. Tidak bisa diotomatiskan dari desktop.
2. **Aksesibilitas lanjutan** — audit axe selesai, focus trap + Escape dan roving
   tabindex sudah ada. Sisa satu keputusan desain: kontras palet tema buku di
   `/print` (703 node; lihat `docs/accessibility-audit.md`).
3. **Ganti MIDTRANS_SERVER_KEY production** — charge production masih 401
   `Unauthorized` dari Midtrans (kunci secret lama/tidak aktif). Ambil server key
   production yang benar di dashboard Midtrans → Settings → Access Keys, lalu:
   `npx wrangler pages secret put MIDTRANS_SERVER_KEY --project-name bunda-journal`.
   Setelah itu uji `POST /api/midtrans/charge` harus 200 (bukan 424
   `MIDTRANS_AUTH`). Lalu set Payment Notification URL ke
   `https://www.bundajournal.my.id/api/midtrans-callback`, aktifkan QRIS/GoPay,
   dan lakukan satu pembayaran kecil.
4. **Ads backend** (menunggu key): D1 `meta_*`, `functions/api/ads/*`, token vault
   AES-GCM, Cloudflare Access, scheduler. Lihat IMPLEMENTATION-STATUS §7.

## Keputusan yang menunggu (jangan dieksekusi tanpa tanya)

| Hal | Kondisi sekarang |
|---|---|
| `PAYMENT_PAUSED` | **aktif** (`false`); kill switch server via env `PAYMENT_PAUSED=true` |
| Gate tier Essential (30 halaman) | `ESSENTIAL_GATE_ENABLED = false` di `src/lib/bookPages.ts` |
| Voice QR | terblokir R2 (error 10042) |
| Integrasi Meta/AI/OpenCode di `/ads` | butuh System User token + backend; sekarang demo |

## Prompt pembuka sesi baru

> Lanjut dari branch `main`. Baca `docs/handoff.md`, `docs/architecture.md`, dan
> `docs/deploy.md`. Kerjakan langkah berikutnya yang belum selesai; jangan ubah
> keputusan di tabel handoff atau mengaktifkan payment/tier tanpa bertanya.
