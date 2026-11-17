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
| `/print` (100 halaman, audit per 4 halaman) | belum terukur | **703 kontras**, 0 masalah struktur |

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

1. **Palet tema buku sudah digelapkan (17 Nov 2026)** untuk mengurangi kontras
   rendah di `/print`: aksen terakota dan `mutedText` dibuat lebih gelap,
   `text-stone-400` di komponen buku diganti `text-stone-600`. Baseline visual
   buku tetap lulus. Audit axe penuh 100 halaman sebaiknya diulang per 4 halaman.
2. **`/print` sebelum perubahan** memiliki 703 node kontras rendah dari palet tema
   (aksen `#C87A64` di kertas cream = 3.1:1; label mikro 8 px = 2.45:1). Tidak ada
   masalah struktur: semua tombol/input di 100 halaman sudah punya nama.
2. **Focus trap & Escape sudah ditambahkan** lewat `src/hooks/useModalA11y.ts`:
   fokus awal masuk ke modal, Tab/Shift+Tab berputar, Escape menutup (kecuali
   onboarding yang wajib), dan fokus kembali ke tombol pemicu. Berlaku untuk
   login, onboarding, upgrade, checkout, pratinjau buku, PIC, dan tutorial PWA.
3. **Urutan Tab pratinjau buku** memakai roving tabindex di tabel ceklis:
   1.764 tombol ceklis kini hanya 36 titik Tab (satu per minggu); panah
   kiri/kanan/atas/bawah serta Home/End memindahkan fokus. Tombol lain di
   halaman buku tetap mengikuti urutan normal.
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
