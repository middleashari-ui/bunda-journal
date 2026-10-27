import { createClient } from '@supabase/supabase-js';

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
    const { data, error } = await supabase
      .from('bunda_profiles')
      .upsert({
        mom_name: profile.name || '',
        dad_name: profile.partnerName || '',
        baby_nickname: profile.babyNickname || '',
        due_date: profile.hplDate || null,
        current_week: profile.currentWeek || 1,
        updated_at: new Date().toISOString(),
      })
      .select();
    return { data, error };
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
