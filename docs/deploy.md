# Deploy — Cloudflare Pages

Dijalankan **besok**, setelah tes HP. Jangan deploy sebelum branch di-merge.

## 1. Merge branch

```bash
git checkout main
git merge --no-ff feat/journal-print-polish
```

## 2. Build

```bash
npm ci --legacy-peer-deps
npm run build      # output: dist/
```

Cek cepat: `dist/assets/index-*.js` ada, ukuran wajar (±900 kB sebelum gzip).

## 3. Deploy

```bash
npx wrangler pages deploy dist --project-name bunda-journal
```

Kalau belum login: `npx wrangler login`.

Environment yang harus ada di Pages (Settings → Environment variables):

| Variable | Dipakai untuk |
|---|---|
| `GOOGLE_CLIENT_ID` | login Google + `/api/google-config` (Drive) |
| `GOOGLE_REDIRECT_URI` | callback login |
| `MIDTRANS_SERVER_KEY` / `VITE_MIDTRANS_CLIENT_ID` | pembayaran |
| `BUNDA_JOURNAL_DB` (D1 binding) | akun, order, arsip |

## 4. Setelah deploy

1. Buka `https://www.bundajournal.my.id/?v=19` sekali → pastikan service worker naik ke `v19`
   (cek DevTools → Application → Service Workers).
2. Buka `/#/print` di Chrome HP → harus muncul halaman cetak A4, bukan 404.
3. Tes alur: Jurnal → Download → dialog print → Save as PDF.
4. Tes kartu jadwal → **Kirim ke Ayah** → share sheet WhatsApp.
5. Cek Beranda: widget cerita, foto, streak.
6. Cek Profil: kartu "Pemulihan Data Terakhir" (kalau ada restore).

## 5. Kalau ada masalah

- Rollback: `npx wrangler pages deployment list`, lalu promote deployment sebelumnya.
- Service worker nyangkut: naikkan `CACHE_NAME` di `public/sw.js`, deploy ulang.
- Print 404: pastikan hosting mengarah ke SPA (`index.html` untuk route tak dikenal).

## Catatan

- Deploy **tidak** menyentuh data D1 user.
- Mode lokal: sejak versi ini, isi jurnal tidak lagi dikirim ke D1.
