# Web Push — notifikasi saat aplikasi ditutup

Aktif 17 Nov 2026. **Opt-in** di Profil → “Notifikasi saat app ditutup”.
Hanya metadata pengingat yang dikirim ke server; **isi jurnal tetap lokal**.

## Arsitektur

```
App/PWA
  └─ PushManager.subscribe (VAPID public key)
       └─ POST /api/push/subscribe  → D1 push_subscriptions + push_reminders
                                          │
Cloudflare Worker `bunda-reminder-cron` ───┘  (cron tiap menit)
  ├─ SELECT pengingat yang time_utc = menit sekarang
  ├─ buildPushPayload (aes128gcm + VAPID)
  └─ POST ke endpoint push browser → notifikasi → klik ke /#/jurnal
```

- `time_utc` dihitung dari jam lokal + `tzOffsetMinutes` saat sync.
- `last_sent_date` mencegah kirim dobel di hari yang sama.
- Endpoint 404/410 → subscription dihapus otomatis.
- Batch 20 pengiriman paralel per cron; query memakai index `idx_push_reminders_due`.

## Yang disimpan

| Tabel | Isi |
|---|---|
| `push_subscriptions` | device id, endpoint push, kunci enkripsi publik (`p256dh`, `auth`), offset timezone, email opsional |
| `push_reminders` | tag, judul, pesan, jam lokal, jam UTC, enabled, tanggal terakhir dikirim |

Tidak ada isi jurnal, foto, atau data bayi.

## Deploy

1. Skema D1:

```bash
npx wrangler d1 execute bunda-journal-db --remote --file=schema_push.sql
```

2. Worker cron:

```bash
npx wrangler deploy --config workers/reminder-cron/wrangler.toml
```

3. Secret Worker (sudah diset di production):

```bash
npx wrangler secret put VAPID_PUBLIC_KEY  --config workers/reminder-cron/wrangler.toml
npx wrangler secret put VAPID_PRIVATE_KEY --config workers/reminder-cron/wrangler.toml
npx wrangler secret put VAPID_SUBJECT     --config workers/reminder-cron/wrangler.toml
```

4. Secret Pages untuk `/api/push/config`:

```bash
npx wrangler pages secret put VAPID_PUBLIC_KEY --project-name bunda-journal
```

Setelah secret Pages berubah, deploy ulang Pages.

## Batas & biaya (perkiraan)

| Skala (3 pengingat/user/hari) | Status |
|---|---|
| < 1.000 user | Free tier cukup |
| 1.000–3.000 | Free tier masih mungkin; pantau CPU/subrequest |
| 3.000–5.000 | Upgrade Workers Paid ($5/bulan) |
| 5.000–50.000 | Paid + batch + index |
| > 100.000 | Pecah cron/queue; evaluasi arsitektur |

Cron selalu 1.440 kali/hari berapa pun jumlah user. Yang tumbuh adalah jumlah push dan baris D1.

## Uji yang sudah dilakukan

- `POST /api/push/subscribe` + unsubscribe production: 200.
- `GET /api/push/status` production: 200 (ada/tidaknya perangkat).
- Worker cron diuji dengan subscription uji dan endpoint yang mengembalikan 200:
  log `{"due":1,"sent":1}` dan `last_sent_date` terisi.
- Enkripsi Web Push + VAPID berhasil (library `@block65/webcrypto-web-push`).
- Subscription browser asli belum diuji di HP; perlu tes manual setelah izin notifikasi diberikan.

## Batasan

- iOS: harus dipasang ke Home Screen, iOS 16.4+.
- Android: penghemat baterai OEM bisa menunda push.
- Heads-up/suara notifikasi dikontrol channel Chrome/Android, bukan Web Push. Kode meminta `silent:false`, `renotify`, dan `vibrate`; kalau channel situs disetel senyap, pengguna harus mengubahnya di pengaturan Android.
- Endpoint push bisa kedaluwarsa; cron menghapus subscription mati.
- Kalau push gagal, fallback pop-up dalam app tetap ada saat app dibuka.
- `PUSH_ENABLED=false` di Pages mematikan config/opt-in tanpa menghapus data.
