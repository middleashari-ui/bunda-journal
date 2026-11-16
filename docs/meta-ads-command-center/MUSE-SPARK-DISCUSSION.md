# Diskusi Muse Spark — Ringkasan & Keputusan

**Tanggal:** 16 Nov 2026  
**Model:** Muse Spark 1.3 Contributor (`opencode-go/muse-spark-1.3-contributor`)  
**Metode:** tiga sesi paralel via OpenCode subagent — **Product/UX**, **Architecture**,
**Metrics/Calculator**. Setiap sesi diberi konteks produk, harga, stack, dan batasan
solo operator. Ringkasan di bawah adalah sintesis, bukan transkrip.

> Tujuan dokumen: menunjukkan mana yang saya setujui, mana yang saya koreksi, dan
> kenapa keputusan akhir di PRD/TRD berbeda dari memo mentah.

---

## 1. Ringkasan tiga memo

### 1.1 Product/UX

- **Tiga job**: (1) boleh scale hari ini? (2) kreatif mana yang capek? (3) budget
  untuk target X?
- **Empat seksi**: Hari Ini, Uang, Iklan, Rencana. Default landing “Hari Ini”, bukan
  overview penuh chart.
- **Hero metric** per seksi; maksimal 1 chart; tabel lebih penting daripada chart.
- **10 aksi AI** konkret (kenapa CPA naik, budget 100 sales, kill list, hook baru,
  ringkasan WA, anomali, dll).
- **Anti-slop**: satu layar satu keputusan, warna = makna, copy pendek, empty state
  instruksi, asumsi ber-badge, dilarang dark mode crypto/gamifikasi.
- **MVP**: read-only, sync harian, 3 layar, kalkulator breakeven + budget planner,
  AI ringkasan; write action ditunda.
- **Risiko**: data basi, over-trust AI, COGS hardcover fiktif.

### 1.2 Architecture

- Pilih **opsi A**: route `/ads` di app existing + Pages Functions + D1, bukan app
  kedua, bukan desktop lokal.
- **System User token**, bukan Page token; `ads_read` dulu, `ads_management` nanti.
- **D1** prefix `meta_*`; grain harian per object; breakdown tabel terpisah.
- **Envelope encryption** AES-256-GCM; KEK di Worker secret; token tidak ke browser.
- **OpenCode**: mode cloud default + mode lokal opsional; skill + tools read-only;
  write hanya proposal.
- **API** ~20 endpoint; cache; backoff; cron 30 menit; Cloudflare Access.
- **Fase**: Week 1 data, Week 2 AI + aksi aman, later kalkulator/Studio.

### 1.3 Metrics/Calculator

- **Kamus 35 metrik** dengan formula dan kapan menipu.
- **Unit economics** per produk + blended; BE ROAS/CPA; Max CPA; LTV/payback.
- **10 kalkulator**: breakeven, budget→hasil, target→budget, scale simulator,
  creative diagnostic, LTV/CAC, reconciliation, attribution, cashflow print,
  scenario compare.
- **Default Indonesia**: CPM 35–65rb, CTR 1–2%, CVR 3%, refund 2%, fee 0,7%.
- **Guardrail**: sample minimum, kill 2× BE CPA, scale +20–30%, frequency <2,5.
- **Contoh hitung** Rp150rb/hari ×14 hari: ROAS 1,01 → jangan scale.
- **Tiga kesalahan**: ROAS platform sebagai kebenaran, campur PPN/AOV, menilai
  terlalu cepat.

---

## 2. Yang saya setujui

| # | Ide Muse | Alasan |
|---|---|---|
| A1 | Dashboard = kokpit keputusan, bukan laporan | Cocok dengan solo operator; Ads Manager sudah punya laporan |
| A2 | Tiga job utama | Fokus; mencegah fitur acak |
| A3 | Uang bank = kebenaran, Meta = pembanding | Atribusi Meta overclaim; keputusan harus pakai kas |
| A4 | Satu layar satu keputusan, maks 1 chart | Anti metric wall |
| A5 | System User token, bukan Page token | Page token tidak bisa Ads Insights |
| A6 | Envelope encryption + tidak ada token di browser | Aset paling sensitif |
| A7 | Read-only dulu, write via approval | Salah scale = uang hilang |
| A8 | D1 + prefix `meta_*` | Volume kecil; tidak perlu DB baru |
| A9 | Cloudflare Access | Menghapus PIN client-side yang tidak aman |
| A10 | AI grounded + sitasi + tolak jika data kurang | Mencegah halusinasi |
| A11 | Kalkulator deterministik, bukan AI | Bisa diuji & diaudit |
| A12 | Asumsi ber-badge | COGS hardcover belum validasi |
| A13 | Anti-slop: tanpa gradient/glass/gamifikasi | Sesuai Linen Sage |
| A14 | Sample minimum sebelum verdict | Mencegah keputusan dari 1 order |
| A15 | OpenCode tools read-only + proposal | Batas aman |

---

## 3. Yang saya koreksi / putuskan berbeda

| # | Muse | Koreksi | Alasan |
|---|---|---|---|
| B1 | Graph API `v22.0` | **`v27.0`** | Versi yang berlaku saat dokumen (Nov 2026); pin & uji |
| B2 | “Pages Functions scheduled handler / cron” | **Worker scheduler terpisah** | Pages Functions tidak punya Cron Trigger |
| B3 | 4 seksi (Hari Ini, Uang, Iklan, Rencana) | **5 tab** (+ Pengaturan) | Koneksi, token, produk, guardrail, audit butuh rumah; jangan disembunyikan di modal |
| B4 | “Semua parameter” tidak dibahas detail | **Katalog 180+ field** + column picker + raw JSON | Memenuhi permintaan tanpa metric wall |
| B5 | OpenCode opsional, default cloud | **Dua panel**: Analis cloud + Studio OpenCode, dengan fallback copy context | Permintaan eksplisit “integrasi OpenCode”; tetap aman |
| B6 | MVP read-only; write V1.1 | **Setuju**, tapi fondasi `meta_actions` + audit dibangun di Phase 1 | Supaya tidak refactor besar saat mengaktifkan write |
| B7 | Pajak “net-simple” default | **Tiga mode** (`none/inclusive/exclusive`), default `none` + badge | Jangan sembunyikan asumsi PPN; owner bisa PKP |
| B8 | LTV tidak dimasukkan detail | **LTV/CAC 60–90 hari** + peringatan upsell hardcover | Produk one-time; LTV 12 bulan menyesatkan |
| B9 | Upgrade VIP→hardcover +Rp120k | **Tandai rugi** (C = −Rp23.240) | COGS 140k > incremental price 120k |
| B10 | AI chat bebas dengan guardrail teks | **Tool-only + envelope `query_id` + sitasi wajib** | Teks guardrail saja tidak cukup |
| B11 | Cron lokal / GitHub Actions | **Cloudflare Worker cron** | Laptop sleep = data bolong |
| B12 | “Calculator client-side” saja | **Fungsi murni dipakai client + server/AI** | Satu rumus, dua pemakai |

---

## 4. Keputusan akhir (yang masuk dokumen)

| Topik | Keputusan |
|---|---|
| Bentuk produk | Route `/ads` di app existing, lazy-loaded |
| API | Pages Functions + Hono, prefix `/api/ads` |
| Scheduler | Worker `bunda-ads-scheduler`, cron 30 menit |
| Database | D1 existing, tabel `meta_*` |
| Auth | Cloudflare Access (owner email) + service token |
| Token | System User, AES-256-GCM envelope, header Bearer |
| Graph | v27.0, read-only MVP |
| Navigasi | 5 tab + panel Analis + Studio |
| Hero | Laba bersih bank, CPA bank vs Max CPA |
| Kalkulator | 14 (lihat CALCULATOR-SPEC) |
| AI | Cloud analyst read-only, tool-grounded, citations, budget cap |
| OpenCode | Studio lokal + bridge + skill + MCP; fallback copy |
| Write | Approval queue, default OFF sampai data bank ≥95% |
| Desain | Linen Sage, 1 hero, 1 chart, no gradients, no dark mode |
| Sample | 5.000 impr / 300 click / 25 LPV / 10 order |
| Atribusi | 7d click + 1d view, label di semua chart |

---

## 5. Pertanyaan Muse yang saya jawab dengan default

| Pertanyaan Muse | Default di dokumen | Catatan |
|---|---|---|
| COGS hardcover riil? | Rp140.000 (120k cetak + 20k ongkir Jawa) | Badge asumsi; Q1 |
| Aturan kill/scale? | Kill 2× Max CPA 48 jam; scale +20% jika ROAS 7d ≥1,2× BE | Bisa diubah di Pengaturan |
| Target mingguan? | 70 order/minggu (60% VIP) | Forecast awal |
| Token siapa? | BM + System User read-only | Q3 |
| Sumber sales? | Landing + Midtrans CSV; WA manual | Q5 |
| Ganti PIC lama? | Ya, ganti total; PIC lama read-only 2 minggu | Menghindari dua kebenaran |
| Multi-account? | Skema siap, UI satu akun | MVP |
| Write actions? | Bangun flow, default OFF | Q4 |
| Retensi? | Daily 24 bulan; breakdown 30 hari | Biaya D1 |
| Atribusi? | 7d click + 1d view | Q8 |

---

## 6. Insight baru dari sintesis (bukan dari satu memo)

1. **Upgrade hardcover bisa rugi.** Harga hardcover Rp249.000 termasuk VIP. Kalau
   VIP upgrade hanya +Rp120.000 sementara COGS cetak + ongkir Rp140.000, kontribusi
   incremental = **−Rp23.240**. Ini harus ditampilkan merah di kalkulator dan
   ditanyakan sebelum strategi upsell dijalankan.
2. **BE ROAS VIP 1,03x bukan berarti aman.** Itu hanya impas per order digital.
   Setelah blended mix dan buffer, target CPA akun ~Rp84rb. Dashboard harus
   menampilkan **BE per produk + Max CPA blended**, bukan satu ROAS.
3. **Hardcover butuh ROAS 2,43x.** Jangan mencampur target CPA VIP dan hardcover;
   campaign hardcover bisa terlihat “rugi” padahal normal.
4. **Satu perbaikan CVR lebih berharga daripada naik budget.** Contoh: CVR 3% → 4%
   mengubah profit dari −Rp40rb menjadi +Rp646rb pada spend yang sama.
5. **Cron bukan detail kecil.** Pages Functions tidak punya cron; kalau tidak
   dirancang, data akan bolong saat laptop sleep. Worker scheduler adalah keputusan
   arsitektur, bukan tambahan.
6. **Token Page adalah jebakan UX.** Banyak owner mengira Page token = akses iklan.
   Dashboard harus mendeteksi dan memandu, bukan menampilkan 0.

---

## 7. Yang masih perlu keputusan Ashr

Ini yang tidak bisa dijawab model; harus owner:

1. COGS hardcover riil (invoice cetak + ongkir per region).
2. Harga upgrade VIP → hardcover (dan apakah dijual).
3. Apakah punya BM + akses ad account (atau hanya Page).
4. Kapan aksi tulis diaktifkan.
5. Sumber order: CSV atau API Midtrans.
6. Prioritas: cloud AI atau Studio OpenCode.
7. Email untuk Access.
8. Status PKP/PPN.
9. Mix produk & target sales.
10. Apakah mau dashboard ini menggantikan PIC lama sepenuhnya.

---

## 8. Catatan proses

- Tiga memo dihasilkan paralel; tidak ada yang melihat jawaban satu sama lain.
- Saya tidak menyalin mentah: angka, versi API, cron, dan navigasi dikoreksi.
- Semua angka di CALCULATOR-SPEC dihitung ulang dan diberi fixture.
- Dokumen ini sengaja menyimpan perbedaan pendapat supaya review bisa menantang
  keputusan, bukan hanya menyetujui.
- Eksekusi belum dimulai. Setelah Q1–Q6 dijawab, Phase 0–1 bisa jalan tanpa
  menunggu keputusan desain final.
