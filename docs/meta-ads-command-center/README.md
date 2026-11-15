# Ruang Iklan — Meta Ads Command Center untuk Bunda Journal

**Status:** Draft untuk review · **Tanggal:** 16 Nov 2026 · **Versi:** 0.1  
**PIC:** Ashr · **Diskusi model:** Muse Spark 1.3 Contributor (product, architecture, metrics)

> Belum ada kode produksi yang diubah. Paket ini adalah rencana kerja untuk direview
> besok. Eksekusi dimulai setelah keputusan di bagian **“Yang saya butuhkan”** dijawab.

---

## 1. Satu paragraf

Ruang Iklan bukan pengganti Ads Manager. Ini **ruang keputusan** untuk satu orang yang
menjual jurnal kehamilan Rp129.000 sambil mengurus produk, iklan, dan kiriman sekaligus.
Ads Manager tahu iklan mana yang menang; spreadsheet tahu kemarin untung berapa. Ruang
Iklan menjawab satu pertanyaan yang tidak dijawab keduanya: **“besok saya harus ngapain?”**
Semua angka platform Meta dicocokkan dengan uang yang benar-benar masuk (Midtrans/bank),
lalu diterjemahkan menjadi keputusan **Naikkan / Tahan / Hentikan** dengan batas CPA,
break-even ROAS, dan dampak laba dalam rupiah. AI boleh membaca, menghitung, dan
mengusulkan; manusia yang menekan tombol eksekusi.

---

## 2. Dokumen dalam paket ini

| Dokumen | Isi | Untuk siapa |
|---|---|---|
| [PRD.md](./PRD.md) | Problem, tujuan, IA, fitur, acceptance criteria, aturan desain | Review produk & prioritas |
| [TRD.md](./TRD.md) | Arsitektur, data model, sync Meta, API, keamanan, performa, testing | Review teknis & risiko |
| [AFD.md](./AFD.md) | Alur onboarding, harian, kalkulator, AI, approval, wireframe, state | Review UX & flow |
| [IPD.md](./IPD.md) | Setup Meta, token, CAPI, Midtrans, AI, OpenCode, cron, deploy, runbook | Eksekusi integrasi |
| [CALCULATOR-SPEC.md](./CALCULATOR-SPEC.md) | 14 kalkulator, formula, default, guardrail, contoh hitung | Review logika & angka |
| [META-PARAMETERS.md](./META-PARAMETERS.md) | Katalog 180+ parameter Meta per objek, mana yang disinkronkan | Review kelengkapan data |
| [MUSE-SPARK-DISCUSSION.md](./MUSE-SPARK-DISCUSSION.md) | Ringkasan diskusi 3 sesi Muse Spark, titik setuju/tidak setuju | Konteks keputusan |

---

## 3. Keputusan inti (mohon dicek)

| # | Keputusan | Alasan | Bisa dibalik? |
|---|---|---|---|
| D1 | Dashboard dibangun sebagai route **`/ads`** di app yang sudah ada, bukan aplikasi/repo kedua | Satu deploy, satu auth, satu D1, satu design system. Kode di-*lazy-load* supaya user Bunda Journal tidak membayar bundle-nya | Ya, bisa diekstrak jadi Pages project sendiri |
| D2 | **Read-only dulu.** Aksi tulis (pause/scale) tetap dibangun, tapi lewat **antrean approval** dan default nonaktif sampai 2 minggu data bersih | Salah klik scale = uang hilang. Approval + audit lebih penting daripada kecepatan | Ya, tinggal aktifkan flag |
| D3 | **Uang bank/Midtrans = kebenaran.** Metrik Meta ditampilkan berdampingan, bukan dianggap benar | Atribusi 7d-click/1d-view + modeled conversion membuat platform overclaim. Keputusan pakai CPA bank | Tidak; ini prinsip produk |
| D4 | **Analis cloud** selalu tersedia (bisa dibuka dari HP). **Studio OpenCode** lokal untuk kerja kode/otomasi, dengan fallback “copy context” kalau server tidak jalan | OpenCode butuh proses Node di laptop; dashboard tidak boleh mati karena laptop sleep | Ya, Studio bisa ditunda |
| D5 | Navigasi maksimal **5 tab**: Hari Ini, Iklan, Uang, Rencana, Pengaturan. AI adalah panel, bukan tab | Dashboard solo operator bukan Bloomberg terminal. Satu layar, satu keputusan | Ya |
| D6 | **Tidak** menampilkan semua parameter sekaligus. Ada katalog parameter + kolom yang bisa dipilih + raw JSON | “Semua parameter” ≠ “semua metrik di satu layar”. Itu metric wall | Ya |
| D7 | Token Meta disimpan **terenkripsi di server** (AES-256-GCM, KEK di Worker secret), tidak pernah dikirim ke browser | Token System User = akses penuh ke ad account. Ini aset paling sensitif | Tidak |
| D8 | Sync memakai **scheduler Worker terpisah** karena Cloudflare Pages Functions tidak punya Cron Trigger | Koreksi teknis dari diskusi arsitektur; detail di TRD §3 | Tidak |

---

## 4. Cara review (15 menit)

Centang yang setuju; tulis koreksi di komentar:

1. **Problem** di PRD §1–2 sudah sesuai dengan kenyataanmu? Ada job lain yang belum masuk?
2. **5 tab** dan default landing “Hari Ini” cocok? Ada tab yang harus digabung/dihapus?
3. **Hero metric** tiap tab sudah yang paling kamu butuhkan tiap pagi?
4. **Kalkulator**: 14 kalkulator di CALCULATOR-SPEC — mana yang tidak akan pernah kamu pakai? Mana yang kurang?
5. **Definisi uang**: COGS hardcover, fee, refund, pajak, ongkir — default-nya sudah masuk akal? (Ini paling penting; semua angka turun dari sini.)
6. **AI**: 10 pertanyaan contoh di PRD §8 sudah mewakili pertanyaanmu? Ada yang terlalu berbahaya untuk diotomatiskan?
7. **OpenCode**: cukup panel “Studio” + tombol “Buka di OpenCode”, atau kamu mau lebih dalam (edit kode dari dashboard)?
8. **Keamanan**: Cloudflare Access (OTP email) + System User token read-only bisa diterima?

---

## 5. Yang saya butuhkan dari Ashr (6 keputusan)

| # | Pertanyaan | Default yang saya usulkan | Kenapa penting |
|---|---|---|---|
| Q1 | COGS hardcover riil: cetak + packing + ongkir rata-rata? | **Rp120.000 cetak + Rp20.000 ongkir Jawa = Rp140.000**, badge “asumsi” | Menentukan break-even ROAS hardcover (2,43x) vs VIP (1,03x) |
| Q2 | VIP yang sudah beli digital, upgrade hardcover bayar berapa? | **Jangan jual +Rp120.000 dulu.** Dengan COGS Rp140.000, upgrade itu rugi Rp23.000/order. Validasi COGS atau jual di Rp249.000 | Ini temuan dari model kalkulator; bisa mengubah strategi upsell |
| Q3 | Punya akses **Business Manager + System User**? Atau baru punya Page? | **BM + System User token** (read-only dulu). Kalau hanya Page, kita bangun mode Page-only dan pandu setup 3 menit | Page token **tidak bisa** membaca Ads Insights |
| Q4 | Aksi tulis (pause/scale) di MVP atau setelah 2 minggu? | **Bangun flow-nya, default OFF.** Aktif setelah data bank cocok ≥95% | Menghindari salah eksekusi saat data masih kotor |
| Q5 | Sumber order: CSV Midtrans/bank, atau kasih API key Midtrans? | **CSV/manual dulu**, API per-order menyusul. Server key tidak pernah masuk browser | Reconciliation butuh order-level, bukan hanya total |
| Q6 | Prioritas AI: cloud atau OpenCode lokal? | **Cloud dulu** (bisa dari HP), OpenCode Studio setelahnya | OpenCode tidak bisa jalan di Cloudflare Pages |

Pertanyaan lengkap ada di PRD §14 dan CALCULATOR-SPEC §9.

---

## 6. Yang **tidak** akan dibangun (anti-slop)

- Dark mode gaya crypto, gradient ungu/biru, glassmorphism, 3D, confetti.
- Grid 8–12 kartu KPI di landing. Maksimal 1 keputusan + 4 angka konteks per layar.
- AI chat bebas tanpa grounding. Setiap angka AI harus punya sumber dan `as-of`.
- Auto-scale tanpa approval. AI tidak pernah memegang token Meta.
- Multi-tenant, role tim, leaderboard, gamifikasi, benchmark kompetitor di MVP.
- Integrasi TikTok/Shopee/Google Ads di MVP.
- Laporan PDF 20 halaman. Cukup CSV + ringkasan 1 halaman.
- Data dummy permanen di production. Demo mode terpisah dan jelas berlabel.
- Menyimpan token di `localStorage`, `VITE_*`, atau URL.
- Menampilkan ROAS polos tanpa “breakeven 1,30x” dan sumbernya.

---

## 7. Definisi “review selesai”

Review dianggap selesai kalau:

- [ ] Q1–Q6 dijawab (atau dipilih default).
- [ ] Tab & hero metric disetujui.
- [ ] Daftar kalkulator final (tidak ada yang dipotong tanpa alasan).
- [ ] Definisi COGS/fee/refund/pajak disetujui.
- [ ] Prioritas MVP vs V1.1 disetujui.
- [ ] Tidak ada keberatan pada 3 risiko utama (PRD §12).

Setelah itu saya mulai Phase 0–1 (lihat TRD §17) dan berhenti di titik “data masuk &
terlihat” untuk kamu cek sebelum lanjut ke kalkulator dan AI.

---

## 8. Glosarium singkat

| Istilah | Arti di app ini |
|---|---|
| **Bank** | Uang yang benar-benar diterima: Midtrans settlement, transfer, atau input manual |
| **Meta** | Angka yang dilaporkan Meta lewat Insights API (platform-reported) |
| **CPA bank** | Belanja iklan ÷ order yang benar-benar dibayar |
| **Max CPA** | Batas CPA yang masih menyisakan buffer laba (bukan break-even) |
| **BE ROAS** | ROAS minimum agar tidak rugi, dihitung dari margin per produk |
| **MER** | Total revenue bank ÷ total spend iklan (blended, semua channel) |
| **As-of** | Waktu terakhir data ditarik; setiap angka wajib punya label ini |
| **Approval queue** | Daftar aksi yang diusulkan AI/manusia, belum dieksekusi sampai disetujui |
| **Studio** | Panel OpenCode lokal untuk membaca/mengubah kode dan menjalankan skill |
| **Analis** | Panel AI cloud yang membaca data D1 lewat tool, bukan mengarang angka |
