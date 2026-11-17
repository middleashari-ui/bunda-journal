# Ads Assets — pipeline iklan Bunda Journal

Semua proses di sini **gratis dan lokal**: ffmpeg (sudah terpasang), font Windows, logo di `public/`, dan footage istri. Tidak perlu CapCut Pro, tidak perlu subscription AI video.

Hasil akhir: 6 video 9:16 (1080×1920, 30fps, H.264 + AAC) dengan caption burn-in, hook, CTA, logo, dan musik — siap upload ke Meta.

---

## Struktur

```
ads-assets/
  raw/      ← footage mentah (di-gitignore, tidak ikut commit)
  audio/    ← musik bebas royalti (di-gitignore)
  fonts/    ← otomatis disalin dari C:\Windows\Fonts saat render pertama
  config/   ← ads.json: teks & urutan clip tiap iklan (ini yang diedit)
  out/      ← hasil render
  .cache/   ← scrim gradient, otomatis dibuat
scripts/ads/render.mjs
```

## 1. Taruh footage di `ads-assets/raw/`

Rekomendasi: rename file sesuai perannya, supaya config tidak perlu diubah banyak.

| Nama file | Isi yang dicari dari footage istri |
|---|---|
| `usg-01.mp4` | close-up foto USG / istri memegang hasil USG |
| `journal-01.mp4` | istri menulis jurnal / memegang buku |
| `app-studio-01.mp4` | screen record tab Studio / export PDF |
| `app-jurnal-01.mp4` | screen record tab Jurnal |
| `app-statistik-01.mp4` | screen record kartu berat/tensi/catatan dokter |
| `app-offline-01.mp4` | screen record saat mode pesawat |
| `app-beranda-01.mp4` | screen record Beranda |
| `galeri-usg-01.mp4` | jari scroll galeri HP yang penuh foto |
| `hp-galeri-01.mp4` | HP penuh screenshot/foto berantakan |
| `buku-cetak-01.mp4` | buku hardcover di atas meja/linen |
| `buku-linen-01.mp4` | detail tekstur linen + buku |
| `voice-qr-01.mp4` | scan QR voice note |
| `perut-01.mp4` | tangan di perut, cahaya pagi |
| `perut-02.mp4` | versi kedua (angle lain) |
| `ruang-tunggu-01.mp4` | POV ruang tunggu klinik |
| `dokter-01.mp4` | catatan dokter / tensi / suasana periksa |

Format apa pun boleh: portrait, landscape, atau square — script akan crop ke tengah jadi 9:16. Kalau subjeknya di pinggir, lihat bagian "crop offset" di bawah.

## 2. Edit `config/ads.json`

Tiap iklan punya:

```json
{
  "id": "HS1",
  "angle": "hardsell",
  "clips": [
    { "file": "ads-assets/raw/usg-01.mp4", "start": 0, "duration": 3 },
    { "file": "ads-assets/raw/journal-01.mp4", "start": 2, "duration": 6 }
  ],
  "hook": { "text": "Buku jurnal bayi di toko Rp150 ribu.", "start": 0.3, "end": 3.4, "size": 58 },
  "lines": [
    { "text": "Yang ini Rp129 ribu,\nsekali bayar.", "start": 3.6, "end": 7.0, "size": 56 }
  ],
  "cta": "Miliki VIP — Rp129rb",
  "music": "ads-assets/audio/bgm.mp3",
  "musicVolume": 0.16,
  "sourceVolume": 0.55
}
```

- `start` / `duration` clip = potongan mana yang dipakai (detik).
- Waktu di `hook`/`lines` **relatif terhadap hasil akhir**, bukan file asli.
- `\n` = baris baru paksa; teks panjang otomatis di-wrap dan font-nya mengecil sendiri.
- `zoom: true` di clip = efek Ken Burns halus (opsional, render lebih lambat).
- `music` boleh dikosongkan / file tidak ada — audio asli footage tetap dipakai.

Menambah varian hook murah: duplikat blok iklan, ganti `id` dan `hook`, render ulang. Satu footage bisa jadi 2–3 iklan berbeda tanpa shooting.

## 3. Render

```bash
npm run ads:list                  # lihat 6 iklan + hook
npm run ads:render                # render semua → ads-assets/out/
node scripts/ads/render.mjs --only HS1   # render satu iklan saja
```

Sekali render 6 iklan ±2–4 menit di laptop biasa.

## 4. Musik (gratis, tanpa langganan)

Taruh di `ads-assets/audio/`:

| File | Mood | Dipakai di |
|---|---|---|
| `bgm.mp3` | netral, ringan | HS1, HS2 |
| `bgm-sad.mp3` | sendu, piano | PAIN1 |
| `bgm-tense.mp3` | tegang ringan | PAIN2 |
| `bgm-warm.mp3` | hangat, harapan | GAIN1, GAIN2 |

Sumber gratis: Pixabay Music, YouTube Audio Library, Uppbeat (free tier). Pastikan lisensi komersial. Kalau belum ada, render tetap jalan — tinggal pakai suara asli footage.

## 5. Tanpa voice over

Ini bukan kekurangan. Sebagian besar orang membuka feed dalam keadaan tanpa suara, jadi caption adalah voice over-nya.

Urutan prioritas kalau butuh suara:
1. **Musik + SFX + caption** (default di config ini).
2. **Suara suami** — 3–4 kalimat, rekam pakai HP. Paling dipercaya dan gratis.
3. **TTS gratis** (`edge-tts`, suara `id-ID-GadisNeural`) — opsional, bukan langganan.

### Kalau musik saja, ini yang bikin tidak membosankan

Musik saja aman **asalkan** empat hal ini ada. Tanpa ini, hasilnya terasa seperti slideshow:

1. **Ada perubahan di detik 1–2.** Jangan pakai loop datar dari awal. Pilih track yang punya intro lalu beat masuk; letakkan beat masuk tepat saat hook muncul.
2. **Ganti visual tiap 2–4 beat.** Di config ini artinya: durasi clip 2–4 detik, bukan 6–7 detik. Clip 6 detik tanpa potongan = mati.
3. **SFX menggantikan VO.** Ini kuncinya: detak jantung di hook, gesek kertas, tap layar, whoosh saat CTA. Telinga tetap dapat "kejadian" walau tidak ada yang bicara.
4. **Caption jadi narator.** Satu ide per 2–3 detik, maksimal 7 kata per baris, angka menonjol.

Rumus sync ke beat: **durasi clip = (60 / BPM) × 4**. Track 120 BPM → potong tiap 2 detik. Track 90 BPM → potong tiap 2,7 detik. Jadi untuk iklan 16 detik dengan 120 BPM, butuh 8 potongan — bukan 2 clip panjang.

SFX bisa ditambahkan per iklan:

```json
"sfx": [
  { "file": "ads-assets/audio/detak-jantung.mp3", "at": 0.4, "volume": 0.5 },
  { "file": "ads-assets/audio/whoosh.mp3", "at": 12.0, "volume": 0.6 }
]
```

Sumber SFX gratis: Pixabay SFX, Freesound (cek lisensi). Kalau file belum ada, script hanya memberi peringatan dan lanjut render.

Audio akhir otomatis dinormalisasi ke **-16 LUFS** (standar feed), musik 15–20% dari mix, dan fade out 1,2 detik di akhir. Jadi tidak akan pecah dan tidak akan tenggelam.

## 6. Yang sudah otomatis (motion graphic)

- Hook: kotak gelap semi-transparan, fade + slide halus, font serif Georgia Bold.
- Body: Segoe UI Bold, fade per baris.
- CTA: pill terracotta dengan warna brand `#C0663F`.
- Scrim gradasi bawah supaya teks tetap terbaca di footage terang.
- Logo watermark di atas (bisa dimatikan: `"logo": null`).
- Auto-fit teks: tidak akan keluar frame.
- Audio: normalisasi stereo 48kHz, musik otomatis fade in/out dan di-duck di bawah suara asli.

## 7. Crop offset (kalau subjek terpotong)

Default crop selalu ke tengah. Untuk menggeser, tambahkan di clip:

```json
{ "file": "...", "start": 0, "duration": 5, "cropX": "0.5", "cropY": "0.3" }
```

`cropY` 0.0 = atas, 0.5 = tengah, 1.0 = bawah.

### Mode tampilan untuk screen recording

Screen record HP biasanya 1080×2400, kalau di-crop tengah UI-nya terpotong. Pakai salah satu:

```json
"clips": [
  { "file": "ads-assets/raw/app-jurnal-01.mp4", "duration": 6, "fit": "blur" }
]
```

| `fit` | Efek | Cocok untuk |
|---|---|---|
| `cover` (default) | penuhi frame, sisi terpotong | footage kamera |
| `fit: "blur"` | UI utuh di tengah, latar versi blur | **screen recording** (rekomendasi) |
| `fit: "contain"` | UI utuh dengan bingkai linen `#FAFAF9` | screenshot/UI yang sempit |

## 8. Checklist sebelum upload Meta

- [ ] Durasi 15–20 detik (hook harus selesai < 3 detik).
- [ ] Teks penting ada di area aman: atas 14%, bawah 20% (sudah diatur).
- [ ] Nama file: `BJ-HS1-129rb.mp4`, `BJ-PAIN1-memori.mp4`, dst.
- [ ] Upload 6 ads ke 1 adset `BROAD-ALL`, budget Rp100.000/hari.
- [ ] Jangan pause sebelum 3 hari / 10 order per adset.
- [ ] Ganti hook kalau CTR < 1,5% setelah 1.000 impression.

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `ffmpeg tidak dikenali` | `winget install Gyan.FFmpeg` lalu buka terminal baru |
| `Footage tidak ditemukan` | cek nama file di `config/ads.json` vs isi `ads-assets/raw/` |
| Video jadi hitam | footage HDR/HEVC — convert dulu: `ffmpeg -i in.mov -pix_fmt yuv420p out.mp4` |
| Audio hilang | footage asli tanpa audio; script otomatis menambah silent track |
| Teks terlalu kecil | naikkan `size` di config; auto-fit akan menurunkan kalau kepanjangan |
| Font tidak ada | otomatis disalin dari `C:\Windows\Fonts`; pastikan Georgia & Segoe UI ada |
