# Arsitektur & Rencana Refactor

Status: **peta kondisi saat ini** (bukan usulan rewrite). Tidak ada kode yang diubah
oleh dokumen ini.

Ringkas: aplikasi berjalan baik dan sudah punya jaring pengaman (E2E + CI), tetapi
ada utang teknis yang perlu dicicil **setelah rilis**: penyimpanan foto, versi skema
data, dan dua file monolit.

---

## 1. Bentuk aplikasi

```
┌──────────────────────────── Browser (PWA) ─────────────────────────────┐
│  React 19 + Vite 8 + Tailwind 4                                        │
│                                                                        │
│  App.tsx  ── tab: Beranda | Jurnal | Studio | Profil                  │
│     │         └─ /#/print (PrintBookView, 100 halaman A4)              │
│     │                                                                  │
│     ├── localStorage  (data jurnal, pengaturan, sesi)                  │
│     ├── IndexedDB     (snapshot restore, antrean sync lama)            │
│     └── Service Worker (cache-first navigation, v20)                   │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ fetch /api/*
                                   ▼
┌──────────────────── Cloudflare Pages Functions ────────────────────────┐
│  auth (login/register/google), subscription, upgrade, midtrans,        │
│  userdata (arsip per email, TIDAK dipakai saat mode lokal),            │
│  google-config (client ID publik)                                      │
│                                   │                                    │
│                                   ▼                                    │
│                              D1 (BUNDA_JOURNAL_DB)                     │
└────────────────────────────────────────────────────────────────────────┘
```

Mode penyimpanan: `src/config/storage.ts` → `JOURNAL_STORAGE_MODE = 'local'`.
Isi jurnal **tidak** dikirim ke D1; server hanya menyimpan akun, tier, order.

## 2. Aliran data jurnal

```
Jurnal (input)                    Beranda (ringkasan)              Buku / PDF
      │                                   │                            │
      └──────────► habitStore ◄───────────┘                            │
                    (satu pintu)                                       │
                       │                                               │
        bunda_{week}_{day}_suplemen | _hidrasi | _jasmani              │
                       │                                               │
                       └──────────► getWeekHabits(week) ───────────────┘
```

- `habitStore.ts` — sumber tunggal kebiasaan harian + event `bunda_habits_updated`.
- `bookPages.ts` — peta 50 spread/100 halaman, satu sumber untuk preview & cetak.
- `imageResize.ts` — kompresi foto cetak (maks 1600 px).
- `driveBackup.ts` — backup JSON ke Drive user (butuh consent Google).
- `authClient.ts` — sesi, pull/push (tidak aktif di mode lokal), snapshot restore.

## 3. File map

| Area | File | Ukuran | Catatan |
|---|---|---|---|
| Shell | `src/App.tsx` | 48 KB | state global + routing manual |
| Jurnal | `src/components/TabJurnal.tsx` | 129 KB | UI + state + canvas + logika |
| Studio | `src/components/bookPrint/PrintBookStudio.tsx` | 55 KB | preview & kontrol cetak |
| Buku | `src/components/bookPrint/pages/*` | 26–35 KB | 7 komponen halaman |
| Cetak | `PrintBookView.tsx` + `index.css` | 10 KB | route `/#/print` |
| Beranda | `TabHome.tsx`, `dashboard/*` | 19–30 KB | widget cerita + chart |
| Profil | `TabProfil.tsx` | 46 KB | backup, restore, pengaturan |
| Domain | `lib/habitStore.ts`, `lib/bookPages.ts` | 4–5 KB | inti yang sehat |
| Legacy | `src/utils/_legacy/JournalPdfDocument.tsx` | 122 KB | arsip, tidak dipakai |
| Tes | `tests/e2e`, `tests/visual` | — | Chromium + WebKit |

## 4. Yang sudah sehat

1. **Satu sumber layout buku.** Preview dan PDF memakai komponen halaman yang sama.
2. **Habit store** sebagai kontrak data; UI baru tinggal memanggilnya.
3. **Mode lokal** eksplisit lewat config, bukan tersebar di banyak `if`.
4. **E2E + visual baseline + CI** ada sebelum rilis.
5. **Restore aman**: snapshot sebelum data ditimpa + tombol undo.

## 5. Utang teknis (urut risiko)

### P0 — berpotensi kehilangan data

| Masalah | Dampak | Arah perbaikan |
|---|---|---|
| Foto base64 di `localStorage` | kuota ~5 MB; foto USG besar → simpan gagal; iOS bisa evict | pindah ke IndexedDB/OPFS, simpan hanya referensi di localStorage |
| Tidak ada versi skema | perubahan struktur key = data lama tak terbaca | `bunda_schema_version` + migrasi bertahap saat boot |
| 179 titik `localStorage` langsung | tidak konsisten, sulit diaudit | satu modul `storage/` dengan get/set bertipe |

**Status 14 Nov 2026:** ketiga baris sudah dikerjakan —
`src/lib/mediaStore.ts` (foto & bab buku → IndexedDB), `src/lib/schemaMigration.ts`
(`bunda_schema_version` + migrasi index hari), dan `src/lib/storage/appStorage.ts`
(satu pintu akses data). Audit menyisakan 58 pemanggilan di file arsip `_legacy`
+ 21 di file WIP yang belum di-commit (payments/auth/onboarding).

### P1 — menghambat perubahan

| Masalah | Dampak |
|---|---|
| `TabJurnal.tsx` 129 KB | sulit dites, efek samping tak terlihat |
| `App.tsx` 48 KB memegang semua state | re-render boros, logika tersebar |
| Routing manual (`pathname`/`hash`) | perilaku navigasi tidak standar |

### P2 — performa & kualitas

- Bundle 921 KB satu chunk → code-split route cetak & chart.
- 45 `: any`; `strict` belum penuh.
- Belum ada unit test untuk `habitStore`/`bookPages`.

## 6. Rencana refactor (tanpa menghentikan fitur)

### Fase 1 — Data safety (1–2 hari)

1. `src/storage/` baru: `keys.ts` (tipe key), `read.ts`, `write.ts`, `migrate.ts`.
2. `bunda_schema_version = 1`; migrasi dijalankan sekali saat boot.
3. Foto → IndexedDB (`bunda_journal_db/photos`), localStorage hanya `{ id, caption }`.
4. Guard kuota: kalau `QuotaExceededError`, tampilkan pesan + tawarkan ekspor.

Kriteria selesai: simpan 30 foto besar tanpa error; data lama termigrasi; E2E hijau.

### Fase 2 — Pecah monolit (2–3 hari)

1. `TabJurnal` → `journal/DailyNoteCard`, `journal/AppointmentCard`, `journal/StatsCard`,
   `journal/ArchiveSection`, `journal/HistoryCard`.
2. State App → `AppStateProvider` (Context + reducer) untuk tab, week, profil, tier.
3. Semua akses data lewat hook (`useHabits`, `useJournalNote`, `useAppointment`).

Kriteria selesai: tidak ada file > 25 KB; E2E + visual tetap lulus.

### Fase 3 — Performa & tipe (1–2 hari)

1. `React.lazy` untuk `/#/print`, `TabJurnal`, chart.
2. `strict: true` untuk file baru; `any` diturunkan bertahap.
3. Unit test: `habitStore` (5 kasus), `bookPages` (peta 50 spread), `clampDailyNote` (emoji).

## 7. Yang sebaiknya TIDAK dilakukan

- **Rewrite total** atau pindah framework — tidak sepadan risikonya.
- **Ganti localStorage sekaligus** ke IndexedDB untuk semua key — bertahap saja.
- **Menyalakan gate tier Essential** tanpa keputusan produk.
- **Menghapus backup JSON** meski Drive aktif — file milik user adalah jaring terakhir.

## 8. Prinsip yang dipegang

1. Satu pintu per domain data (`habitStore`, nanti `storage/`).
2. Preview = hasil cetak; tidak ada layout kedua.
3. Fitur baru wajib punya E2E atau unit test.
4. Data user tidak dikirim ke server kita (mode lokal).
5. Perubahan besar harus bisa dibatalkan (snapshot/undo).
