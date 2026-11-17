# Brief Produksi Konten — Bunda Journal

**Campaign:** `BJ-CONV-NOV` · **1 adset** `BROAD-ALL` · **6 aset** · **Rp100.000/hari**
**Produksi:** hari ini & besok pagi · **Budget produksi:** Rp0–Rp200.000 (opsional dummy buku)
**Aturan utama:** tanpa voice over. Caption + musik + SFX. Footage istri, bukan stok.

---

## 1. Deliverable

| # | ID | Format | Angle | Durasi | File |
|---|---|---|---|---|---|
| 1 | HS1 | Video 9:16 — demo app | Hardsell | 16s | `HS1.mp4` |
| 2 | HS2 | Carousel 4:5 — 5 kartu | Hardsell | — | `HS2-01.png` … `HS2-05.png` |
| 3 | PAIN1 | Video 9:16 — memori pudar | Pain | 16s | `PAIN1.mp4` |
| 4 | PAIN2 | Video 9:16 — panik di klinik | Pain | 17s | `PAIN2.mp4` |
| 5 | GAIN1 | Video 9:16 — warisan | Gain | 18s | `GAIN1.mp4` |
| 6 | GAIN2 | Video 9:16 — tenang & offline | Gain | 17s | `GAIN2.mp4` |

5 video dirender lewat `npm run ads:render`. Carousel dibuat terpisah (bagian 5.2).

---

## 2. Aturan produksi (berlaku untuk semua)

| Item | Ketentuan |
|---|---|
| Resolusi | 1080×1920, 30fps, H.264, AAC 48kHz |
| Durasi | 15–18 detik. Hook wajib selesai sebelum detik 3,4 |
| Teks | Maks 7 kata per baris. Tidak menutup area bawah 20% |
| Suara | Musik 15–20% + natural sound + SFX. Tanpa VO |
| Musik | 100–120 BPM, tanpa vokal (vokal bentrok dengan caption) |
| Warna | Linen Sage `#FAFAF9`, teks putih, aksen terracotta `#C0663F` |
| Klaim | Dilarang klaim medis ("menyelamatkan kehamilan", "cegah keguguran") |
| Produk | Jangan tampilkan buku hardcover yang belum ada |

---

## 3. Shot list istri (total ±40 menit)

Rekam 9:16, 30fps, cahaya jendela pagi/sore, **jangan menghadap jendela**. Tidak perlu bicara. Baju netral (putih, linen, krem). Rekam 8–10 detik per shot, 2 take.

| # | Shot | Arahan | Untuk |
|---|---|---|---|
| 1 | Tangan di perut | Duduk di kasur, cahaya samping, kamera setinggi perut | GAIN1, GAIN2 |
| 2 | Menulis jurnal | Buku tulis biasa + pulpen, tangan saja | PAIN1, HS1 |
| 3 | Scroll galeri HP | Over-shoulder, galeri berisi foto USG | PAIN1, HS2 |
| 4 | Pegang hasil USG | Close-up kertas USG, jari menelusuri | PAIN1 |
| 5 | Ruang tunggu klinik | POV duduk, kaki, suasana | PAIN2 |
| 6 | Lihat HP sambil senyum | Duduk santai, natural, jangan akting | GAIN2 |
| 7 | Buka lembar PDF cetak | Tangan membuka 3–4 lembar hasil export | GAIN1 |
| 8 | Scan QR di layar | HP mengarah ke QR di layar app | GAIN1 |

**Yang bikin hasil bagus:** jangan di-take 20 kali sampai kaku. Ambil natural, sisanya urusan cut dan musik. Kalau istri tidak mau wajahnya tampil, shot 1, 2, 3, 7 cukup — itu 80% dari kebutuhan.

---

## 4. Screen recording (dari HP, ±10 menit)

Rekam dengan recorder bawaan HP. Matikan notifikasi, mode jangan disturb, brightness 80%.

| # | Layar | Yang dilakukan | Untuk |
|---|---|---|---|
| 1 | Beranda | Diam 2 detik, scroll pelan | HS1, GAIN2 |
| 2 | Jurnal | Tulis 1 entri, tunjukkan badge "Tersimpan" | HS1, PAIN1 |
| 3 | Statistik | Isi berat & tensi, tunjukkan kartu | PAIN2 |
| 4 | Grafik | Buka grafik berat, diam 2 detik | HS1 |
| 5 | Studio | Preview buku, tekan Export PDF | HS1, GAIN1 |
| 6 | Mode pesawat | Nyalakan mode pesawat, buka app, tulis entri | GAIN2 |
| 7 | QR voice | Buka QR voice note di layar | GAIN1 |

Simpan sebagai `app-beranda-01.mp4`, `app-jurnal-01.mp4`, `app-jurnal-02.mp4`, `app-statistik-01.mp4`, `app-studio-01.mp4`, `app-offline-01.mp4`, `qr-voice-01.mp4`.

---

## 5. Brief per aset

### 5.1 HS1 — Demo app (16s)
**Job:** membuktikan produknya nyata dan mudah, sambil menancapkan harga.

| Detik | Visual | Teks di layar | Audio |
|---|---|---|---|
| 0–3,4 | Beranda app (blur bg) | "Buku jurnal bayi di toko Rp150 ribu." | musik masuk + tap |
| 3,4–7 | Jurnal, menulis entri | "Yang ini Rp129 ribu, sekali bayar." | tap |
| 7–12,4 | Studio + export PDF | "100 halaman + 10 voice detak jantung. Akses seumur hidup." | musik naik |
| 12,6–16 | CTA | "Miliki VIP — Rp129rb" | whoosh + fade out |

### 5.2 HS2 — Carousel 5 kartu (1080×1350)
Kartu 1 harus bisa berdiri sendiri di feed. Tanpa logo di kartu 1.

| Kartu | Judul | Isi | Visual |
|---|---|---|---|
| 1 | Rp129.000 | vs photobook custom Rp800.000 | angka besar, latar linen, tanpa logo |
| 2 | Sekali bayar | Bukan langganan. Akses seumur hidup. | ikon centang |
| 3 | 100 halaman | Grafik berat, tendangan, catatan dokter | screenshot app |
| 4 | 10 voice detak jantung | Discan lewat QR, bisa didengar anak nanti | screenshot QR |
| 5 | Miliki VIP — Rp129rb | bundajournal.my.id | logo + tombol terracotta |

Aturan: teks maks 7 kata, font sama dengan video (Georgia Bold + Segoe UI), jangan pakai foto stok.

### 5.3 PAIN1 — Memori pudar (16s)
**Job:** membuat istri merasa kehilangan sesuatu yang belum tentu hilang.

| Detik | Visual | Teks | Audio |
|---|---|---|---|
| 0–4,2 | Galeri HP penuh foto | "Coba ingat — minggu berapa kamu dengar detak jantung bayi?" | detak jantung di 0,4 |
| 4,4–7,4 | Foto USG berantakan | "Foto USG numpuk di galeri." | beat drop |
| 7,6–10,6 | Ganti HP / layar kosong | "Ganti HP — kenangannya hilang." | musik turun |
| 10,8–12,4 | Jurnal rapi | "Di sini rapi, dan bisa jadi buku." | gesek kertas |
| 12,6–16 | CTA | "Mulai catat hari ini" | fade out |

### 5.4 PAIN2 — Panik di klinik (17s)
**Job:** momen memalukan yang semua bumil pernah alami.

| Detik | Visual | Teks | Audio |
|---|---|---|---|
| 0–3,6 | POV ruang tunggu | "Ditanya bidan: “berat terakhir berapa?”" | musik tegang |
| 3,8–7,6 | Notes & chat WA berantakan | "Catatan tercecer di Notes, WA, buku kecil." | notif WA |
| 7,8–11 | Kartu statistik app | "Tensi, lingkar, catatan dokter — satu layar." | musik naik |
| 11,2–13,2 | Jadwal USG | "Jadwal USG + tombol WA suami." | tap |
| 13,6–17 | CTA | "Rapikan data kehamilanmu" | fade out |

### 5.5 GAIN1 — Warisan (18s)
**Job:** mengubah produk jadi warisan emosional. Ini aset paling penting jangka panjang.

| Detik | Visual | Teks | Audio |
|---|---|---|---|
| 0–4,4 | Tangan di perut, cahaya pagi | "20 tahun lagi, anakmu masih bisa dengar detak jantungnya." | musik hangat |
| 4,6–8,2 | QR voice di app | "Bukan file yang hilang di galeri." | detak jantung |
| 8,4–10,4 | Tangan di perut, close | "Ini warisan." | hening 0,5 detik |
| 10,6–13,4 | Lembar PDF cetak dibuka | "Voice QR + halaman siap cetak." | gesek kertas |
| 14,6–18 | CTA | "Buat warisan kecilmu" | fade out |

**Catatan buku:** kalau dummy hardcover jadi, ganti shot PDF dengan buku. Kalau belum, jangan tampilkan buku palsu.

### 5.6 GAIN2 — Tenang & offline (17s)
**Job:** meredakan kecemasan, bukan menambah fitur.

| Detik | Visual | Teks | Audio |
|---|---|---|---|
| 0–3,6 | Mode pesawat dinyalakan | "Yang bikin bumil tenang bukan USG 4D." | musik hangat |
| 3,8–6,8 | App tetap jalan offline | "Tapi feeling “semua udah tercatat”." | tap |
| 7–9,8 | Tangan di perut | "Jalan tanpa sinyal, di ruang tunggu." | ambient |
| 10–12,8 | Beranda app | "Data tersimpan di HP sendiri." | musik naik |
| 13,6–17 | CTA | "Lihat VIP-nya" | fade out |

---

## 6. Copy iklan Meta

| ID | Primary text (potongan kunci) | Headline | Deskripsi | CTA |
|---|---|---|---|---|
| HS1 | Buku jurnal bayi di toko Rp150 ribu. Bunda Journal Rp129 ribu — sekali bayar, akses seumur hidup. 100 halaman, grafik berat & tendangan, 10 voice note detak jantung. | Sekali bayar, jadi warisan | 100 halaman + voice detak jantung | Pelajari lebih lanjut |
| HS2 | Photobook custom bisa Rp800 ribu. Ini Rp129 ribu — dan bisa dicetak jadi buku. | Sekali bayar. Bukan langganan. | Mulai Rp129rb | Belanja sekarang |
| PAIN1 | Foto USG numpuk di galeri. Caption hilang. Ganti HP — kenangannya ikut hilang. Di Bunda Journal, semua tersimpan rapi, dan bisa jadi buku. | Jangan biarkan kenangannya hilang | Data di HP Bunda sendiri | Pelajari lebih lanjut |
| PAIN2 | Ditanya bidan “berat terakhir berapa?” dan Bunda cuma bisa jawab “hmm…”. Tensi, lingkar, catatan dokter, jadwal USG — satu layar. | Data kehamilan, satu layar | Tetap jalan tanpa sinyal | Pelajari lebih lanjut |
| GAIN1 | 20 tahun lagi, anak Bunda masih bisa dengar detak jantungnya sendiri. Voice note detak jantung + 100 halaman jurnal yang bisa dicetak jadi buku. | Bukan file. Warisan. | 10 voice QR detak jantung | Pelajari lebih lanjut |
| GAIN2 | Yang bikin bumil tenang bukan USG 4D — tapi feeling “semua udah tercatat”. Offline-first: tetap jalan di ruang tunggu tanpa sinyal. | Tenang, semua tercatat | Data tersimpan di HP sendiri | Pelajari lebih lanjut |

Aturan copy: 125 karakter pertama harus sudah memuat hook — sisanya terpotong "Lihat selengkapnya".

---

## 7. Aset pendukung

| Aset | File | Status |
|---|---|---|
| Musik netral | `audio/bgm.mp3` | cari di Pixabay Music |
| Musik sendu | `audio/bgm-sad.mp3` | Pixabay |
| Musik tegang | `audio/bgm-tense.mp3` | Pixabay |
| Musik hangat | `audio/bgm-warm.mp3` | Pixabay |
| Detak jantung | `audio/detak-jantung.mp3` | Pixabay SFX |
| Gesek kertas | `audio/page-turn.mp3` | Pixabay SFX |
| Tap layar | `audio/tap.mp3` | Pixabay SFX |
| Whoosh | `audio/whoosh.mp3` | Pixabay SFX |
| Notif WA | `audio/notif-wa.mp3` | rekam sendiri dari HP |
| Dummy buku | opsional | cetak PDF B5 di percetakan lokal |

Kalau file belum ada, renderer memberi peringatan dan lanjut tanpa aset itu.

---

## 8. Jadwal

| Waktu | Aksi | Output |
|---|---|---|
| Hari ini, 1 jam | Shot list istri + screen recording | 15 file di `raw/` |
| Hari ini, 30 menit | Download musik & SFX | 9 file di `audio/` |
| Hari ini, 30 menit | Isi `config/ads.json` (sesuaikan durasi) | config final |
| Besok pagi | `npm run ads:render` | 5 MP4 |
| Besok pagi | Bikin carousel 5 kartu | 5 PNG |
| Besok siang | QA + upload | campaign live |

---

## 9. Naming & struktur upload

```
Campaign : BJ-CONV-NOV
Adset    : BROAD-ALL
Ads      : BJ-HS1-Demo
           BJ-HS2-Carousel
           BJ-PAIN1-Memori
           BJ-PAIN2-Klinik
           BJ-GAIN1-Warisan
           BJ-GAIN2-Tenang
```

---

## 10. QA sebelum upload

- [ ] Resolusi 1080×1920 (video) / 1080×1350 (carousel)
- [ ] Hook selesai sebelum detik 3,4
- [ ] Tidak ada teks yang menutupi tombol UI Meta di bawah
- [ ] Audio tidak pecah, musik tidak menutupi suara asli
- [ ] Frame pertama tidak hitam
- [ ] CTA terlihat di 3 detik terakhir
- [ ] Tidak ada klaim medis
- [ ] Tidak ada buku hardcover yang belum ada
- [ ] Tidak ada testimoni karangan
- [ ] Harga di iklan = harga di landing page (Rp129.000)

---

## 11. Yang dilarang

1. Testimoni atau angka pengguna yang dikarang.
2. Menampilkan buku hardcover yang belum diproduksi.
3. Klaim medis atau janji hasil kehamilan.
4. Kata "sembuh", "menyelamatkan", "dijamin".
5. Foto stok ibu hamil yang diklaim sebagai pengguna.
6. Voice over TTS untuk kalimat personal ("aku ngalamin sendiri").
