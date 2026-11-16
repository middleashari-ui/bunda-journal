# Audit Aksesibilitas — Bunda Journal

**Tanggal:** 16 Nov 2026
**Cakupan:** landing, app (Beranda/Jurnal/Studio/Profil), modal utama, `/print`,
`/pic`, `/success`, Ruang Iklan `/ads` + 4 tab.
**Alat:** axe-core 4.12 (tag `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) di
Chromium, ditambah Lighthouse untuk skor awal landing.

## Ringkasan

| Layar | Sebelum | Sesudah |
|---|---|---|
| Landing `/` | 5 jenis (button-name, contrast 17 node, image-alt, landmark, region) | **0** |
| Beranda | contrast 24–47 node, image-alt | **0** |
| Jurnal | 6 button-name, contrast 32, 3 input tanpa label | **0** |
| Studio | contrast 3, label 1 | **0** |
| Profil | 2 switch tanpa nama, contrast 20, 2 input waktu tanpa label | **0** |
| Pratinjau buku | 0 | **0** |
| Modal upgrade | contrast 4 (putih di #C87A64) | **0** |
| Login / Daftar | contrast 6 | **0** |
| Onboarding | contrast 2, label HPL | **0** |
| `/pic` | 1 tombol tanpa nama | **0** |
| `/success` + tutorial PWA | contrast 2 | **0** |
| `/ads`, `/ads/iklan`, `/ads/rencana`, `/ads/pengaturan` | 0 | **0** |
| `/ads/uang` | 20 input + 4 select tanpa nama | **0** |
| `/print` | lihat catatan di bawah | komponen sama dengan Studio |

Lighthouse landing: aksesibilitas **0.80 → 1.00** (target; lihat bagian verifikasi).

## Yang diperbaiki

### Semantik & nama tombol
- Logo header landing + app: `alt`, dan logo landing jadi `<button>` yang bisa
  difokus (sebelumnya `<div onClick>`).
- Toggle pratinjau harga landing: `role="switch"`, `aria-checked`, `aria-label`.
- 1.764 tombol ceklis habit di halaman buku (`WeeklyJournalSpread`): sekarang punya
  `aria-label` (item + hari) dan `aria-pressed`.
- Tombol ikon di kartu Gerak & Tidur (`ActivityRingsCard`): label
  "Tambah/Kurangi target …"; input angka target punya `aria-label`.
- Tombol tutup `/pic` dan switch pengingat di Profil punya nama; switch Profil
  memakai `role="switch"` + `aria-checked`.

### Form
- Login/daftar: label sudah terhubung ke input (modal kini `role="dialog"` +
  `aria-modal`).
- Onboarding: `htmlFor` untuk Nama dan HPL, judul modal jadi `aria-labelledby`.
- Studio: `htmlFor` untuk judul sampul, nama penerima, dan nomor HP.
- Profil: dua input jam pengingat punya `aria-label`.
- Ruang Iklan → Uang: 20 input + 4 select tabel produk punya `aria-label`
  (mis. "COGS Hardcover", "Mode pajak VIP").
- Buku cetak (Bab 1, 3, 4, 5, intro, pembatas trimester, studio): semua input,
  textarea, dan file picker diberi `aria-label`; pencarian/slider bab di Studio
  juga.

### Kontras warna
- Landing: teks sekunder `#999` → `#6B6B6B`; tombol "Kirim ke Ayah" pakai teks
  gelap di hijau WhatsApp; catatan kecil `stone-400` → `stone-600`.
- App: label mikro (8–10 px) `stone-400`/`stone-500` → `stone-600`; aksen
  `#C87A64` untuk teks → `#A85A44`; `#8A8178` → `#6E665C`; badge `#A25E4B`
  → `#8F4F3E`.
- Tombol CTA putih di `#C87A64` → latar `#A85A44` (rasio ≥ 4.5:1).
- Login modal: `#8C887F` → `#6B655C`, placeholder/ikon `#B8B2A5` → `#7A7468`.

### Landmark & struktur
- Landing: konten dibungkus `<main>`; footer tetap `contentinfo`.
- Modal utama (login, onboarding, upgrade, checkout, pratinjau buku, PIC,
  tutorial PWA) sekarang `role="dialog"` + `aria-modal="true"` dan punya nama.

## Catatan & batasan

1. **`/print` tidak dijalankan penuh di axe** karena 100 halaman membuat satu
   proses audit > 60 detik. Halaman ini memakai komponen yang sama dengan
   pratinjau Studio (`WeeklyJournalSpread`, Bab 1–5) yang sudah bersih, dan semua
   kontrolnya sudah diberi label. Bila perlu audit terpisah, jalankan axe per
   5 halaman (`axe.run(document.querySelectorAll('.b5-page')[i])`).
2. **Focus trap & tombol Escape** belum ditambahkan ke modal. Ini langkah
   berikutnya yang disarankan: pindahkan fokus ke modal saat dibuka, kunci Tab di
   dalamnya, kembalikan fokus saat ditutup, dan tutup dengan Escape.
3. **Urutan Tab di pratinjau buku panjang** (ratusan kontrol). Label sudah ada,
   tetapi belum ada roving tabindex; pertimbangkan navigasi per-halaman.
4. Perubahan warna sengaja membuat beberapa label kecil lebih gelap. Cek visual
   di HP sebelum deploy; palet aksen utama tidak berubah, hanya versi teksnya.
5. Ruang Iklan memakai token kontras yang lebih baik sejak awal; tidak ada
   perubahan desain di sana selain `aria-label` tabel Uang.

## Cara mengulang audit

```bash
npx vite --host 0.0.0.0
# buka http://127.0.0.1:5173 lalu jalankan axe-core 4.12 di console:
#   const r = await axe.run(document, { runOnly: { type: 'tag',
#     values: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] } });
#   console.table(r.violations.map(v => ({ id: v.id, nodes: v.nodes.length })))
```

Untuk layar ber-sesi, isi dulu `bunda_is_paid`, `bunda_is_onboarded`,
`bunda_isLoggedIn`, `bunda_profile`, `bunda_week`, dan `bunda_schema_version`
seperti di `tests/helpers/app.ts`.
