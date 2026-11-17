# Google Cloud — konfigurasi untuk backup Drive

Project Google yang dipakai aplikasi: **165573930868**
(Client ID `165573930868-104o4nhb5cqbsq8nvmokin08rfi9kof3.apps.googleusercontent.com`).

Diisi di Google Cloud Console (project yang sama dengan login Google).
Tanpa ini, tombol **Backup sekarang** di Profil akan menampilkan
"Google Drive belum dikonfigurasi" atau Google menolak dengan `403 access_denied`.

## 1. API

- APIs & Services → Library → aktifkan **Google Drive API**.
- Pastikan juga **Google Identity Services** bisa dipakai (otomatis, tidak perlu enable).

## 2. OAuth consent screen

- User type: External.
- Scopes:
  - `openid`
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
  - `https://www.googleapis.com/auth/drive.file`  ← **wajib untuk backup**
- Selama status masih **Testing**, hanya akun yang ditambahkan di
  *Test users* yang bisa memberi izin. Tambahkan:
  - `middleashari@gmail.com`
  - tambahkan email Bunda lain yang akan memakai fitur ini (maks. 100 test user).
- Simpan, lalu tunggu 1–5 menit. Perubahan test user tidak perlu deploy ulang.

## 3. OAuth Client (Web application)

- Authorized JavaScript origins:
  - `https://www.bundajournal.my.id`
  - `http://localhost:5173` (dev)
- Authorized redirect URIs (untuk login, bukan Drive):
  - `https://www.bundajournal.my.id/api/auth/google/callback`
  - `http://localhost:8788/api/auth/google/callback` (kalau pakai `wrangler pages dev`)

## 4. Environment

`GOOGLE_CLIENT_ID` harus ada di:

- Cloudflare Pages → Settings → Environment variables (Production & Preview)
- file `.env` lokal (untuk dev):
  ```
  GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
  ```

Client ID **bukan rahasia**; endpoint `/api/google-config` memang mengirimkannya
ke browser supaya Google Identity Services bisa memulai alur Drive.

## 5. Verifikasi cepat

1. Buka `http://localhost:5173/api/google-config` → harus `{"ok":true,"clientId":"..."}`.
2. Di HP/aplikasi: Profil → **Lupakan izin** (menghapus token lama), lalu
   **Tes Izin Google Drive** → popup Google muncul → setujui.
3. Profil → **Backup sekarang** → file `bunda-backup-YYYY-MM-DD.json` muncul di
   folder **Bunda Journal** pada Drive.
4. Klik Backup lagi di hari yang sama → file yang sama harus ter-update, bukan
   bertambah.
5. Pulihkan dari Drive → pilih file → data masuk → kartu "Pemulihan Data Terakhir" tersedia.

Kalau `Tes Izin Google Drive` gagal:
- `403 access_denied` → email yang sedang login di Google **belum** ada di Test
  users, atau app belum di-Publish.
- `popup_closed` → popup ditutup; ulangi dan setujui.
- `google-not-configured` → `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` tidak cocok.
- Hapus izin lama di `myaccount.google.com/permissions` lalu coba lagi.

## 6. Kalau mau rilis ke publik

Scope `drive.file` tergolong *sensitive*. Selama app belum diverifikasi Google,
hanya test user yang bisa memakai fitur ini. Verifikasi biasanya 1–3 minggu.
Sementara itu, backup JSON manual (Ekspor) tetap bisa dipakai semua user.
