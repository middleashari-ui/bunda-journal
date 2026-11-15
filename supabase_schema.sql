-- Schema Database Bunda Journal untuk Supabase
-- Jalankan query ini di SQL Editor Supabase setelah project dibuat

-- 1. Tabel Profil Pengguna / Bunda
create table if not exists public.bunda_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  mom_name text not null default '',
  dad_name text default '',
  baby_nickname text default '',
  due_date date,
  current_week integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Tabel Catatan Jurnal Harian & Mingguan (100 Halaman)
create table if not exists public.bunda_journal_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.bunda_profiles(id) on delete cascade,
  week_number integer not null,
  day_number integer default 1,
  notes text default '',
  symptoms jsonb default '[]'::jsonb,
  mood integer default 3,
  weight_kg numeric(5,2),
  belly_size_cm numeric(5,2),
  blood_pressure text default '',
  doctor_notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(profile_id, week_number, day_number)
);

-- 3. Tabel Galeri Foto USG & Kenangan
create table if not exists public.bunda_photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.bunda_profiles(id) on delete cascade,
  week_number integer not null,
  photo_url text not null,
  caption text default '',
  photo_type text default 'usg', -- 'usg' | 'bump' | 'memory'
  created_at timestamptz default now()
);

-- 4. Tabel Pelacak Kesehatan (Air Minum & Suplemen)
create table if not exists public.bunda_health_trackers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.bunda_profiles(id) on delete cascade,
  date date not null default current_date,
  water_liters numeric(3,1) default 0,
  supplements jsonb default '[]'::jsonb,
  activity_goals jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique(profile_id, date)
);

-- 5. Row Level Security (RLS) - Data hanya bisa diakses pemiliknya
alter table public.bunda_profiles enable row level security;
alter table public.bunda_journal_entries enable row level security;
alter table public.bunda_photos enable row level security;
alter table public.bunda_health_trackers enable row level security;

-- Kolom pemilik baris (bila belum ada). Tidak ada yang di-drop -> aman untuk
-- skema lama; jalankan sekali, idempoten (IF NOT EXISTS).
alter table public.bunda_profiles add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.bunda_journal_entries add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.bunda_photos add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.bunda_health_trackers add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Ganti policy lama "using (true)" (terbuka untuk semua anon) -> hanya pemilik
-- baris via auth.uid(). Dijalankan per operasi: SELECT / INSERT / UPDATE / DELETE.
-- Catatan: baris lama yang user_id-nya NULL jadi tidak terlihat siapa pun;
-- backfill manual bila perlu, contoh:
--   update public.bunda_profiles set user_id = '<auth-uid>' where user_id is null;

drop policy if exists "Allow all actions for anon users" on public.bunda_profiles;
drop policy if exists "Allow all actions for anon users" on public.bunda_journal_entries;
drop policy if exists "Allow all actions for anon users" on public.bunda_photos;
drop policy if exists "Allow all actions for anon users" on public.bunda_health_trackers;

create policy "profiles_select_own" on public.bunda_profiles
  for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.bunda_profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.bunda_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profiles_delete_own" on public.bunda_profiles
  for delete using (auth.uid() = user_id);

create policy "journal_select_own" on public.bunda_journal_entries
  for select using (auth.uid() = user_id);
create policy "journal_insert_own" on public.bunda_journal_entries
  for insert with check (auth.uid() = user_id);
create policy "journal_update_own" on public.bunda_journal_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "journal_delete_own" on public.bunda_journal_entries
  for delete using (auth.uid() = user_id);

create policy "photos_select_own" on public.bunda_photos
  for select using (auth.uid() = user_id);
create policy "photos_insert_own" on public.bunda_photos
  for insert with check (auth.uid() = user_id);
create policy "photos_update_own" on public.bunda_photos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "photos_delete_own" on public.bunda_photos
  for delete using (auth.uid() = user_id);

create policy "trackers_select_own" on public.bunda_health_trackers
  for select using (auth.uid() = user_id);
create policy "trackers_insert_own" on public.bunda_health_trackers
  for insert with check (auth.uid() = user_id);
create policy "trackers_update_own" on public.bunda_health_trackers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trackers_delete_own" on public.bunda_health_trackers
  for delete using (auth.uid() = user_id);
