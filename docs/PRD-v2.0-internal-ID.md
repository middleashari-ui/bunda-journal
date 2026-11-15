# PRD — Bunda Journal (Internal)
**Versi:** 2.0 | **Tanggal:** 4 Nov 2026 | **PIC:** Ashr | **Status:** Live production

## 1. Ringkasan Produk
PWA jurnal kehamilan offline-first untuk ibu middle-low Indonesia (20–34 th). Positioning: "Sekali Bayar, Jadi Warisan 20 Tahun".
Live: `https://www.bundajournal.my.id` (Cloudflare Pages `bunda-journal`, HTTPS). Repo: `D:/appsss` (React + Vite + Tailwind, branch main).

## 2. Target User
- **Primer:** Ibu hamil minggu 2–40, Bekasi/Jabodetabek, komunitas FB ibu hamil, minat bidan/USG/popok bayi.
- **Sekunder:** Ayah Siaga (mode baca, via share WhatsApp).

## 3. Paket & Harga (Rapat v5, kode: `src/config/pricing.ts`)
| Paket | Harga | Isi |
|---|---|---|
| Essential (fallback internal, tidak tampil di hero) | Rp 49.000 | 30 halaman + 1 voice note |
| **VIP Digital Lengkap (HERO)** | **Rp 129.000** | 100 halaman, 10 voice QR detak jantung, grafik berat/tendangan, 3 template cetak, akses seumur hidup, gratis admin QRIS 0% |
| **Hardcover Cetak Fisik** | **Rp 249.000** | Buku fisik lux B5 laminasi doff dikirim ke rumah + akses VIP Digital seumur hidup |
| Upgrade Essential → VIP | +Rp 80.000 | Selisih harga, tombol terracotta di Studio |

CTA hero & navbar: "Miliki VIP — Rp 129rb" → transaksi Rp 129.000.

## 4. Alur Pengguna (LOCKED)
1. Landing `www.bundajournal.my.id` → lihat hero, pricing 2 kartu, preview buku, footer legal.
2. Klik CTA → `CheckoutModal` → Snap Midtrans (QRIS / GoPay / Bank VA / BSI VA / ShopeePay / OVO / DANA).
3. Bayar sukses → `/success` → flag `bunda_is_paid=true` → onboarding.
4. Onboarding 1 tahap: **Nama Bunda** (wajib) + **HPL** (wajib, date picker). Usia kehamilan dihitung otomatis (`40 − selisih_minggu_ke_HPL`).
5. Tab app (bottom nav, 4 tab tetap): **Beranda – Jurnal – Studio – Profil**.
6. Studio: user PAID langsung lihat Export PDF / Pesan Hardcover (tanpa info bayar lagi). User belum PAID lihat pricing card.
7. Belum onboarding → redirect ke onboarding, tidak bisa masuk Beranda.

## 5. Fitur Inti
- **Bab 2 Jurnal Harian:** navigasi minggu (tombol bulat 44px), strip 7 hari dinamis, 1 textarea aktif/hari (60 FPS, RAM 3 GB), counter 0/100 (kini 500), autosave debounce 500 ms + badge "Tersimpan HH:MM", auto-return ke hari ini setelah idle 5 menit.
- **Statistik Fisik & Dokter:** berat / lingkar / tensi, catatan obgyn 0/500, slot foto USG + polaroid grid di dalam 1 card, tombol simpan ber-timestamp, arsip riwayat, jadwal USG + tombol WA suami.
- **Grafik:** berat (`MoodTrendChart`) & tumbuh janin (`FetalGrowthChart`), lazy-load + Suspense.
- **Studio Cetak:** preview spread A5/B5 + polaroid + voice QR, download PDF langsung (tanpa `window.print()`), order hardcover 249rb.
- **Sync:** IndexedDB `bunda_journal_db` + antrean outbox `sync_queue`, auto-sync saat online. Banner offline debounce 3 detik.
- **PWA:** `sw.js` precache app shell, `offline.html` tema SAGE + tombol Buka Aplikasi / Coba Lagi, ikon `icon-192/512.png`.

## 6. Aturan UI/UX (mengikat)
- Palet Linen Sage (`bg-[#FAFAF9]`, border `#E5E5E5`, teks `#111`), serif `Instrument Serif/Lora` + `Inter`.
- Tombol aksi compact icon-only, warna statis saat toggle, toast tengah-bawah ±3 detik.
- `pb-28` di kontainer scrollable tiap tab (anti-tutup bottom nav).
- Setiap tab dibungkus `ErrorBoundary` individual; tanpa manipulasi `document.body` destruktif.
- Dilarang: modal `window.print()`, `window.confirm()` di aksi reset, dummy fallback hardcoded (tanggal/nama/foto contoh).

## 7. Pembayaran (Midtrans)
- Snap JS key: `Mid-client-WZqEVvzTcc9Zlq_A` (sandbox, ganti production saat go-live).
- Kanal: QRIS, GoPay, Bank Transfer VA, BSI VA, ShopeePay, OVO, DANA.
- Footer legal wajib live untuk verifikasi Midtrans: Tentang Kami, Kontak, S&K, Privacy, Refund + email `support@bundajournal.my.id`.

## 8. Non-Fungsional
- RAM 3 GB friendly, storage ≤50 MB, 53 tab Chrome tetap smooth.
- Export PDF 100 hal B5 (176×250 mm) chunk 10 halaman anti-crash.
- Foto HEIC iPhone → WebP 500 px otomatis.

## 9. PIC Dashboard
`PicModal.tsx`: user management, payment log, content control, stability log, pricing control tanpa deploy, feature flag.

## 10. Risiko & Mitigasi
- Apex domain tanpa `www` belum resolve (IDwebhost tolak CNAME root) → mitigasi: URL Forwarding ke `www` / pindah nameserver ke Cloudflare.
- Kunci API Gemini 429 → rotasi key / fallback model Ollama aktif.
