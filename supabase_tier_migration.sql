-- Tier output 49k vs 129k: starter default, existing user set lengkap biar gak keganggu.
-- Input Bab 1-5 tetap bebas untuk semua tier; gate cuma di output (export/cetak/voice).
-- Jalankan di Supabase SQL Editor setelah project siap.

-- 1. Kolom tier di profil (starter = 49k, lengkap = 129k)
alter table public.bunda_profiles
  add column if not exists tier text not null default 'starter'
  check (tier in ('starter', 'lengkap'));

-- 2. Existing user naik ke lengkap (bayar awal = full akses, jangan kunci output mereka)
update public.bunda_profiles set tier = 'lengkap' where tier = 'starter';

-- 3. Register email-only MVP: consent promo MPASI + baby_dob dari Bab 4 Kelahiran
alter table public.bunda_profiles
  add column if not exists promo_consent boolean not null default true;
alter table public.bunda_profiles
  add column if not exists baby_dob date;
alter table public.bunda_profiles
  add column if not exists midtrans_customer_id text default '';

-- 4. Export CSV segmentasi app 0-1 tahun (jalan manual di Table Editor):
-- SELECT mom_name, baby_dob FROM public.bunda_profiles
--  WHERE baby_dob <= CURRENT_DATE - interval '2 months' AND promo_consent = true;

-- 5. RLS policy untuk kolom baru (ikuti policy anon existing)
-- (policy "Allow all actions for anon users" sudah cover semua kolom, tak perlu policy baru)
