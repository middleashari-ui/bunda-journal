# Pembayaran — Midtrans Snap

Status: **aktif** (17 Nov 2026). `PAYMENT_PAUSED = false`, tapi server punya kill
switch darurat tanpa deploy ulang.

## Alur

1. Landing → pilih paket → isi **email pembayaran** → Midtrans Snap.
2. Client `POST /api/midtrans/charge` (atau `/api/upgrade` untuk Essential→VIP).
3. Server memvalidasi plan + amount, mencatat order `pending` di D1, lalu membuat
   transaksi Snap. **Harga dan tier tidak pernah diambil dari client.**
4. User membayar di popup Snap (QRIS/GoPay dan channel lain).
5. Midtrans memanggil webhook `POST /api/midtrans-callback`.
6. Webhook memverifikasi signature SHA-512, mencocokkan nominal dengan order,
   lalu menulis `bunda_subscriptions.is_paid = 1` + tier.
7. Client memverifikasi ke `GET /api/subscription?email=...`; baru setelah
   `is_paid` dari server, akses VIP diaktifkan di perangkat. Kalau webhook telat,
   client juga memanggil `POST /api/midtrans/status` (`order_id` + email) untuk
   membaca status langsung dari Midtrans. **Webhook tetap jalur utama** — endpoint
   status hanya jaring pengaman.

## Harga (satu sumber: `src/config/pricing.ts` + `functions/_lib/payments.ts`)

| Plan | Harga | Tier |
|---|---|---|
| `essential` | Rp 49.000 | essential |
| `vip` | Rp 129.000 | vip |
| `upgrade_vip` | Rp 80.000 | vip |
| `hardcover` | Rp 249.000 | vip |

## Konfigurasi

### Cloudflare Pages (production)

| Nama | Jenis | Isi |
|---|---|---|
| `MIDTRANS_SERVER_KEY` | Secret | server key production (`Mid-server-...`) |
| `MIDTRANS_ENV` | Env | `production` (opsional; default production) |
| `PAYMENT_PAUSED` | Env | `false` (set `true` untuk mematikan darurat) |
| `VITE_MIDTRANS_CLIENT_KEY` | Build-time | client key production |
| `VITE_MIDTRANS_SNAP_URL` | Build-time | `https://app.midtrans.com/snap/snap.js` |

Build production memakai `.env.production`. Jangan menaruh server key di
`.env.production` atau file yang di-commit.

### Midtrans dashboard

- Payment Notification URL:
  `https://www.bundajournal.my.id/api/midtrans-callback`
- Aktifkan channel QRIS/GoPay. Redirect finish URL opsional.
- Sandbox: `https://app.sandbox.midtrans.com/snap/snap.js` + server key `SB-Mid-server-...`.

### D1

```bash
npx wrangler d1 execute bunda-journal-db --remote --file=schema_auth.sql
npx wrangler d1 execute bunda-journal-db --remote --file=schema_payments.sql
npx wrangler d1 execute bunda-journal-db --remote --file=schema_rate_limit.sql
npx wrangler d1 execute bunda-journal-db --remote --file=schema_google.sql
```

`schema_payments.sql` membuat `bunda_subscriptions` dan `bunda_orders`.

## Pemeriksaan setelah deploy

```bash
curl https://www.bundajournal.my.id/api/payments/health
```

Respons tidak membocorkan kunci; contoh:

```json
{
  "ok": true,
  "mode": "production",
  "paused": false,
  "serverKey": "production",
  "database": true,
  "tablesReady": true,
  "warnings": []
}
```

Kalau `serverKey` = `sandbox` di mode production, ganti secret sebelum menerima
pembayaran nyata.

## Uji lokal (sandbox, tanpa uang nyata)

1. Salin `MIDTRANS_SERVER_KEY` sandbox ke `.dev.vars`:

   ```
   MIDTRANS_SERVER_KEY=SB-Mid-server-...
   MIDTRANS_ENV=sandbox
   PAYMENT_PAUSED=false
   ```

2. Buat D1 lokal:

   ```bash
   npx wrangler d1 execute bunda-journal-db --local --file=schema_auth.sql
   npx wrangler d1 execute bunda-journal-db --local --file=schema_payments.sql
   npx wrangler d1 execute bunda-journal-db --local --file=schema_rate_limit.sql
   ```

3. `npm run build && npx wrangler pages dev dist --port 8788`
4. `POST /api/auth/register` → ambil token → `POST /api/midtrans/charge` dengan
   `Bearer` token → transaksi sandbox dibuat.
5. Simulasikan callback dengan signature
   `SHA512(order_id + status_code + gross_amount + serverKey)` →
   `GET /api/subscription` harus `is_paid: true`.

Pada 17 Nov 2026 alur ini diuji end-to-end: **15/15 lulus** (charge, amount
tamper, signature salah, replay, upgrade, VIP ganda, nominal tidak cocok,
expire tidak menurunkan tier).

## Keamanan

- Harga/tier dipegang server; `amount` client harus sama persis.
- Order id aman Midtrans (`BJ-<PLAN>-<base36>-<rand>`), tanpa email/pipe.
- Email & tier disimpan di `bunda_orders`, bukan di order id.
- Charge membuat order `pending` **sebelum** memanggil Midtrans; webhook menolak
  order yang tidak dikenal.
- Signature diverifikasi waktu konstan; nominal harus cocok dengan order.
- Status `expire/cancel/deny` tidak pernah menurunkan tier yang sudah aktif.
- Rate limit 10 charge/jam per email.
- Charge memakai email sesi kalau login; email beda dengan sesi ditolak (403).
- VIP tidak bisa membeli VIP dua kali; upgrade hanya untuk akun Essential.
- Kill switch: `PAYMENT_PAUSED=true` di Cloudflare → endpoint 503 tanpa transaksi.

## Batasan yang diketahui

- **Payment Notification URL di dashboard Midtrans wajib diset** ke
  `https://www.bundajournal.my.id/api/midtrans-callback`. Tanpa itu, tier hanya
  aktif lewat pengecekan status manual dan bisa telat.
- Endpoint `POST /api/midtrans/status` bergantung pada Midtrans yang baru
  mengenali transaksi setelah pembayaran diproses; sebelum itu Midtrans
  menjawab `404 Transaction doesn't exist`.
- Pembelian **sebelum punya akun** tetap diizinkan (email dari form checkout),
  mengikuti alur produk "bayar dulu, akun menyusul". Verifikasi kepemilikan email
  belum ada; registrasi saat ini juga belum memverifikasi email.
- `GET /api/subscription?email=` masih bisa dibaca tanpa sesi (hanya status
  tier/paid). Pertimbangkan mengunci ini kalau data dianggap sensitif.
- Hardcover Rp 249.000 dianggap pembelian tier VIP; alamat pengiriman belum
  dikumpulkan di checkout — konfirmasi manual lewat email/WA.
