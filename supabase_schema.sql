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

-- Policy sederhana untuk public/anon access sementara
create policy "Allow all actions for anon users" on public.bunda_profiles for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.bunda_journal_entries for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.bunda_photos for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.bunda_health_trackers for all using (true) with check (true);
