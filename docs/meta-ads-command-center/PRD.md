# PRD — Ruang Iklan (Meta Ads Command Center)

**Produk:** Ruang Iklan untuk Bunda Journal  
**Versi:** 0.1 (draft review) · **Tanggal:** 16 Nov 2026 · **PIC:** Ashr  
**Status:** Menunggu review · **Route:** `/ads`  
**Dokumen terkait:** [TRD](./TRD.md) · [AFD](./AFD.md) · [IPD](./IPD.md) · [CALCULATOR-SPEC](./CALCULATOR-SPEC.md) · [META-PARAMETERS](./META-PARAMETERS.md)

---

## 1. Ringkasan & masalah

Bunda Journal sudah punya produk, harga, pembayaran, dan pembeli. Yang belum ada adalah
**satu tempat untuk memutuskan iklan**. Hari ini keputusan diambil dari tiga sumber yang
tidak saling cocok:

1. **Ads Manager** — tahu impressions, CTR, ROAS platform, tapi tidak tahu COGS hardcover,
   fee QRIS, refund, dan ongkir. Angka konversinya juga overclaim karena atribusi.
2. **Spreadsheet/WhatsApp** — tahu uang masuk, tapi tidak tahu iklan mana yang menyumbang,
   dan diperbarui manual setelah owner ingat.
3. **PIC lama (`PicModal.tsx`)** — login hardcoded di client, data di `localStorage`,
   tidak punya data Meta. Tidak layak jadi control room.

Akibatnya: owner tidak bisa menjawab tiga pertanyaan penting dengan tenang:

- **“Apakah saya boleh scale hari ini?”**
- **“Kreatif mana yang capek, dan apa penggantinya?”**
- **“Berapa budget untuk target sales yang realistis?”**

### Product thesis

> Ads Manager menjawab “iklan mana yang menang”. Spreadsheet menjawab “kemarin untung
> berapa”. Ruang Iklan menjawab **“besok saya harus ngapain”** — dalam rupiah, setelah
> fee, refund, COGS, dan ongkir.

Ruang Iklan adalah **kokpit keputusan**, bukan laporan. Satu layar, satu keputusan,
satu sumber kebenaran (uang bank), dan AI yang membaca data lewat tool — bukan mengarang.

---

## 2. Tujuan, non-goals, dan ukuran sukses

### 2.1 Tujuan

| # | Tujuan | Cara tahu berhasil |
|---|---|---|
| G1 | Owner tahu harus melakukan apa dalam <5 menit tiap pagi | Waktu buka → keputusan tercatat; dipakai ≥5 hari/minggu |
| G2 | Semua keputusan iklan memakai **CPA bank**, bukan ROAS platform | 100% kartu keputusan menampilkan sumber bank + gap Meta |
| G3 | Owner bisa menghitung break-even, max CPA, budget target, dan skala tanpa spreadsheet | ≥3 skenario kalkulator disimpan/minggu |
| G4 | Aksi tulis aman, bisa diaudit, dan bisa dibatalkan | 100% aksi punya approval + audit; 0 aksi tanpa jejak |
| G5 | AI menjawab dengan angka yang bisa dilacak | 100% jawaban punya `source` + `as-of`; 0 angka tanpa sitasi |
| G6 | Dashboard tidak menambah beban operasional | Sync sukses ≥99%; tidak ada cron lokal yang harus dinyalakan |

### 2.2 Non-goals (sengaja tidak dikerjakan)

- Menggantikan Ads Manager untuk membuat campaign dari nol (P2, bukan MVP).
- Multi-brand, multi-ad-account, role tim, agency mode.
- Benchmark kompetitor, social listening, audience map eksploratif.
- Integrasi TikTok/Google/Shopee Ads di MVP.
- Laporan PDF 20 halaman, gamifikasi, leaderboard, dark mode crypto.
- Menyimpan PII pembeli di tabel yang sama dengan data Meta.
- Auto-scale tanpa persetujuan manusia.

### 2.3 Ukuran sukses (setelah 30 hari)

| Metrik | Target | Cara ukur |
|---|---|---|
| Waktu ke keputusan | ≤5 menit | timestamp buka → klik keputusan |
| Cakupan rekonsiliasi | ≥95% order bank ter-match | `matched_orders / total_orders` |
| Waste spend turun | ≥20% vs baseline 30 hari | spend pada entity yang dihentikan guardrail |
| Keputusan memakai data bank | 100% | audit UI event |
| Sync success | ≥99% | `meta_sync_runs` |
| AI citation coverage | 100% | evaluasi 20 jawaban sampel |
| Aksi tanpa approval | 0 | audit log |
| Token bocor | 0 | security review + log scan |

### 2.4 Guardrail metrics (kalau merah, rilis dihentikan)

- Ada token/secret di response API atau browser storage.
- Ada aksi tulis dieksekusi tanpa baris `meta_actions` + approval.
- AI menjawab angka yang tidak ada di tool result.
- Dashboard menampilkan data >24 jam tanpa label “basi”.

---

## 3. Pengguna & job

| Aktor | Job | Hak |
|---|---|---|
| **Ashr (Owner/PIC)** | Menentukan budget, menghentikan iklan, membaca profit, menyetujui aksi | Penuh |
| **Analis (AI cloud)** | Membaca data, menghitung, menjelaskan, mengusulkan aksi | Baca + usul; tidak eksekusi |
| **Studio (OpenCode lokal)** | Membaca/mengubah kode dashboard, menjalankan tes, menyiapkan worktree | Worktree + approval merge |
| **Sistem (cron)** | Sync Meta, hitung alert, kirim digest, rekonsiliasi | Tulis data; tidak ubah budget |
| **Viewer (opsional)** | Melihat laporan tanpa aksi | Baca saja |

Aturan: **satu manusia yang menekan tombol eksekusi.** AI dan sistem tidak pernah
memegang token Meta.

---

## 4. Prinsip produk (mengikat)

1. **Uang bank adalah kebenaran.** Metrik Meta adalah pembanding, bukan hakim.
2. **Satu layar, satu keputusan.** Tidak ada metric wall. Maksimal 4 KPI konteks.
3. **Setiap angka punya sumber, periode, dan `as-of`.**
4. **Asumsi diberi badge.** COGS, ongkir, refund, fee, pajak — kuning sampai divalidasi.
5. **Progressive disclosure.** Tabel dulu; chart kalau membantu; raw JSON hanya di
   “Advanced”.
6. **Tidak ada aksi kejutan.** Semua tulis = proposal → approval → audit → hasil.
7. **Kalkulator deterministik.** AI boleh menjelaskan, bukan mengganti rumus.
8. **Tenang secara visual.** Warna = makna, bukan dekorasi.
9. **Mobile tidak didesain belakangan.** Keputusan pagi harus bisa dibaca dari HP.
10. **Kalau fitur tidak dipakai 14 hari, hapus.** Dashboard bukan museum fitur.

---

## 5. Information architecture

### 5.1 Navigasi

```
/ads
├── /ads                  Hari Ini        (default)
├── /ads/iklan            Iklan           Kampanye · Kreatif · Breakdown
├── /ads/uang             Uang            Produk · Order · Rekonsiliasi
├── /ads/rencana          Rencana         Kalkulator · Skenario · Forecast
├── /ads/pengaturan       Pengaturan      Koneksi · Sync · AI · Studio · Audit
├── /ads/studio           Studio OpenCode (full screen, lokal)
└── panel kanan           Analis AI       (tersedia di semua tab)
```

Maksimal **5 tab**. AI adalah panel, bukan tab. Studio adalah mode kerja terpisah,
bukan tab harian.

### 5.2 Setiap tab menjawab satu pertanyaan

| Tab | Pertanyaan | Hero metric | Aksi utama |
|---|---|---|---|
| **Hari Ini** | Apakah saya aman spend hari ini? | **Laba bersih 7 hari** (bank) | Naikkan / Tahan / Hentikan |
| **Iklan** | Kreatif & campaign mana yang kerja? | **CPA bank 7 hari vs Max CPA** | Usulkan pause/scale |
| **Uang** | Berapa CPA yang masih boleh saya bayar? | **Max CPA produk unggulan** | Validasi biaya & rekonsiliasi |
| **Rencana** | Berapa budget untuk target X? | **Budget untuk target sales** | Simpan & bandingkan skenario |
| **Pengaturan** | Apakah data & akses sehat? | **Status koneksi & sync** | Validasi token, sync, atur guardrail |

### 5.3 Elemen global

- **Account switcher** (satu akun di MVP; skema siap multi-akun).
- **Date range**: Hari ini, Kemarin, 7 hari, 14 hari, 30 hari, Bulan ini, Bulan lalu,
  Custom. Default: 7 hari.
- **As-of badge** + tombol sync. Jika data >6 jam: badge kuning “data mungkin basi”.
- **Alert bell** + jumlah alert belum dibaca.
- **Analis** (panel kanan) dan **Studio** (tombol top bar; status online/offline).
- **Export CSV** untuk scope yang sedang dilihat.
- **Mode demo** terpisah (data sintetis, banner jelas) — tidak pernah aktif di production.

---

## 6. Scope & prioritas

| Fitur | P0 MVP | P1 V1.1 | P2 Later |
|---|---|---|---|
| Koneksi Meta + validasi token + pilih ad account | ✅ | | |
| Sync metadata + insights harian + backfill 90 hari | ✅ | | |
| Hari Ini + decision card + 4 KPI + 1 chart | ✅ | | |
| Iklan: tabel campaign/adset/ad + detail drawer | ✅ | | |
| Iklan: tabel kreatif + fatigue + kuadran | ✅ | | |
| Uang: unit economics + produk + max CPA | ✅ | | |
| Uang: import order CSV + rekonsiliasi | ✅ | | |
| Rencana: 6 kalkulator inti | ✅ | | |
| Rencana: 14 kalkulator + skenario compare | | ✅ | |
| Analis AI: ringkasan + 3 pertanyaan inti + sitasi | ✅ (read-only) | | |
| Analis AI: 10 pertanyaan golden + tool lengkap | | ✅ | |
| Alert in-app + Telegram digest | ✅ (3 aturan) | ✅ (12 aturan) | |
| Approval pause/scale + audit | | ✅ | |
| Breakdown age/gender/placement/region | | ✅ | |
| Parameter catalog + column picker + raw JSON | ✅ | | |
| Page organic insights | | ✅ | |
| OpenCode Studio (bridge lokal) | | ✅ | |
| Create campaign dari template | | | ✅ |
| Multi-account / team / roles | | | ✅ |
| TikTok/Shopee/Google Ads | | | ✅ |

**MVP sengaja read-only.** Flow approval dibangun di V1.1 dan default OFF sampai data
bank cocok ≥95% selama 14 hari.

---

## 7. Kebutuhan layar

### 7.1 Onboarding koneksi Meta

**Tujuan:** dari “belum terhubung” ke “data 30 hari terlihat” dalam <5 menit, tanpa
meminta password Facebook.

**Langkah:**

1. **Gerbang akses.** Cloudflare Access (OTP email owner). Tidak ada PIN client-side.
2. **Pilih jenis koneksi:**
   - **System User token (disarankan)** — long-lived, untuk server.
   - **User access token** — fallback 60 hari, harus refresh.
   - **Page token** — hanya Page organic, **tidak bisa** Ads Insights. UI harus
     mendeteksi dan menjelaskan, bukan membiarkan owner bingung.
3. **Tempel token.** Input `type=password`, tidak ada tombol copy, tidak disimpan di
   browser. Penjelasan: “Kami tidak pernah meminta password Facebook.”
4. **Validasi server-side:** `/debug_token`, `/me`, `/me/adaccounts`, `/me/accounts`,
   pixel list. Tampilkan: nama akun, currency, timezone, scopes, expiry, status.
5. **Pilih ad account** (wajib), **Page** (opsional), **Pixel/Dataset** (opsional).
6. **Isi ekonomi produk:** harga (prefilled), COGS, ongkir, fee, refund, pajak. Semua
   yang belum divalidasi diberi badge **“asumsi”**.
7. **Pilih backfill:** 30 / 90 / 365 hari. Peringatan rate limit + estimasi waktu.
8. **Sync awal:** progress per tahap (metadata → insights → breakdown), bisa ditinggal.
9. **Selesai:** “Buka Hari Ini” + daftar hal yang belum lengkap (mis. pixel belum dipilih).

**Empty/error states:**

| Kondisi | Pesan | Aksi |
|---|---|---|
| Token kosong | “Tempel token dari Business Manager.” | Panduan 3 langkah |
| Token invalid/expired | “Token tidak aktif. Buat token baru di Business Settings.” | Link panduan + retry |
| Hanya Page token | “Token ini hanya membaca Halaman, bukan iklan. Ikuti panduan System User 3 menit.” | Buka panduan |
| Tidak ada ad account | “Akun ini belum punya akses ad account. Tambahkan aset di Business Manager.” | Panduan + retry |
| Scope kurang | “Butuh `ads_read`. Scope yang ada: …” | Daftar scope + panduan |
| Currency bukan IDR | “Akun memakai USD. Tampilan tetap USD; kalkulator Rp dinonaktifkan sampai kurs diisi.” | Input kurs manual |
| 0 spend | “Akun terhubung, belum ada spend. Data akan muncul setelah iklan jalan.” | Ke Iklan |

**Acceptance criteria:**

- Token tidak pernah muncul di response API, localStorage, URL, log, atau error message.
- Respons API hanya berisi `last4`, `status`, `expires_at`, `scopes`.
- Validasi menolak token tanpa `ads_read` dengan pesan yang bisa ditindaklanjuti.
- Backfill bisa dijeda/dilanjutkan dan idempotent (tidak dobel).
- Onboarding selesai <5 menit untuk akun dengan ≤100 ads.

---

### 7.2 Hari Ini (default landing)

**Pertanyaan:** Apakah saya aman spend hari ini?

**Struktur:**

1. **Decision card** — satu status: **Naikkan / Tahan / Hentikan / Belum cukup data**.
   - Alasan 1 kalimat, 3 chip bukti (CPA bank, ROAS bank, frequency).
   - “Lihat detail” → Iklan; “Buat skenario” → Rencana.
   - Wajib menampilkan **downside** jika naikkan: “Jika CPA naik 20%, laba jadi Rp…”
2. **4 KPI** (maksimal): Laba bersih, Spend, CPA bank vs Max CPA, Order bank.
   Masing-masing: nilai, delta vs periode sebelumnya, sumber (Bank/Meta), as-of.
3. **Alert strip** — maksimal 3 alert aktif, severity, “Kenapa?”.
4. **Chart** — spend vs revenue bank vs profit bersih, 14/30 hari, annotation perubahan
   budget. Maksimal 1 chart.
5. **Perlu keputusan** — 3 entity teratas yang melanggar guardrail, dengan tombol
   “Usulkan hentikan / naikkan”.
6. **Kreatif capek** — 3 sinyal fatigue (frequency, CTR turun, CPA naik).
7. **Uang vs Meta** — gap % + link rekonsiliasi.
8. **Footer data** — as-of, jumlah order, sample warning, link “cara hitung”.

**Decision logic (account-level, default):**

```
jika belum ada data          → "Belum cukup data"
jika order_bank < 10         → "Tahan — sampel belum cukup"
jika cpa_bank > max_cpa
     selama 3 hari            → "Hentikan / turunkan"
jika roas_bank_7d ≥ be_roas×1.2
     dan cpa_bank ≤ max_cpa
     dan frequency < 2.5      → "Naikkan +20%"
selain itu                   → "Tahan"
```

Ambang bisa diubah di Pengaturan → Guardrail. `max_cpa` memakai **per produk** jika
campaign hanya menjual satu produk, dan **blended** jika campaign campuran. AI tidak
boleh mengubah ambang sendiri.

**Acceptance criteria:**

- Keputusan dan alasannya bisa dilacak ke query + data as-of.
- Tidak ada angka tanpa sumber.
- Jika data >6 jam, muncul banner “data mungkin basi” dan tombol sync.
- Jika order <10, keputusan tidak boleh “Naikkan”.
- Mobile: decision card + 2 KPI terlihat tanpa scroll horizontal.

---

### 7.3 Iklan

**Pertanyaan:** Kreatif & campaign mana yang kerja, mana yang capek?

**Sub-tab:** Kampanye · Kreatif · Breakdown

#### Kampanye

- Tabel: nama, status, budget, spend, order bank, CPA bank, ROAS bank, frequency,
  sparkline 7 hari, decision badge.
- Kolom bisa dipilih (column picker). Default 8 kolom; sisanya lewat “Tambah kolom”.
- Filter: status, objective, tanggal, search, tag.
- Klik baris → **detail drawer**:
  - Ringkasan: spend, order, CPA, ROAS, frequency, budget pacing.
  - Timeseries harian + annotation perubahan budget.
  - Daftar adset & ad di bawahnya (nested table).
  - Kreatif yang dipakai + preview.
  - Breakdown on-demand.
  - Change log (budget/status) + audit.
  - Aksi: usulkan pause/resume/scale, duplicate (P1).
- Aksi massal: pilih beberapa → usulkan pause (approval).

#### Kreatif

- Tabel: thumbnail, nama, tag angle (USG, testimoni, nama bayi, hardcover, anxiety),
  format (video/static), spend, CTR outbound, hook rate, hold rate, CVR, CPA bank,
  frequency, umur, verdict (Scale / Watch / Kill).
- **Kuadran kreatif:** CTR (x) vs CVR LPV (y), bubble = spend. Warna = verdict.
- Detail drawer: preview, copy, CTA, landing URL, metrik video, timeline, AI diagnosis,
  “Buat brief iterasi” (P1).
- Fatigue rules default:
  - Frequency >3 dalam 7 hari + CPM naik >20%.
  - CTR turun >30% dibanding 7 hari sebelumnya.
  - CPA bank naik >25% selama 3 hari dengan ≥10 order.
  - Spend >2× Max CPA tanpa order.
- Jangan menilai kreatif sebelum 5.000 impressions / 300 outbound clicks / 25 LPV.

#### Breakdown

- Pilihan: age/gender, publisher platform + placement, region, device.
- On-demand fetch (bukan sync default) + cache 6 jam.
- Tabel + satu chart; peringatan “estimated” untuk metrik tertentu.
- Tidak tersedia untuk data >13 bulan (reach) — tampilkan penjelasan.

**Acceptance criteria:**

- Tabel 200 baris pertama render <1 detik dari cache.
- Sorting/filtering tidak memanggil Meta.
- Aksi dari drawer selalu membuat proposal, bukan eksekusi langsung.
- Raw JSON hanya muncul di mode Advanced dan tidak berisi token.
- Breakdown gagal → error actionable, bukan layar kosong.

---

### 7.4 Uang

**Pertanyaan:** Berapa CPA yang masih boleh saya bayar, dan apakah uangnya cocok?

**Sub-tab:** Produk · Order · Rekonsiliasi

#### Produk

Tabel produk: harga, COGS, ongkir, fee %, refund %, pajak, kontribusi/order, CM%,
BE ROAS, BE CPA, Max CPA, badge asumsi.

- Edit inline dengan validasi.
- Toggle **mode pajak**: `none` (non-PKP), `inclusive`, `exclusive`.
- Toggle **fee promo 0%** vs 0,7%.
- Toggle **ongkir region**: Jawa / luar Jawa / rata-rata.
- Tombol “Lihat perhitungan” → formula + angka.
- Peringatan otomatis: “COGS ≥ harga → mustahil profit”, “Max CPA < 0”, “Refund >10%”.

**Default produk (bisa diubah):**

| Produk | Harga | COGS | Ongkir | Fee | Refund | Kontribusi | BE ROAS | Max CPA (−20%) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Essential | 49.000 | 0 | 0 | 0,7% | 2% | 47.677 | 1,03x | 38.142 |
| VIP | 129.000 | 0 | 0 | 0,7% | 2% | 125.517 | 1,03x | 100.414 |
| Upgrade VIP | 80.000 | 0 | 0 | 0,7% | 2% | 77.840 | 1,03x | 62.272 |
| Hardcover | 249.000 | 120.000 | 20.000 | 0,7% | 2% | 102.277 | 2,43x | 81.822 |

#### Order

- Import CSV (Midtrans export / bank statement / template).
- Preview 10 baris + mapping kolom + validasi per baris.
- Dedupe by `order_id`; kalau duplikat, tampilkan konflik (jangan timpa diam-diam).
- Manual add untuk order WA/transfer.
- Match ke campaign/adset/ad: otomatis via UTM/`fbclid` jika ada; manual jika tidak.
- Status: paid, refunded, pending, failed.
- Filter tanggal/produk/sumber/status; total di footer.
- Export CSV.

#### Rekonsiliasi

- Tabel harian: order Meta vs order bank, revenue Meta vs bank, gap Rp & %.
- Grafik gap (bar) + garis toleransi.
- Daftar order bank yang belum ter-match; daftar klaim Meta yang tidak ada di bank.
- Tombol “Match manual” + “Tandai sebagai organic/WA”.
- **Calibration factor** hanya untuk forecast, diberi label “estimasi, bukan koreksi data”.
- Tidak pernah menimpa angka bank dengan angka Meta.

**Acceptance criteria:**

- Import 1.000 baris <10 detik; error per baris ditampilkan.
- Rekonsiliasi tidak mengubah `gross`/`net` order.
- Gap % dan sampel selalu terlihat.
- Kalkulator produk dan rekonsiliasi memakai sumber biaya yang sama (single source).

---

### 7.5 Rencana

**Pertanyaan:** Berapa budget untuk target X, dan apa risikonya?

**Struktur:**

- Grid 14 kalkulator (lihat [CALCULATOR-SPEC](./CALCULATOR-SPEC.md)) dalam 4 grup:
  **Dasar**, **Perencanaan**, **Skala**, **Diagnosa & Uang**.
- Setiap kartu: pertanyaan satu baris, terakhir dipakai, tombol “Buka”.
- Kalkulator drawer:
  - Input kiri (angka + slider bila relevan), output kanan (kartu hasil).
  - **Decision banner**: “Layak test / Tahan / Jangan scale”, dengan alasan.
  - Asumsi + badge; tombol “Reset ke default”.
  - “Simpan skenario”, “Salin ringkasan”, “Tanya Analis tentang hasil ini”.
- **Skenario**: simpan hingga 20; bandingkan maksimal 3 side-by-side; highlight profit
  dan risiko.
- **Forecast**: 7/14/30 hari dengan rentang pesimis/base/optimis, bukan satu angka.
- Semua perhitungan deterministik di client (fungsi murni), bisa diaudit.

**Acceptance criteria:**

- Hasil kalkulator cocok dengan fixture di CALCULATOR-SPEC (unit test).
- Input invalid ditolak dengan pesan spesifik, bukan `NaN`.
- Skenario tersimpan dan bisa dibuka lagi setelah reload.
- AI bisa memanggil kalkulator yang sama lewat tool dan menyebut `scenario_id`.
- Tidak ada kalkulator yang memakai data Meta tanpa label sumber.

---

### 7.6 Pengaturan

**Seksi:**

1. **Koneksi** — akun Meta, token last4/status/expiry, validate/rotate/remove, Page,
   Pixel, scopes, permissions.
2. **Sync** — jadwal, riwayat, backfill, retensi, field yang disinkronkan.
3. **Produk & biaya** — harga, COGS, ongkir per region, fee, refund, pajak.
4. **Atribusi** — window (7d click + 1d view default), kebijakan bank vs Meta, calibration.
5. **Guardrail** — min sample, kill/scale rules, buffer Max CPA, budget change limit.
6. **AI** — provider, model, budget cap, tool permissions, prompt version, test question.
7. **Studio** — status OpenCode, port, token, skill version, workspace, permissions.
8. **Alert** — aturan, channel (in-app, Telegram, email), quiet hours.
9. **Akses** — Cloudflare Access users, service token, session.
10. **Audit** — pencarian, filter, export.
11. **Katalog parameter** — 180+ field, search, toggle sync/display, raw JSON.
12. **Danger zone** — hapus akun, purge data, reset settings.

**Acceptance criteria:**

- Tidak ada response API yang mengembalikan token plaintext.
- Mengubah field sync memicu konfirmasi + re-sync, bukan diam-diam.
- Audit log tidak bisa diedit/dihapus dari UI.
- Semua perubahan setting tercatat (actor, before, after).
- Access control tidak bisa dilewati dengan `?dev=1` di production.

---

### 7.7 Panel Analis (AI cloud)

**Tujuan:** menjawab pertanyaan iklan dengan data nyata, bukan opini.

**Perilaku:**

- Panel kanan 420px; di mobile menjadi sheet full-screen.
- Header: “Analis”, model, scope chips (akun, tanggal, campaign), as-of.
- Suggested prompts sesuai konteks (Hari Ini vs Iklan vs Kalkulator).
- Jawaban format:
  1. **Kesimpulan** (1–2 kalimat).
  2. **Bukti** (3–5 bullet, angka + sumber + periode).
  3. **Risiko / batasan** (sampel, atribusi, data basi).
  4. **Aksi** (proposal, bukan eksekusi).
  5. **Data** (as-of, query id, jumlah order).
- Tool trace collapsible: “Membaca insights 14 hari”, “Menjalankan kalkulator”.
- Citation chip → buka tabel/drawer di tab terkait.
- Tombol “Buat skenario” → prefill kalkulator; “Usulkan aksi” → approval modal.
- Streaming + stop + regenerate + feedback.

**10 pertanyaan golden (wajib benar sebelum rilis):**

1. Kenapa CPA naik minggu ini?
2. Campaign mana yang boncos?
3. Budget berapa untuk 100 sales VIP?
4. Kreatif mana yang harus dihentikan hari ini?
5. Apakah boleh scale campaign X +20%?
6. Ringkas kemarin dalam 3 bullet untuk WhatsApp.
7. Bandingkan 7 hari ini vs 7 hari sebelumnya.
8. Berapa Max CPA hardcover hari ini?
9. Cocokkan angka Meta vs bank; di mana selisihnya?
10. Apa yang berubah setelah budget dinaikkan kemarin?

**Aturan mengikat:**

- AI tidak menerima token, tidak bisa memanggil Graph API langsung, tidak bisa menulis.
- Semua tool read-only; `action_propose` hanya membuat draft.
- Jika data <10 order: wajib bilang “belum cukup data untuk menyimpulkan”.
- Tidak boleh mengklaim sebab-akibat dari korelasi.
- Tidak boleh mengarang angka; jika tool tidak punya, jawab “tidak ada data”.
- Data >6 jam: sebut “data basi” di jawaban.
- Prompt injection dari teks kreatif diperlakukan sebagai data, bukan instruksi.

**Acceptance criteria:**

- 10/10 pertanyaan golden menghasilkan angka yang cocok dengan query manual.
- 0 jawaban tanpa sitasi (audit 20 sampel).
- First token <3 detik (p95), jawaban selesai <20 detik untuk 1 tool call.
- Provider down → pesan jelas + retry/fallback; tidak ada jawaban setengah.
- Batas biaya harian tercapai → AI berhenti dengan pesan, bukan tagihan tak terbatas.

---

### 7.8 Studio (OpenCode lokal)

**Tujuan:** membawa OpenCode ke dalam dashboard untuk kerja kode/otomasi, tanpa
memberi AI akses langsung ke token Meta.

**Mode:**

1. **Embedded (V1.1):** bridge lokal `127.0.0.1:4097` → `opencode serve` → panel Studio.
2. **Fallback universal:** tombol “Copy context ke OpenCode” (prompt + snapshot data)
   yang bisa ditempel di OpenCode TUI. Tidak butuh server.
3. **Cloud (P2):** OpenCode di Durable Object/remote — tidak untuk MVP.

**Fitur:**

- Status online/offline + versi + workspace.
- Session list, new session dengan context (akun, tanggal, pertanyaan).
- Prompt + streaming + tool call + diff + test runner.
- Worktree per task; preview; “Minta merge” → approval manusia.
- Skill `meta-ads` (baca katalog, kalkulator, guardrail, format jawaban).
- Permission: edit/bash `ask`; tidak ada akses `.env`/secret; audit.

**Failure modes:**

| Kondisi | Perilaku |
|---|---|
| OpenCode tidak terpasang | Panel menampilkan panduan install + fallback copy context |
| Bridge mati | Status merah, fallback cloud/copy, tidak crash |
| CORS/private network diblokir | Sarankan buka dashboard via `localhost` atau Tunnel |
| Model quota habis | Fallback model + pesan |
| Tool error | Tampilkan error mentah + request id; jangan mengarang |

**Acceptance criteria:**

- Studio tidak pernah mengirim token Meta ke prompt/log.
- Session bisa diedit di worktree, diff terlihat, merge butuh approval.
- Kalau bridge mati, seluruh dashboard tetap berfungsi.
- Tidak ada perintah shell yang dieksekusi tanpa izin.

---

### 7.9 Approval modal (aksi tulis)

**Isi:**

- Jenis aksi, target (campaign/adset/ad), nilai lama vs baru.
- Alasan (dari AI/manusia), dampak yang diharapkan, **downside**.
- Guardrail yang dilanggar/dipenuhi.
- Requester + waktu + `proposal_id`.
- Checkbox “Saya paham risiko” untuk dampak >Rp500.000.
- Konfirmasi ketik `SETUJU` untuk perubahan budget >30%.
- Tombol: Setujui · Tolak · Setujui & jeda.

**Setelah setujui:**

1. Server re-validate status token + nilai terbaru (jangan menimpa perubahan manual).
2. Eksekusi dengan idempotency key.
3. Tulis audit: actor, before, after, response Meta, request id.
4. Tampilkan hasil; jika gagal, error Meta + langkah berikut.
5. Tawarkan “Batalkan” jika masih dalam window aman (rollback = aksi baru, bukan undo ajaib).

**Aturan:**

- Budget change maksimal +30% per aksi; maksimal 4 perubahan/jam per adset (batas Meta).
- Pause aman; resume butuh konfirmasi.
- Tidak ada aksi massal >10 entity tanpa konfirmasi tambahan.
- Semua aksi bisa ditolak; tidak ada auto-retry tulis.

---

### 7.10 Alert

**Channel:** in-app (wajib), Telegram (P1), email (P2).  
**Jadwal:** evaluasi tiap sync; digest harian 08:00 WIB; rekap mingguan Senin.

**Aturan MVP (3):**

1. Token invalid/expired → severity kritis.
2. Spend >2× Max CPA tanpa order (48 jam) → kritis.
3. Sync gagal 3× berturut-turut / cron tidak jalan >90 menit → kritis.

**Aturan V1.1 (12):** lihat CALCULATOR-SPEC §8. Setiap alert wajib punya:
kondisi, threshold, window, pesan, aksi yang disarankan, dan link bukti.

**Larangan:** alert untuk likes, reach, impressions, atau “ROAS turun 1%” tanpa konteks.

---

## 8. Spesifikasi AI (ringkas)

### 8.1 Yang boleh

- Membaca data agregat dari D1 lewat tool.
- Menjalankan kalkulator deterministik.
- Menjelaskan penyebab dengan bukti.
- Membuat proposal aksi (draft).
- Menyusun ringkasan untuk WhatsApp/email.
- Menyarankan iterasi kreatif berdasarkan metrik (bukan mengklaim bisa menonton video).

### 8.2 Yang tidak boleh

- Melihat/menyebut token, secret, email pembeli, atau data pribadi.
- Memanggil Graph API langsung.
- Mengubah budget/status/campaign.
- Mengarang angka, membandingkan dengan kompetitor, atau menjanjikan hasil.
- Mengakses internet di luar tool yang diizinkan.
- Menjalankan shell (kecuali Studio dengan izin eksplisit).

### 8.3 Format jawaban (wajib)

```
Kesimpulan: <1–2 kalimat>
Bukti:
- <angka> (<sumber>, <periode>, as-of <waktu>)
- ...
Risiko: <sampel/atribusi/data basi>
Aksi: <proposal atau "tidak ada">
Data: <query_id>, <jumlah order>, <catatan>
```

### 8.4 Tool contract (ringkas)

`ads_get_overview`, `ads_list_campaigns`, `ads_get_entity`, `ads_query_insights`,
`ads_list_creatives`, `ads_get_alerts`, `ads_reconcile`, `calc_run`, `calc_compare`,
`action_propose`, `audit_search`. Semua mengembalikan envelope:

```json
{
  "data": {},
  "meta": {
    "as_of": "2026-11-16T08:30:00+07:00",
    "source": "bank|meta|calc|manual",
    "query_id": "q_01J...",
    "row_count": 18,
    "warnings": ["sample < 10 order"]
  }
}
```

### 8.5 Biaya & rate limit AI

- Default model murah untuk ringkasan; model reasoning untuk diagnosis mingguan.
- Maks 20 tool call per pertanyaan; maks 8k output token.
- Budget harian (default Rp25.000) + warning 80%; berhenti di 100%.
- Cache ringkasan harian; jangan panggil model untuk angka yang bisa dihitung.

---

## 9. Aturan data & kebenaran angka

1. **Dua kolom selalu:** `Meta` dan `Bank`. Jangan pernah hanya satu.
2. **CPA keputusan = spend ÷ order bank.** ROAS keputusan = revenue bank ÷ spend.
3. **Atribusi default:** 7-day click + 1-day view; ditampilkan di setiap chart.
4. **Platform overclaim:** tampilkan `gap % = (Meta − Bank) / Bank`. >20% = merah.
5. **Calibration factor** hanya untuk forecast, label “estimasi”.
6. **As-of** di setiap angka; data >6 jam = badge kuning.
7. **Sample minimum:** 5.000 impressions / 300 outbound click / 25 LPV / 10 order.
8. **Uang:** IDR, pembulatan display ke ribuan; perhitungan penuh di belakang.
9. **Timezone:** waktu akun Meta; tampilan WIB; jika beda, beri catatan.
10. **Tidak ada data sintetis** di production; demo mode terpisah.

---

## 10. Desain & anti-slop (mengikat)

### 10.1 Bahasa visual

- **Palet:** Linen Sage — `#F5F2EB` (app bg), `#F9F8F6` (surface), `#556B2F` (sage),
  `#C87A64` (terracotta), `#292524` (ink), `#78716C` (muted), `#E5E0D6` (border),
  `#B7791F` (amber/assumption).
- **Tipografi:** Lora untuk judul & satu hero sentence; Inter untuk UI/angka;
  `font-variant-numeric: tabular-nums` untuk semua angka.
- **Bentuk:** radius 12px, border 1px, shadow hanya modal. Tidak ada glass/gradient.
- **Ikon:** Lucide line, 16/20px. Tidak ada emoji sebagai ikon.
- **Spacing:** kelipatan 8px; konten max 1440px; sidebar 220px desktop.

### 10.2 Aturan layout

1. Satu hero metric + maksimal 4 KPI konteks per layar.
2. Maksimal 1 chart per seksi; tabel lebih diutamakan.
3. Setiap angka punya label sumber + periode + as-of.
4. Setiap rekomendasi punya downside.
5. Setiap asumsi punya badge kuning.
6. Empty state = instruksi + tombol, bukan ilustrasi kosong.
7. Loading = skeleton sesuai layout; error = apa yang terjadi + retry + request id.
8. Mobile: bottom nav 5, tabel menjadi kartu, kalkulator satu kolom, AI sheet.
9. Tidak ada horizontal scroll di 390px.
10. Tidak ada modal di atas modal.

### 10.3 Chart

- Maksimal 3 gridline horizontal; tanpa gradient; tanpa 3D; tanpa dual axis tanpa label.
- Warna seri: sage, terracotta, amber, slate; pola untuk colorblind.
- Direct label di ujung garis; tooltip menampilkan sumber + as-of.
- Annotation untuk perubahan budget/creative.
- Maksimal 300 titik; >90 hari → bucket mingguan.
- Selalu ada “Lihat tabel” untuk aksesibilitas.

### 10.4 Copy

- Bahasa Indonesia, aktif, spesifik. “Naikkan Rp50.000”, bukan “optimalkan alokasi”.
- Istilah teknis (CPA, ROAS, CPM, Advantage+) tetap English, ada tooltip.
- Tanpa tanda seru, tanpa “powered by AI”, tanpa klaim “real-time” jika poll 30 menit.
- Angka uang: `Rp 1.234.000`; persen 1 desimal; CPA display ribuan.

### 10.5 Dilarang

- Gradient ungu/biru, glassmorphism, dark mode crypto, confetti, maskot.
- Grid 8–12 kartu KPI, leaderboard, gamifikasi.
- Chart reach/impressions tanpa keputusan.
- AI chat tanpa grounding/citation.
- Auto-scale, auto-pause tanpa approval.
- Data dummy permanen, angka fiktif untuk mengisi layar.
- Menyimpan token di browser/URL/`VITE_*`.
- Warna sebagai satu-satunya pembeda status.

---

## 11. Non-functional requirements

| Area | Requirement |
|---|---|
| Performa | `/ads` chunk ≤300 KB gzip; LCP <2,5 dtk desktop, <3,5 dtk 4G; API p95 <500 ms (overview), <1,5 dtk (90 hari) |
| Sync | Incremental <5 menit; backfill 90 hari <30 menit (tersebar, tidak memblokir UI) |
| Uptime | 99,5% untuk dashboard; sync boleh tertunda, data tidak boleh korup |
| Keamanan | Cloudflare Access; enkripsi AES-256-GCM; audit append-only; least privilege; CSP; rate limit |
| Privasi | Tidak ada PII pembeli di prompt AI; agregat; retensi terbatas; purge atas permintaan |
| Kepatuhan | Meta Platform Terms; data hanya untuk akun sendiri; tidak dijual/dibagikan |
| Aksesibilitas | WCAG 2.1 AA; keyboard; focus ring; aria-live; reduced motion; target 44px |
| Browser | Chrome/Edge/Safari 2 versi terakhir; mobile Safari/Chrome |
| Offline | Dashboard **tidak** offline-first; tampilkan banner offline; jangan antre aksi tulis |
| Retensi | Insights harian 24 bulan; breakdown 30 hari; audit 24 bulan; AI thread 90 hari |
| Backup | D1 Time Travel + export mingguan ke R2; CSV export manual |

---

## 12. Risiko & mitigasi

| # | Risiko | Dampak | Mitigasi UI/teknis |
|---|---|---|---|
| R1 | Token/app review/rate limit Meta | Data tidak sync, dashboard kosong | System User read-only; backfill chunk; header throttle; upgrade Full access setelah 500 call; status banner |
| R2 | Atribusi Meta overclaim | Scale saat sebenarnya rugi | CPA bank sebagai hero; gap %; label atribusi; calibration hanya forecast |
| R3 | AI hallucination / over-trust | Keputusan salah | Tool-only, sitasi, “belum cukup data”, approval, downside, audit |
| R4 | COGS/upsell hardcover fiktif | Break-even palsu | Badge asumsi; range; validasi invoice; peringatan upgrade VIP→hardcover rugi |
| R5 | Data basi | Terlambat hentikan iklan | As-of, stale banner, sync health, alert cron mati |
| R6 | Scope creep / AI slop | Dashboard tidak dipakai | 5 tab, cut list, aturan 14 hari, review tiap fase |
| R7 | OpenCode lokal disalahgunakan | Kode/secret rusak | Localhost, token, worktree, permission ask, no secret, approval merge |
| R8 | Owner solo (bus factor) | App mati saat owner sakit | Runbook, export, infra sederhana, tidak ada dependency eksotis |
| R9 | Token bocor | Ad account disalahgunakan | Enkripsi, no browser, redaction, rotasi, Access, audit |
| R10 | Aksi tulis salah | Budget bocor | Approval, re-validate, idempotency, batas +30%, 4×/jam, audit, rollback |

---

## 13. Rencana rilis

### MVP — “Data masuk & keputusan terlihat” (target 8–10 hari kerja)

- Phase 0: keputusan, Meta app + System User, Cloudflare Access (0,5 hari).
- Phase 1: route `/ads`, auth, D1 migration, token vault, onboarding, sync 30/90 hari,
  Hari Ini, tabel campaign, parameter catalog (3–4 hari).
- Phase 2: Uang (produk, order CSV, rekonsiliasi), 6 kalkulator inti, skenario (2–3 hari).
- Phase 3a: 3 alert + digest, export CSV, **Analis ringkasan read-only** (3 pertanyaan
  inti: ringkasan harian, kenapa CPA naik, campaign boncos), QA/perf (2 hari).

**Demo:** buka dari HP → lihat laba bersih, CPA bank vs max, gap Meta vs bank, dan
satu kalkulator break-even. Tidak ada aksi tulis.

### V1.1 — “Aman untuk mengeksekusi” (target 6–8 hari)

- Approval pause/scale + audit + rollback.
- 14 kalkulator + scenario compare + forecast rentang.
- Breakdown age/gender/placement/region.
- 12 alert + Telegram.
- Analis AI lengkap (10 golden questions).
- Page organic insights.

### V1.2 — “Studio” (target 4–6 hari)

- OpenCode bridge + panel Studio + skill `meta-ads` + worktree + preview.
- Fallback copy context.
- Audit & permission tightening.

### Later

- Campaign draft/template, multi-account, team roles, TikTok/Shopee, auto-rules.

**Aturan rilis:** setiap phase berhenti di acceptance criteria; tidak lanjut kalau
owner belum memakai phase sebelumnya ≥3 hari.

---

## 14. Pertanyaan terbuka (lengkap)

| # | Pertanyaan | Default | Dampak |
|---|---|---|---|
| Q1 | COGS hardcover riil (cetak + packing + ongkir)? | Rp140.000 (120k + 20k Jawa) | BE ROAS & Max CPA hardcover |
| Q2 | Harga upgrade VIP → hardcover? | Jangan +Rp120k; validasi COGS | Bisa rugi Rp23k/order |
| Q3 | Akses Business Manager/System User? | Ya, read-only dulu | Tanpa ini tidak ada Ads Insights |
| Q4 | Aksi tulis di MVP? | Bangun, default OFF | Risiko eksekusi |
| Q5 | Sumber order? | CSV Midtrans/bank dulu | Reconciliation |
| Q6 | Prioritas AI? | Cloud dulu, Studio kemudian | OpenCode butuh laptop |
| Q7 | Email untuk Cloudflare Access? | Email owner | Keamanan |
| Q8 | Atribusi? | 7d click + 1d view | Semua ROAS/CPA |
| Q9 | Status PKP/PPN? | Non-PKP (mode `none`) | Margin & BE |
| Q10 | Mix produk default? | 20% Essential / 60% VIP / 20% Hardcover | AOV blended 137k |
| Q11 | Target sales mingguan? | 70 order/minggu | Forecast awal |
| Q12 | Fee Midtrans? | 0,7%, promo 0% toggle | Margin |
| Q13 | Refund rate? | 2% | Margin |
| Q14 | Sumber WA order? | Input manual/CSV | Rekonsiliasi |
| Q15 | Retensi breakdown? | 30 hari | Biaya D1 |

---

## 15. Lampiran: copy deck

| Konteks | Copy |
|---|---|
| Hero aman | “Aman untuk naikkan budget. CPA bank Rp58rb, di bawah batas Rp100rb.” |
| Hero tahan | “Tahan dulu. 18 order masih terlalu sedikit untuk menilai.” |
| Hero bahaya | “Hentikan adset ini. Spend Rp310rb tanpa satu order.” |
| Stale | “Data terakhir 08.30 WIB. Meta biasanya telat 15–30 menit.” |
| Gap | “Meta melaporkan 24 order; bank mencatat 18. Selisih 33% — pakai angka bank.” |
| Assumption | “COGS cetak Rp120rb masih asumsi. Klik untuk validasi.” |
| Empty | “Belum ada data Meta. Hubungkan akun — butuh 3 menit dan akses Business Manager.” |
| Error | “Sync gagal: token kedaluwarsa. Buat token baru, lalu coba lagi. Ref: sync_01J…” |
| Approval | “Naikkan budget adset ini +20% (Rp150.000 → Rp180.000). Downside: jika CPA naik 20%, laba turun Rp…” |
| AI insufficient | “Belum cukup data: 6 order dalam 7 hari. Tunggu minimal 10 order sebelum menyimpulkan.” |
| Studio offline | “OpenCode belum jalan di laptop. Jalankan `npm run ads:studio`, atau pakai Analis cloud.” |

---

## 16. Checklist acceptance MVP

- [ ] Token hanya bisa masuk lewat UI, tersimpan terenkripsi, tidak pernah kembali ke browser.
- [ ] Cloudflare Access memblokir `/ads` dan `/api/ads/*` tanpa login.
- [ ] Onboarding 1 akun selesai <5 menit; backfill 30 hari sukses.
- [ ] Hari Ini menampilkan decision card + 4 KPI + 1 chart dengan as-of.
- [ ] Tabel campaign/adset/ad + detail drawer; angka cocok dengan D1.
- [ ] Parameter catalog bisa search; kolom bisa dipilih; raw JSON tanpa secret.
- [ ] Uang: 4 produk, edit biaya, BE ROAS/CPA, badge asumsi.
- [ ] Import CSV 1.000 baris; dedupe; rekonsiliasi Meta vs bank.
- [ ] 6 kalkulator inti lulus unit test sesuai CALCULATOR-SPEC.
- [ ] 3 alert berfungsi; digest Telegram (jika diaktifkan).
- [ ] Analis menjawab 10 pertanyaan golden dengan sitasi.
- [ ] Tidak ada aksi tulis yang bisa dieksekusi tanpa approval (V1.1).
- [ ] Mobile 390px: tidak ada horizontal scroll; target 44px.
- [ ] Lighthouse/a11y: tidak ada error kritis; axe bersih.
- [ ] Runbook token expired, sync gagal, rate limit, AI down.
