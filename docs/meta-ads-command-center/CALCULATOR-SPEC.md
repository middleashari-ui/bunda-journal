# CALCULATOR-SPEC — Ruang Iklan

**Produk:** Ruang Iklan untuk Bunda Journal  
**Versi:** 0.1 (draft review) · **Tanggal:** 16 Nov 2026  
**Dokumen terkait:** [PRD](./PRD.md) · [TRD](./TRD.md) · [AFD](./AFD.md) · [META-PARAMETERS](./META-PARAMETERS.md)

> Semua kalkulator adalah **fungsi murni** yang sama dipakai UI, API, dan AI tool.
> Tidak ada angka yang dihitung ulang secara berbeda di tempat lain. Setiap output
> wajib menyertakan asumsi, sumber, dan peringatan sampel.

---

## 1. Notasi & mode uang

| Simbol | Arti | Default |
|---|---|---|
| `G` | Harga bruto yang dibayar pembeli per order | per produk |
| `c` | COGS per order (cetak + packing + ongkir) | 0 digital; 140.000 hardcover |
| `f` | Fee pembayaran (fraksi dari `G`) | 0,7% (0% saat promo) |
| `r` | Refund/chargeback (fraksi dari `G`) | 2% |
| `t` | PPN (fraksi) | 0% (non-PKP) |
| `n` | Basis revenue bersih pajak | `G` atau `G/(1+t)` |
| `C` | Kontribusi per order sebelum ad spend | dihitung |
| `m` | Contribution margin = `C/G` | dihitung |
| `S` | Ad spend | input |
| `O` | Order bank (bukan platform) | input |
| `R` | Revenue bank | input |

### 1.1 Mode pajak

| Mode | Rumus `n` | Kapan |
|---|---|---|
| `none` | `G` | Non-PKP; harga dianggap net |
| `inclusive` | `G / (1 + t)` | Harga sudah termasuk PPN; PKP |
| `exclusive` | `G` | Harga belum termasuk PPN; PPN ditambahkan di checkout |

### 1.2 Rumus kontribusi

**Fee tidak dikembalikan saat refund (default):**

```
C = n × (1 − f − r) − c
m = C / G
BE_ROAS = G / C = 1 / m
BE_CPA  = C
Max_CPA = C × (1 − buffer)
```

**Fee ikut dikembalikan saat refund (toggle):**

```
C = n × (1 − r) × (1 − f) − c
```

**PPN pass-through:** jangan mencampur harga incl dan excl. Pilih satu mode di
Pengaturan; semua kalkulator memakai mode itu. Kalau mode berubah, tampilkan
“Angka keputusan berubah” sebelum simpan.

### 1.3 Definisi ROAS & CPA

- `ROAS = R / S` (revenue bank ÷ spend). Platform ROAS ditampilkan terpisah.
- `CPA = S / O` (spend ÷ order bank). Platform CPA ditampilkan terpisah.
- `MER = R_bank_semua_channel / S_iklan`. Jika hanya Meta, MER = ROAS bank.
- `Profit setelah iklan = O × C − S − fixed_cost` (fixed cost opsional).

**Jangan** memakai `ROAS` sebagai satu-satunya KPI. Selalu tampilkan `BE_ROAS` di
sampingnya.

---

## 2. Kamus metrik

| # | Metrik | Rumus | Kapan menipu |
|---|---|---|---|
| 1 | Spend | `S` | Timezone akun vs WIB; biaya belum settle |
| 2 | Impressions | `I` | Naik karena frequency, bukan demand |
| 3 | Reach | orang unik | Overlap antar adset; sampling |
| 4 | Frequency | `I / reach` | Window <7 hari belum stabil |
| 5 | CPM | `S / I × 1000` | Beda placement/objective tidak sebanding |
| 6 | CPC | `S / clicks` | “All clicks” termasuk like/expand |
| 7 | Outbound CPC | `S / outbound_clicks` | Lebih jujur untuk traffic |
| 8 | CTR | `clicks / I` | Button-bait: CTR tinggi, CVR rendah |
| 9 | Outbound CTR | `outbound_clicks / I` | Metrik utama creative |
| 10 | LPV rate | `LPV / outbound_clicks` | Pixel double-fire; LP lambat |
| 11 | Cost per LPV | `S / LPV` | CPC bagus tapi LP mahal |
| 12 | Checkout rate | `checkout / LPV` | InitiateCheckout duplikat |
| 13 | CVR click | `O / outbound_clicks` | Traffic WA tidak ter-track |
| 14 | CVR LPV | `O / LPV` | Lebih stabil untuk diagnosa LP |
| 15 | CPA / CPP | `S / O` | Platform overclaim; pakai bank |
| 16 | AOV | `R / O` | Satu hardcover menggeser rata-rata |
| 17 | ROAS platform | `R_platform / S` | Atribusi 7d/1d + modeled |
| 18 | MER | `R_bank / S` | Organic besar membuat MER terlihat bagus |
| 19 | nMER | `R_bank / S_semua_marketing` | Butuh data channel lain |
| 20 | Contribution/order | `C` | Salah COGS/fee/refund |
| 21 | CM% | `C / G` | PPN incl/excl dicampur |
| 22 | BE ROAS | `G / C` | COGS berubah, BE berubah |
| 23 | BE CPA | `C` | Bukan target; ini titik impas |
| 24 | Max CPA | `C × (1−buffer)` | Buffer terlalu agresif |
| 25 | CAC | `S / new_customers` | Campur repeat/upgrade |
| 26 | LTV | `Σ p_path × revenue_path` | Window terlalu pendek/panjang |
| 27 | LTV:CAC | `LTV / CAC` | LTV dari revenue, bukan kontribusi |
| 28 | Payback | hari sampai kontribusi ≥ CAC | Digital sering 0 hari |
| 29 | iROAS | `ΔR / ΔS` | Butuh holdout; bukan korelasi |
| 30 | Tracking gap | `(O_meta − O_bank) / O_bank` | Refund/WA belum tercatat |
| 31 | Hook rate | `3s_views / impressions` | Video autoplay |
| 32 | Hold rate | `thruplay / 3s_views` | Durasi video pendek |
| 33 | Thumbstop | `3s_views / reach` | Beda denominator dengan hook |
| 34 | Refund rate | `refund / revenue` | Refund telat 7–14 hari |
| 35 | Budget pacing | `actual_spend / planned_spend` | Bulan belum selesai |

---

## 3. Default produk & unit economics

### 3.1 Asumsi default (badge “asumsi” sampai divalidasi)

| Komponen | Default | Catatan |
|---|---:|---|
| Fee pembayaran | 0,7% | Midtrans QRIS; promo 0% toggle |
| Refund | 2% | Naikkan jika data nyata berbeda |
| PPN | 0% | Non-PKP; mode `none` |
| Ongkir hardcover | 20.000 | Jawa; luar Jawa 35.000; rata-rata 25.000 |
| COGS cetak hardcover | 120.000 | **Belum validasi invoice** |
| Mix default | 20% Essential / 60% VIP / 20% Hardcover | Untuk blended |
| Buffer Max CPA | 20% | Bisa 15–30% |

### 3.2 Tabel unit economics (mode `none`)

| Produk | G | c | C | CM% | BE ROAS | BE CPA | Max CPA (−20%) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Essential | 49.000 | 0 | 47.677 | 97,30% | 1,03x | 47.677 | 38.142 |
| VIP | 129.000 | 0 | 125.517 | 97,30% | 1,03x | 125.517 | 100.414 |
| Upgrade VIP | 80.000 | 0 | 77.840 | 97,30% | 1,03x | 77.840 | 62.272 |
| Hardcover | 249.000 | 140.000 | 102.277 | 41,08% | 2,43x | 102.277 | 81.822 |

**Insight penting:** VIP digital boleh bayar CPA sampai ~Rp100rb (dengan buffer),
hardcover hanya ~Rp82rb. Jangan memakai satu target CPA untuk semua produk.

### 3.3 Blended (mix 20/60/20)

```
AOV = 0,2×49.000 + 0,6×129.000 + 0,2×249.000 = 137.000
C_blended = 0,2×47.677 + 0,6×125.517 + 0,2×102.277 = 105.301
CM% = 105.301 / 137.000 = 76,86%
BE ROAS = 1 / 0,7686 = 1,301x
Max CPA = 105.301 × 0,8 = 84.241
```

### 3.4 Jebakan upgrade hardcover

Jika VIP sudah membayar Rp129.000 dan upgrade hardcover dijual **+Rp120.000**:

```
Incremental C = 120.000×0,973 − 140.000 = −23.240
```

Artinya upgrade itu **rugi Rp23.240 per order** dengan asumsi COGS Rp140.000. Dashboard
harus menampilkan peringatan merah dan menonaktifkan skenario ini sampai COGS valid
atau harga upgrade diubah. Ini contoh kenapa COGS harus divalidasi sebelum scale.

---

## 4. 14 kalkulator

### C1 — Unit economics per produk

**Pertanyaan:** Berapa kontribusi, BE ROAS, dan Max CPA produk ini?

**Input:** `G, c, f, r, t, mode_pajak, buffer`.
**Output:** `n, C, CM%, BE_ROAS, BE_CPA, Max_CPA, profit_per_order_at_max`.
**Validasi:** `G>0`, `c≥0`, `c<G`, `0≤f≤0,05`, `0≤r≤0,2`, `0≤t≤0,2`.
**Keputusan:** jika `C≤0` → “tidak layak diiklankan”; jika `Max_CPA≤0` → “tidak layak”.
**Catatan:** tampilkan badge asumsi untuk `c`, `f`, `r`, `t`.

```
C = G × (1−f−r) − c            (mode none/exclusive)
C = G/(1+t) × (1−f−r) − c      (mode inclusive)
BE_ROAS = G / C
Max_CPA = C × (1−buffer)
```

---

### C2 — Blended AOV & margin

**Pertanyaan:** Berapa AOV dan Max CPA akun secara keseluruhan?

**Input:** mix produk `w_i`, harga `G_i`, kontribusi `C_i`.
**Output:** `AOV_blended = Σ w_i G_i`, `C_blended = Σ w_i C_i`, `CM%`, `BE_ROAS`,
`Max_CPA`.
**Validasi:** `Σ w_i = 100%`.
**Keputusan:** target CPA akun = `C_blended × (1−buffer)`; jika campaign CPA > target,
tahan/hentikan.
**Catatan:** mix berubah → target berubah. Tampilkan “mix saat ini” vs “mix 30 hari”.
Untuk campaign yang hanya menjual satu produk, pakai Max CPA produk (C1/C4); untuk
campaign campuran, pakai blended (C2). Jangan membandingkan CPA hardcover dengan Max
CPA VIP.

```
AOV = Σ w_i × G_i
C_blended = Σ w_i × C_i
```

---

### C3 — Break-even ROAS & CPA

**Pertanyaan:** Di angka berapa saya tidak untung dan tidak rugi?

**Input:** `G, c, f, r, t, mode_pajak`.
**Output:** `C, BE_ROAS, BE_CPA`, garis merah di chart.
**Validasi:** sama dengan C1.
**Keputusan:** jika `ROAS_bank < BE_ROAS` atau `CPA_bank > BE_CPA` → rugi.
**Catatan:** BE bukan target; target pakai Max CPA (C4).

#### C3b — Promo / diskon

```
G' = G × (1 − diskon)
C' = G' × (1−f−r) − c
BE_ROAS' = G' / C'
Max_CPA' = C' × (1−buffer)
```

**Keputusan:** promo hanya jika `C'>0` dan `Max_CPA'` masih di atas CPA aktual.
Tampilkan perbandingan “tanpa promo vs promo” dan dampak ke laba.

---

### C4 — Max CPA & target profit

**Pertanyaan:** Berapa CPA tertinggi yang masih menyisakan laba?

**Input:** `C`, `buffer`, `target_profit_per_order` (opsional).
**Output:** `Max_CPA = C × (1−buffer)`, `Target_CPA = C − target_profit_per_order`.
**Validasi:** `0≤buffer<1`; `target_profit < C`.
**Keputusan:** jika `CPA_bank > Max_CPA` 3 hari → turunkan/hentikan; jika
`CPA_bank ≤ Target_CPA` → sehat untuk scale.
**Catatan:** Max CPA bukan janji; ini batas matematis. Tampilkan “buffer 20%”.

---

### C5 — Budget → hasil (funnel)

**Pertanyaan:** Dengan budget Rp X, berapa order, revenue, dan laba?

**Input:** `S, CPM, CTR, LPV_rate, CVR_LPV, AOV, C`.
**Output:** `I, clicks, LPV, orders, revenue, CPA, ROAS, profit`.
**Validasi:** `S>0`, `CPM>0`, `0<CTR≤10%`, `0<LPV≤100%`, `0<CVR≤20%`, `AOV>0`.

```
I = S / CPM × 1000
clicks = I × CTR
LPV = clicks × LPV_rate
orders = LPV × CVR_LPV
revenue = orders × AOV
CPA = S / orders
ROAS = revenue / S
profit = orders × C − S
```

**Keputusan:** jika `orders < 10` → “test, belum bisa dinilai”; jika `CPA > Max_CPA`
→ “jangan scale”; jika `ROAS < BE_ROAS` → “rugi”.
**Catatan:** order desimal untuk perhitungan; display dibulatkan. Jangan menampilkan
“17,64 order” ke owner; tampilkan “±18 order” + angka eksak di tooltip.

---

### C6 — Target sales → budget

**Pertanyaan:** Berapa budget untuk 100 sales VIP?

**Input:** `target_orders, CPM, CTR, LPV_rate, CVR_LPV, AOV, C`.
**Output:** `LPV_needed, clicks_needed, impressions_needed, spend_needed, revenue,
profit, CPA`.
**Validasi:** target >0; asumsi funnel >0.

```
orders = target_orders
LPV = orders / CVR_LPV
clicks = LPV / LPV_rate
impressions = clicks / CTR
spend = impressions / 1000 × CPM
revenue = orders × AOV
profit = orders × C − spend
```

**Keputusan:** jika `profit < 0` → target tidak layak pada asumsi ini; jika
`spend > cash_available` → tunda.
**Catatan:** tampilkan rentang pesimis/base/optimis, bukan satu angka.

---

### C7 — Scale simulator

**Pertanyaan:** Kalau budget dinaikkan 2x, apakah laba naik?

**Input:** `current_budget, new_budget, CPM, CTR, CVR_LPV, LPV_rate, AOV, C,
d_cpm, d_ctr, d_cvr`.
**Output:** kurva profit vs multiplier, `CPA'`, `ROAS'`, `profit'`, `max_multiplier`.

```
m = new_budget / current_budget
CPM' = CPM × (1 + d_cpm)^log2(m)
CTR' = CTR × (1 − d_ctr)^log2(m)
CVR' = CVR × (1 − d_cvr)^log2(m)
```

Default: `d_cpm=0,15`, `d_ctr=0,05`, `d_cvr=0,10` per 2x. Lalu jalankan C5.

**Keputusan:** scale selama `profit' > profit` dan `CPA' ≤ Max_CPA`; berhenti di
multiplier yang membuat `ROAS' < BE_ROAS`.
**Catatan:** ini **skenario**, bukan prediksi. Tampilkan “asumsi degradasi” + range.
Frequency: `freq' ≈ freq × m`; jika >3, beri peringatan saturasi.

---

### C8 — Creative diagnostics

**Pertanyaan:** Kreatif ini harus di-scale, diperbaiki, atau dimatikan?

**Input:** `CTR, CVR_LPV, spend, orders, frequency, hook_rate, hold_rate,
median_CTR, median_CVR`.
**Output:** kuadran, verdict, fatigue score, rekomendasi.
**Validasi:** sample minimum (5.000 impressions / 300 outbound clicks / 25 LPV).

Kuadran (relatif ke median akun):

| CTR | CVR | Diagnosis | Aksi |
|---|---|---|---|
| Tinggi | Tinggi | Winner | Scale + iterasi |
| Tinggi | Rendah | Offer/LP | Cek harga, checkout, pesan |
| Rendah | Tinggi | Hook lemah | Ganti hook/thumbnail 0–3 dtk |
| Rendah | Rendah | Tidak cocok | Kill jika spend >2× Max CPA |

Fatigue:

```
fatigue = 0,4×min(freq/3,1) + 0,3×min(CTR_drop/0,3,1) + 0,3×min(CPA_rise/0,25,1)
```

- `<0,5` hijau; `0,5–0,75` kuning; `>0,75` merah.
- Hook rate = `3s_views / impressions`; hold = `thruplay / 3s_views`.
- Jangan menilai jika sample kurang; tampilkan “belum cukup data”.

---

### C9 — LTV / CAC / payback

**Pertanyaan:** Berapa nilai satu pembeli, dan berapa CAC yang boleh?

**Input:** path produk + probabilitas upgrade, `CAC`, window (default 60 hari).
**Output:** `LTV_revenue`, `LTV_contribution`, `LTV:CAC`, `payback_days`.

```
LTV_revenue = Σ p_path × revenue_path
LTV_contribution = Σ p_path × C_path
LTV:CAC = LTV_contribution / CAC
payback = hari pertama saat kumulatif kontribusi ≥ CAC
```

Path default:

| Path | Probabilitas | Revenue | Kontribusi |
|---|---:|---:|---:|
| Essential | 20% | 49.000 + 15%×80.000 = 61.000 | 47.677 + 15%×77.840 = 59.353 |
| VIP | 60% | 129.000 (tanpa upsell) | 125.517 |
| Hardcover | 20% | 249.000 | 102.277 |

**Keputusan:** `LTV:CAC <2` tidak layak; `2–3` hati-hati; `>3` sehat untuk digital.
**Catatan:** jangan memakai LTV 12 bulan untuk produk one-time. Window 60–90 hari.
Upgrade hardcover +120k **tidak** dimasukkan default karena rugi (lihat §3.4).

---

### C10 — Platform vs bank reconciliation

**Pertanyaan:** Apakah angka Meta bisa dipercaya?

**Input:** `S, O_meta, R_meta, O_bank, R_bank`.
**Output:** `gap_orders`, `gap_revenue`, `CPA_bank`, `MER`, `calibration`.

```
gap_orders = (O_meta − O_bank) / O_bank
gap_revenue = (R_meta − R_bank) / R_bank
CPA_bank = S / O_bank
MER = R_bank / S
calibration = O_bank / O_meta   (hanya forecast)
```

**Keputusan:** gap >20% → perbaiki tracking sebelum scale; 10–20% → waspada;
<10% → sehat. CPA keputusan selalu bank.
**Catatan:** jangan “mengoreksi” data bank dengan calibration. Calibration hanya
untuk forecast, label “estimasi”.

---

### C11 — Atribusi & incrementality

**Pertanyaan:** Berapa penjualan yang benar-benar disebabkan iklan?

**Input:** `test_orders, control_orders, test_population, control_population,
incremental_spend, AOV, C`.
**Output:** `incremental_orders, incremental_revenue, iROAS, incremental_profit`.

```
incremental_orders = test_orders − control_orders × (test_population / control_population)
incremental_revenue = incremental_orders × AOV
iROAS = incremental_revenue / incremental_spend
incremental_profit = incremental_orders × C − incremental_spend
```

**Keputusan:** jika `iROAS < BE_ROAS` → iklan tidak incremental; jika
`view_through_share >30%` → jangan scale dari view-through.
**Catatan:** ini butuh holdout/geo test. Tanpa holdout, tampilkan “tidak diukur”,
bukan angka palsu.

---

### C12 — Cashflow / print batch

**Pertanyaan:** Berapa batch hardcover yang aman secara kas?

**Input:** `batch_size, cogs_per_unit, price, preorders, daily_hardcover_orders,
cash_available, daily_ad_spend, lead_time_days`.
**Output:** `cash_out, preorder_cash_in, net_cash, days_to_sell, runway_days,
recommended_batch`.

```
cash_out = batch_size × cogs_per_unit
preorder_cash_in = preorders × price
net_cash = preorder_cash_in − cash_out
days_to_sell = batch_size / daily_hardcover_orders
runway = cash_available / (daily_ad_spend + other_daily_costs)
recommended_batch = min(30 × daily_hardcover_orders × 1,2, cash_available / cogs_per_unit)
```

**Keputusan:** jangan PO lebih dari `recommended_batch`; jika `days_to_sell >30`,
kurangi batch atau tunggu preorder.
**Catatan:** iklan dibayar harian, cetak dibayar di muka. Ini risiko kas, bukan
hanya profit.

---

### C13 — Budget pacing

**Pertanyaan:** Apakah spend bulan ini sesuai rencana?

**Input:** `daily_budget, days_elapsed, days_in_month, actual_spend`.
**Output:** `planned_to_date, pacing, projected_month_spend, remaining_budget`.

```
planned_to_date = daily_budget × days_elapsed
pacing = actual_spend / planned_to_date
projected = actual_spend / days_elapsed × days_in_month
remaining = monthly_budget − actual_spend
```

**Keputusan:** pacing >110% → turunkan/hentikan; <90% → cek delivery/learning;
95–105% → aman.
**Catatan:** hari ini belum selesai; gunakan kemarin untuk proyeksi.

---

### C14 — Scenario compare

**Pertanyaan:** Mana skenario terbaik: pesimis, base, optimis?

**Input:** 2–3 set `S, CPM, CTR, LPV, CVR, AOV, C`.
**Output:** tabel side-by-side: orders, revenue, CPA, ROAS, profit, Max CPA,
decision.
**Keputusan:** pilih profit tertinggi dengan `CPA ≤ Max_CPA` dan risiko yang bisa
diterima; bukan ROAS tertinggi.
**Catatan:** tampilkan “downside” dan “asumsi” di setiap kolom; jangan menyembunyikan
skenario pesimis.

---

## 5. Guardrail default

### 5.1 Sample minimum sebelum menilai

| Metrik | Minimum |
|---|---:|
| Impressions | 5.000 |
| Outbound clicks | 300 |
| LPV | 25 |
| Order per adset | 10–15 |
| Spend | ≥1× Max CPA |

Jika belum tercapai: **“Belum cukup data”**, jangan tampilkan verdict.

### 5.2 Kill rules

1. Spend >2× Max CPA dan 0 order dalam 48 jam → hentikan.
2. `CPA_bank > Max CPA` selama 3 hari dengan ≥10 order → turunkan 30% / hentikan.
3. Frequency >3,5 + CTR turun >30% + CPA naik >25% → refresh creative.
4. ROAS bank 3 hari < BE ROAS dan spend >Rp500rb → hentikan sementara.
5. Tracking gap >25% selama 3 hari → jangan ambil keputusan; perbaiki tracking.

### 5.3 Scale rules

1. `ROAS_bank 7d ≥ BE_ROAS ×1,2`.
2. `CPA_bank ≤ Max CPA`.
3. Frequency <2,5 (7 hari).
4. ≥10 order di adset.
5. Naikkan +20–30% per hari; tunggu 48–72 jam antar perubahan.
6. Maksimal 4 perubahan budget/jam/adset (batas Meta).
7. Jangan scale hardcover jika cash runway <14 hari.

### 5.4 Statistical confidence

Gunakan Wilson interval untuk CVR:

```
p̂ = x/n
z = 1,96 (95%)
center = (p̂ + z²/(2n)) / (1 + z²/n)
margin = z × sqrt(p̂(1−p̂)/n + z²/(4n²)) / (1 + z²/n)
CI = center ± margin
```

Aturan praktis:

- Butuh ≥10 order untuk membandingkan CPA.
- Butuh ≥500 outbound clicks per variasi untuk membandingkan CTR.
- Jika CI dua varian overlap, jangan sebut “menang”; tulis “belum signifikan”.
- Jangan kill/scale berdasarkan 1 hari.

### 5.5 Learning phase

- Meta butuh ~50 event/minggu per adset untuk stabil.
- Jangan pecah budget <Rp75.000/adset/hari untuk objective purchase (heuristik).
- Hindari perubahan budget >4×/jam; beri waktu 48–72 jam.
- Jangan menilai adset yang baru 24 jam.

---

## 6. Worked example — Rp150.000/hari × 14 hari

**Input:** `S=150.000/hari`, `CPM=45.000`, `CTR=1,8%`, `LPV=70%`, `CVR_LPV=3%`,
`AOV=120.000`, digital (`c=0`), `f=0,7%`, `r=2%`.

```
I/hari = 150.000 / 45.000 × 1000 = 3.333,33
I total = 46.666,67
clicks/hari = 3.333,33 × 0,018 = 60
clicks total = 840
LPV/hari = 60 × 0,70 = 42
LPV total = 588
orders = 588 × 0,03 = 17,64
revenue = 17,64 × 120.000 = 2.116.800
CPA = 2.100.000 / 17,64 = 119.047,62
ROAS = 2.116.800 / 2.100.000 = 1,008
fee = 2.116.800 × 0,007 = 14.817,60
refund = 2.116.800 × 0,02 = 42.336
profit = 2.116.800 − 2.100.000 − 14.817,60 − 42.336 = −40.353,60
```

**Interpretasi:**

- Dengan pembulatan 18 order: revenue Rp2.160.000, CPA Rp116.667, ROAS 1,029,
  profit +Rp1.680 — praktis impas.
- BE ROAS digital VIP = 1,03; BE ROAS blended = 1,30. ROAS 1,01 **di bawah blended**.
- `CPA 119rb` masih di bawah BE CPA VIP 125,5rb, tetapi di atas Max CPA blended 84,2rb.
- **Keputusan: jangan scale.** Perbaiki CVR (3% → 4%) atau AOV (120rb → 137rb), lalu
  uji +20%, bukan 2×.

**Skenario perbaikan CVR 4%:**

```
orders = 588 × 0,04 = 23,52
revenue = 2.822.400
CPA = 89.286
ROAS = 1,344
profit = 2.822.400 − 2.100.000 − 19.757 − 56.448 = 646.195
```

Dengan CVR 4%, profit menjadi positif, tetapi **CPA Rp89,3rb masih di atas Max CPA
blended Rp84,2rb**. Artinya: perbaiki funnel dulu, lalu uji kenaikan +20% dengan buffer
15–20%; jangan langsung 2×. Ini contoh kenapa satu perbaikan funnel lebih berharga
daripada menaikkan budget.

---

## 7. Alert rules (12)

| # | Kondisi | Window | Pesan | Aksi |
|---|---|---|---|---|
| 1 | Spend 0 padahal aktif | 4 jam | “Iklan aktif tapi tidak spend.” | Cek token/saldo/limit |
| 2 | Spend >2× Max CPA, 0 order | 48 jam | “Spend Rp310rb tanpa order.” | Hentikan |
| 3 | CPA bank > Max CPA +30% | 3 hari | “CPA 118rb vs Max 82rb.” | Turunkan 30%/hentikan |
| 4 | Frequency >3 + CPM +20% | 7 hari | “Audiens saturasi.” | Refresh/expand |
| 5 | CTR turun >30% | 7 hari | “Kreatif capek.” | Ganti hook |
| 6 | LPV rate <60% | 24 jam | “Landing lambat/rusak.” | Cek speed/pixel |
| 7 | Checkout 0 dari >200 LPV | 24 jam | “Checkout bermasalah.” | Cek harga/ongkir |
| 8 | Tracking gap >25% | 3 hari | “Meta overclaim.” | Pakai bank, cek CAPI |
| 9 | Refund >4% | 7 hari | “Ekspektasi produk meleset.” | Cek copy/CS |
| 10 | ROAS hari ini < BE, MER 7d > BE | 1 hari | “Jangan panik.” | Tahan, lihat 7d |
| 11 | Token/CAPI error | segera | “Koneksi putus.” | Reconnect |
| 12 | Hardcover stock <7 hari | run-rate | “Stok cetak tipis.” | Stop ads hardcover |

Setiap alert: `rule_key, severity, evidence_json, suggested_action, dedupe_key`.
Jangan alert untuk likes/reach/impressions.

---

## 8. Asumsi yang perlu dikonfirmasi

| # | Asumsi | Default | Dampak jika salah |
|---|---|---|---|
| A1 | COGS hardcover | 120.000 + 20.000 ongkir | BE ROAS hardcover |
| A2 | Upgrade VIP→hardcover | Tidak dijual +120k | Rugi Rp23k/order |
| A3 | Fee | 0,7% (promo 0%) | Margin semua produk |
| A4 | Refund | 2% | Margin |
| A5 | PPN | 0% (non-PKP) | BE ROAS naik ~11% jika incl |
| A6 | Mix | 20/60/20 | AOV/Max CPA blended |
| A7 | CVR | 3% dari LPV | Budget planner |
| A8 | AOV | 120.000 (contoh) / 137.000 (blended) | Revenue/profit |
| A9 | Ongkir luar Jawa | 35.000 | Hardcover |
| A10 | Target profit/order | 20% buffer | Max CPA |

---

## 9. Test fixtures (wajib lulus)

| Kasus | Input | Expected |
|---|---|---|
| VIP default | G=129.000, c=0, f=0,007, r=0,02 | C=125.517; BE ROAS=1,0277; Max=100.414 |
| Essential | G=49.000 | C=47.677; BE ROAS=1,0277; Max=38.142 |
| Upgrade | G=80.000 | C=77.840; BE ROAS=1,0277; Max=62.272 |
| Hardcover | G=249.000, c=140.000 | C=102.277; BE ROAS=2,434; Max=81.822 |
| Blended | mix 20/60/20 | AOV=137.000; C=105.301; BE ROAS=1,301; Max=84.241 |
| PPN incl 11% | VIP, t=0,11 | C=113.078; BE ROAS=1,141; Max=90.463 |
| Fee 0% | VIP, f=0 | C=126.420; BE ROAS=1,0204; Max=101.136 |
| Hardcover COGS 120k | c=120.000, no shipping | C=122.277; BE ROAS=2,036; Max=97.822 |
| Upgrade hardcover +120k | G=120.000, c=140.000 | C=−23.240 → invalid/merah |
| Refund 100% | r=1 | C negatif → invalid |
| COGS > harga | G=100.000, c=150.000 | C negatif → invalid |
| 0 order | S=1.000.000, O=0 | CPA undefined → “belum ada order” |
| Worked example | S=2.1jt, CPM=45k, CTR=1.8%, LPV=70%, CVR=3%, AOV=120k | orders=17,64; CPA=119.048; ROAS=1,008; profit=−40.354 |
| Scale 2× | d_cpm=15%, d_ctr=5%, d_cvr=10% | profit' dihitung; jika < current → “jangan 2×” |
| Wilson | 10/300 vs 15/300 | CI overlap → “belum signifikan” |

**Aturan test:** setiap kalkulator punya minimal 3 kasus (normal, edge, invalid).
Gunakan `toBeCloseTo` untuk uang; jangan membandingkan string terformat.

---

## 10. Definisi “cukup data” untuk keputusan

```
if impressions < 5.000 or outbound_clicks < 300 or LPV < 25 or orders < 10:
    decision = "insufficient"
    reason = "Sampel belum cukup; tunggu ..."
elif cpa_bank > max_cpa for 3 days:
    decision = "stop"
elif roas_bank_7d >= be_roas * 1.2 and cpa_bank <= max_cpa and frequency < 2.5:
    decision = "scale"
else:
    decision = "hold"
```

AI **wajib** memakai aturan ini; tidak boleh mengubah ambang sendiri. Owner bisa
mengubah ambang di Pengaturan, dan perubahan itu masuk audit.
