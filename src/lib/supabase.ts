import { storageGet } from './storage/appStorage';
import { createClient } from '@supabase/supabase-js';
import { getToken } from './authClient';

// Ambil credential dari environment variables Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wjxpbacoidyhavrfwgfu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zj8Q-QrhI0q5Zv085RyLjA_mFyeSTNL';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper sinkronisasi profil Bunda
export async function syncProfileToSupabase(profile: any) {
  if (!supabase) return { error: 'Supabase not configured' };
  try {
    // Non-blocking fire and forget
    supabase
      .from('bunda_profiles')
      .upsert({
        mom_name: profile.name || '',
        dad_name: profile.partnerName || '',
        baby_nickname: profile.babyNickname || '',
        due_date: profile.hplDate || null,
        current_week: profile.currentWeek || 1,
        updated_at: new Date().toISOString(),
      })
      .select()
      .then(
        ({ data, error }) => {
          if (error) console.warn('Supabase sync error:', error);
        },
        (err) => console.warn('Supabase profile sync catch:', err)
      );
    
    return { status: 'dispatched' };
  } catch (err) {
    console.warn('Gagal sync profil ke Supabase:', err);
    return { error: err };
  }
}

// Helper simpan catatan jurnal
export async function saveJournalEntryToSupabase(weekNumber: number, journalData: any) {
  if (!supabase) return { error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase
      .from('bunda_journal_entries')
      .upsert({
        week_number: weekNumber,
        notes: journalData.text || journalData.notes || '',
        symptoms: journalData.symptoms || [],
        mood: journalData.mood || 3,
        doctor_notes: journalData.doctorNotes || '',
        updated_at: new Date().toISOString(),
      })
      .select();
    return { data, error };
  } catch (err) {
    console.warn('Gagal sync jurnal ke Supabase:', err);
    return { error: err };
  }
}

// Helper signInWithGoogle (hanya minta scope email)
export async function signInWithGoogleOAuth() {
  if (!supabase) return { error: 'Supabase client belum terkonfigurasi' };
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'email',
        redirectTo: window.location.origin,
      },
    });
    return { data, error };
  } catch (err) {
    console.warn('Gagal OAuth Google:', err);
    return { error: err };
  }
}

// Helper sinkronisasi tier langganan & status pembayaran (Essential / VIP)
export async function syncSubscriptionToSupabase(email: string, tier: 'essential' | 'vip', amount: number) {
  // VERIFIKASI DULU: tier/amount tidak boleh ditulis ke mana pun sebelum server
  // (D1 /api/subscription) mengonfirmasi is_paid. Gagal verify = tidak sync apa pun.
  let verifiedTier: 'essential' | 'vip' | null = null;
  let verifiedAmount = amount;
  try {
    const check = await fetch(`/api/subscription?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
    const data: any = await check.json();
    if (check.ok && data && data.ok && data.is_paid && (data.tier === 'vip' || data.tier === 'essential')) {
      verifiedTier = data.tier;
      verifiedAmount = Number(data.amount) || amount;
    }
  } catch (verifyErr) {
    console.warn('D1 subscription verify catch:', verifyErr);
  }
  if (!verifiedTier) {
    console.warn('Subscription sync dilewati: pembayaran belum terverifikasi server.', email);
    return { status: 'skipped_unverified' };
  }

  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`; // sesi D1: divalidasi server

  // 1. Sync ke Cloudflare D1 via /api/subscription (Edge native, non-paused)
  try {
    fetch('/api/subscription', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, tier: verifiedTier, amount: verifiedAmount, is_paid: true }),
    }).catch((e) => console.warn('D1 syncSubscription catch:', e));
  } catch (err) {
    console.warn('D1 sync error:', err);
  }

  if (!supabase) return { status: 'dispatched_d1' };
  try {
    supabase
      .from('bunda_subscriptions')
      .upsert({
        user_email: email,
        tier: verifiedTier, // hasil verifikasi server, bukan input client
        amount_paid: verifiedAmount,
        is_paid: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_email' })
      .select()
      .then(
        ({ data, error }) => {
          if (error) console.warn('Supabase subscription sync error:', error);
        },
        (err) => console.warn('Supabase subscription sync catch:', err)
      );

    return { status: 'dispatched' };
  } catch (err) {
    console.warn('Gagal sync subscription ke Supabase (fallback ke lokal):', err);
    return { error: err };
  }
}

// Helper pengecekan tier dari Cloudflare D1 (dengan fallback Supabase)
export async function fetchUserTierFromSupabase(email: string): Promise<'essential' | 'vip' | 'none'> {
  if (!email) return 'none';
  // 1. Coba dari Cloudflare D1 (/api/subscription) — bebas pause
  try {
    const res = await fetch(`/api/subscription?email=${encodeURIComponent(email)}`);
    if (res.ok) {
      const data: any = await res.json();
      if (data && data.is_paid) {
        return data.tier === 'vip' ? 'vip' : 'essential';
      }
      if (data && data.exists && !data.is_paid) {
        return 'none';
      }
    }
  } catch (d1Err) {
    console.warn('Gagal fetch tier dari D1, fallback ke Supabase:', d1Err);
  }

  // 2. Fallback Supabase jika D1 belum terjangkau
  if (!supabase) return 'none';
  try {
    const { data, error } = await supabase
      .from('bunda_subscriptions')
      .select('tier, is_paid')
      .eq('user_email', email)
      .maybeSingle();

    if (error || !data || !data.is_paid) {
      return 'none';
    }
    return data.tier === 'vip' ? 'vip' : 'essential';
  } catch (err) {
    console.warn('Gagal fetch tier dari Supabase:', err);
    return 'none';
  }
}

// Register email-only MVP: magic link Supabase Auth, langsung masuk Beranda tanpa OTP.
// Verified auto via email link; consent + tier disimpan di public.users (lihat supabase_tier_migration.sql).
// ponytail: pindah ke signInWithOtp resmi saat domain email pengirim stabil,
// tambah saat butuh verifikasi anti-spam server-side.
export async function sendMagicLink(email: string) {
  if (!supabase || !email) return { error: 'Supabase not configured' };
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) console.warn('Magic link error (fallback lokal tetap login):', error.message);
    return { error };
  } catch (err) {
    console.warn('Gagal kirim magic link (fallback lokal tetap login):', err);
    return { error: err };
  }
}

// Simpan/refresh baby_dob dari Bab 4 Kelahiran untuk segmentasi promo 0-1th.
// Query CSV nanti: WHERE baby_dob <= NOW() - interval '2 months' AND consent = true.
export async function syncBabyDobToSupabase(email: string, babyDob: string) {
  if (!supabase || !email || !babyDob) return { error: 'missing params' };
  try {
    const consent = (() => {
      try { return storageGet('bunda_promo_consent') !== 'false'; } catch { return true; }
    })();
    const { error } = await supabase
      .from('bunda_profiles')
      .upsert({
        mom_name: email,
        baby_dob: babyDob,
        promo_consent: consent,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'mom_name' });
    if (error) console.warn('Supabase baby_dob sync error:', error);
    return { error };
  } catch (err) {
    console.warn('Gagal sync baby_dob:', err);
    return { error: err };
  }
}
