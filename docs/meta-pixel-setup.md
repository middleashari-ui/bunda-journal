# Meta Pixel — status & cara aktivasi

**Status:** aktif dengan Dataset ID `1558009306133404` (Bunda Journal).
ID juga di-hardcode sebagai fallback di `src/lib/metaPixel.ts`, jadi build dari Git tidak perlu env tambahan. `VITE_META_PIXEL_ID` tetap bisa dipakai untuk override (mis. pixel testing).
Selama `VITE_META_PIXEL_ID` kosong, semua fungsi pixel no-op — tidak ada request ke facebook.net, tidak ada error.

---

## 1. Aktivasi (5 menit)

1. Buka **Meta Events Manager → Data Sources → pilih Pixel** → salin **Pixel ID** (15–16 digit, angka saja).
2. Isi di env:
   - lokal: `.env` → `VITE_META_PIXEL_ID=123456789012345`
   - produksi: **Cloudflare Pages → Settings → Environment variables** (Production) → tambah nama yang sama, lalu **redeploy**.
3. Buka `https://www.bundajournal.my.id`, cek console: `[meta-pixel] aktif: ...` (hanya di dev) dan tab **Network** ada `fbevents.js`.
4. Di Events Manager → **Test Events**, masukkan URL, lakukan tes checkout (Mode sandbox Midtrans).

## 2. Event yang sudah dipasang

| Event | Kapan | File | Parameter |
|---|---|---|---|
| `PageView` | saat app dimuat | `src/main.tsx` → `initMetaPixel()` | — |
| `ViewContent` | section harga terlihat ≥35% | `src/components/LandingPage.tsx` | `value: 129000, currency: IDR, content_ids: [vip]` |
| `InitiateCheckout` | transaksi Midtrans dibuat, sebelum Snap terbuka | `src/components/CheckoutModal.tsx` | `value` sesuai paket, `order_id` sebagai eventID |
| `Purchase` | `/success` **dan** server bilang `is_paid` | `src/components/SuccessPage.tsx` | `value`, `currency`, `order_id`, `content_name` |

Semua nilai memakai `PRICING_CONFIG` (49.000 / 80.000 / 129.000 / 249.000), bukan angka hardcoded.

## 3. Pengaman yang sudah dipasang

- **Purchase tidak ditembak di landing page.** Hanya di `/success` setelah `GET /api/subscription` mengembalikan `is_paid = true`.
- **Dedupe per `order_id`**: reload halaman tidak menambah Purchase baru (localStorage `bunda_meta_events_v1`).
- **Batas 2 jam**: user lama yang membuka `/success` berhari-hari kemudian tidak dihitung sebagai pembelian baru (`hasRecentCheckout()`).
- **Tanpa PII**: email/nama tidak pernah dikirim ke pixel.
- **`eventID`** dikirim untuk Purchase & InitiateCheckout, siap dipakai dedupe kalau nanti memasang Conversions API.

## 4. Yang masih harus dilakukan manual di Meta

1. **Verifikasi domain** (Business Settings → Brand Safety → Domains). Tanpa ini, event iOS bisa terpotong.
2. **Aggregated Event Measurement**: prioritaskan `Purchase` di paling atas.
3. **Konversi kustom**: buat custom conversion `Purchase` (kalau ingin optimasi ke nilai tertentu).

## 5. Event optimasi yang disarankan

| Fase | Optimasi | Alasan |
|---|---|---|
| Minggu 1–2 | `InitiateCheckout` | volume 3–5x Purchase, cukup untuk keluar learning |
| Setelah ±50 Purchase/minggu | `Purchase` | optimasi langsung ke penjualan |

Jangan mulai dengan `Purchase` kalau volume masih 1 order/hari — pixel tidak akan pernah stabil.

## 6. UTM untuk audit manual

Tempel di semua link iklan:

```
?utm_source=meta&utm_medium=paid&utm_campaign=BJ-CONV-NOV&utm_content=HS1
```

Ganti `utm_content` per kreatif (HS1, HS2, PAIN1, PAIN2, GAIN1, GAIN2). UTM disimpan di `sessionStorage` (`bunda_utm_v1`) dan bisa dicocokkan dengan order Midtrans.

## 7. Troubleshooting

| Gejala | Penyebab umum |
|---|---|
| Tidak ada `fbevents.js` di Network | env kosong / belum redeploy / adblock |
| `PageView` masuk, `Purchase` tidak | user belum verified server, atau checkout > 2 jam |
| Purchase dobel | `order_id` berbeda dari server — cek `/api/subscription` |
| Event masuk tapi tidak ada di laporan | attribution window / AEM belum diatur |

## 8. Kalau nanti pasang Conversions API

Gunakan `order_id` sebagai `event_id` yang sama (sudah dikirim dari browser) supaya Meta otomatis men-dedupe browser + server.
