# Status Implementasi — Ruang Iklan (demo)

**Tanggal:** 16 Nov 2026  
**Status:** App demo berjalan; integrasi Meta/AI/OpenCode backend menunggu key.  
**Route:** `/ads` (contoh: `http://127.0.0.1:5173/ads`)

---

## 1. Yang sudah jalan

| Area | Status | Bukti |
|---|---|---|
| Route `/ads` terpisah dari PWA | ✅ | `src/main.tsx` lazy-load `src/ads/AdsApp.tsx` |
| 5 tab: Hari Ini, Iklan, Uang, Rencana, Pengaturan | ✅ | `src/ads/routes/*` |
| Decision card + guardrail CPA/ROAS/frequency | ✅ | `src/ads/lib/calculators.ts` |
| Tabel campaign/adset-level + detail drawer | ✅ | `src/ads/routes/Ads.tsx`, `CampaignDrawer.tsx` |
| Kreatif: kuadran CTR × CVR, fatigue, verdict | ✅ | `src/ads/components/charts.tsx` |
| Uang: unit economics, edit COGS/fee/refund, BE ROAS/CPA | ✅ | `src/ads/routes/Money.tsx` |
| Import/export CSV order + rekonsiliasi Meta vs bank | ✅ | `src/ads/lib/csv.ts` |
| 14 kalkulator deterministik | ✅ | `src/ads/lib/calculatorDefs.ts` |
| Skenario tersimpan (sesi) | ✅ | `PlanRoute` |
| Katalog 180+ parameter + column picker + raw JSON | ✅ | `src/ads/lib/catalog.ts` |
| Analis demo (rule-based, tanpa LLM) | ✅ | `src/ads/components/AnalystPanel.tsx` |
| Studio OpenCode: panel status + copy context | ✅ | `src/ads/components/StudioPanel.tsx` |
| Approval pause/scale (demo, state lokal) | ✅ | `ApprovalModal.tsx` + `AdsApp.tsx` |
| Validasi format token Meta + error state | ✅ | `ConnectModal.tsx` |
| Mode gelap | ✅ | Toggle topbar, persist `bunda_ads_theme`, ikut `prefers-color-scheme` |
| Mobile 390px tanpa overflow | ✅ | E2E Chromium/WebKit |
| Error boundary per halaman | ✅ | `components/ErrorBoundary` |

---

## 2. Yang masih mock / belum aktif

| Integrasi | Kondisi sekarang | Yang dibutuhkan |
|---|---|---|
| Meta Marketing API | Data demo deterministik 30 hari | System User token + backend Pages Functions |
| D1 `meta_*` | Belum ada migrasi | `migrations/ads/*` + binding D1 |
| Sync/cron | Tombol sync hanya simulasi | Worker scheduler + endpoint `/api/ads/sync/*` |
| AI cloud | Analis rule-based dari data demo | API key + tool contract + streaming |
| OpenCode bridge | Panel + copy context | `scripts/opencode-bridge.mjs` + OpenCode server |
| Cloudflare Access | Belum dipasang | Policy `/ads*` + `/api/ads/*` |
| Aksi tulis Meta | Approval lokal, tidak dikirim | `meta_actions` + `ads_management` + audit |
| Midtrans API | CSV/manual | Server key di Worker secret (jangan browser) |

**Token tidak disimpan.** Form hanya memvalidasi format dan menampilkan `last4`;
tidak ada `localStorage`, URL, atau request jaringan.

---

## 3. Cara menjalankan

```bash
npm run dev
# buka http://127.0.0.1:5173/ads
```

Build produksi:

```bash
npm run build
```

---

## 4. Test yang sudah dijalankan

| Perintah | Hasil |
|---|---|
| `npm run lint` (tsc --noEmit) | ✅ 0 error |
| `npm run test:unit` | ✅ 10 file, 71 test |
| `npx playwright test tests/e2e/ads.spec.ts --project=chromium` | ✅ 6/6 |
| `npx playwright test tests/e2e/ads.spec.ts --project=webkit` | ✅ 6/6 |
| `npm run test:e2e:chromium` (semua E2E) | ✅ 21/21 |
| `npm run audit:storage` | ✅ 0 akses localStorage di `src/ads/` (tema lewat `appStorage`) |
| `npm run build` | ✅ build sukses |

Test baru:

- `tests/unit/ads-calculators.test.ts` — unit economics, blended, funnel, guardrail,
  creative, LTV, rekonsiliasi, cashflow, pacing, promo.
- `tests/unit/ads-csv.test.ts` — parsing CSV, format uang, error baris, export.
- `tests/e2e/ads.spec.ts` — dashboard, navigasi, kalkulator, validasi token,
  approval, mode gelap, mobile 390px.

---

## 5. File utama

```
src/ads/
├── AdsApp.tsx                 # shell, navigasi, state demo, approval
├── ads.css                    # desain scoped (Linen Sage)
├── components/
│   ├── AnalystPanel.tsx       # analis demo rule-based
│   ├── ApprovalModal.tsx      # approval + downside + guardrail
│   ├── CampaignDrawer.tsx     # detail campaign
│   ├── CalculatorRunner.tsx   # form + output kalkulator
│   ├── ConnectModal.tsx       # validasi token Meta
│   ├── StudioPanel.tsx        # OpenCode panel + copy context
│   ├── charts.tsx             # Recharts
│   └── ui.tsx                 # badge, metric, modal, state
├── data/demo.ts               # data demo deterministik
├── lib/
│   ├── calculators.ts         # fungsi murni + guardrail
│   ├── calculatorDefs.ts      # 14 kalkulator
│   ├── catalog.ts             # katalog parameter
│   ├── csv.ts                 # import/export order
│   └── format.ts              # IDR, persen, ROAS, tanggal
├── routes/
│   ├── Pulse.tsx              # Hari Ini
│   ├── Ads.tsx                # Iklan
│   ├── Money.tsx              # Uang
│   ├── Plan.tsx               # Rencana
│   └── Settings.tsx           # Pengaturan
└── types.ts
```

Perubahan kecil di luar folder:

- `src/main.tsx` — branch route `/ads`, lazy-load.
- `public/_redirects` — hanya redirect domain; route `/ads` memakai fallback SPA
  otomatis Cloudflare Pages (rule `/ads /index.html 200` ternyata memicu 308 ke `/`).
- `tests/e2e/ads.spec.ts`, `tests/unit/ads-*.test.ts`.

---

## 6. Batasan yang perlu diketahui

1. **Data demo** bukan akun Meta asli. Angka tidak boleh dipakai untuk keputusan
   bisnis nyata.
2. **Token tidak disimpan.** Setelah backend siap, token harus masuk lewat
   `POST /api/ads/accounts` dan dienkripsi, bukan localStorage.
3. **AI bukan LLM.** Jawaban Analis dihitung dari data demo + kalkulator; label
   “demo · rule-based” selalu tampil.
4. **Studio belum tersambung** ke OpenCode server. Tombol copy context selalu
   bekerja; bridge menyusul.
5. **Approval hanya state lokal.** Tidak ada request ke Meta; toast menyebut
   “tidak dikirim ke Meta”.
6. **CSV import** memakai parser sederhana; belum memanggil Midtrans API.
7. **Routing** memakai path `/ads/iklan`, `/ads/uang`, `/ads/rencana`,
   `/ads/pengaturan`; query `?tab=` masih didukung untuk kompatibilitas.

---

## 7. Langkah saat key Meta tersedia

1. Buat Business Manager + System User token (read-only dulu).
2. Tambah D1 migration `meta_*` (lihat TRD §4).
3. Implement `functions/api/ads/*` + token vault AES-GCM.
4. Ganti `src/ads/data/demo.ts` dengan API client; pertahankan tipe yang sama.
5. Deploy Worker scheduler + Cloudflare Access.
6. Uji sync 30 hari, rekonsiliasi bank, lalu aktifkan approval write.
7. Setelah data bank cocok ≥95%, aktifkan `ads_management` dan audit.
