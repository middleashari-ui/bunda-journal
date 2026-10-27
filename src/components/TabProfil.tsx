import React, { useState, useRef } from 'react';
import { UserProfile, JournalEntry, PhotoMemory, HabitState, ReminderSettings } from '../types';
import { playGentleChime, requestNotificationPermission, sendSystemNotification } from '../utils/notifications';
import { 
  ColorThemeId, 
  APP_COLOR_THEMES, 
  ColorThemeOption, 
  applyAppColorTheme, 
  getSavedAppColorTheme 
} from '../utils/themeManager';
import { 
  User, 
  Cloud, 
  RefreshCw, 
  Check, 
  Bell, 
  Globe, 
  Palette, 
  LogOut, 
  Edit3, 
  Download, 
  Upload, 
  Heart, 
  Timer, 
  Activity, 
  Calendar,
  Stethoscope,
  X,
  Clock,
  Pill,
  Volume2,
  BellRing,
  Camera
} from 'lucide-react';

interface TabProfilProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  reminderSettings: ReminderSettings;
  setReminderSettings: React.Dispatch<React.SetStateAction<ReminderSettings>>;
  onShowToast?: (message: string) => void;
  isSyncing: boolean;
  syncSuccess: boolean;
  onSync: () => void;
  onLogout: () => void;
  journalEntries: JournalEntry[];
  photos: PhotoMemory[];
  habits: HabitState;
}

export const TabProfil: React.FC<TabProfilProps> = ({
  userProfile,
  setUserProfile,
  notificationsEnabled,
  setNotificationsEnabled,
  reminderSettings,
  setReminderSettings,
  onShowToast,
  isSyncing,
  syncSuccess,
  onSync,
  onLogout,
  journalEntries,
  photos,
  habits,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editDoctor, setEditDoctor] = useState(userProfile.doctorName);
  const [editHpl, setEditHpl] = useState(userProfile.hplDate);
  const [editHospital, setEditHospital] = useState(userProfile.hospitalName);

  // Profile Photo Upload Ref & Handler
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedColorTheme, setSelectedColorTheme] = useState<ColorThemeId>(getSavedAppColorTheme);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (onShowToast) onShowToast('Ukuran foto profil maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setUserProfile(prev => ({
          ...prev,
          avatar: dataUrl,
        }));
        if (onShowToast) {
          onShowToast('Foto profil Bunda berhasil diperbarui');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Kick Counter State
  const [showKickCounter, setShowKickCounter] = useState(false);
  const [kicksCount, setKicksCount] = useState(0);

  // Contraction Timer State
  const [showContractionTimer, setShowContractionTimer] = useState(false);
  const [isContractionRunning, setIsContractionRunning] = useState(false);
  const [contractionSeconds, setContractionSeconds] = useState(0);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUserProfile({
      ...userProfile,
      name: editName,
      doctorName: editDoctor,
      hplDate: editHpl,
      hospitalName: editHospital,
    });
    setIsEditingProfile(false);
  };

  // Export all user data as JSON file (Real Local-First data portability!)
  const handleExportData = () => {
    let usgRecords = [];
    try {
      const raw = localStorage.getItem('bunda_fetal_usg_records');
      if (raw) usgRecords = JSON.parse(raw);
    } catch {
      // ignore
    }

    const backupData = {
      profile: userProfile,
      currentWeek: Number(localStorage.getItem('bunda_week') || 12),
      journalEntries,
      photos,
      habits,
      reminderSettings,
      fetalUsgRecords: usgRecords,
      exportedAt: new Date().toISOString(),
      appName: 'Bunda Journal - UnaChaaan',
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bunda-journal-unachaaan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) {
      onShowToast('Cadangan data berhasil diekspor dan diunduh');
    }
  };

  return (
    <div className="px-5 py-4 space-y-4">
      {/* User Avatar & Due Date Info */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/60 shadow-xs text-center relative overflow-hidden">
        <button 
          onClick={() => {
            setEditName(userProfile.name);
            setEditDoctor(userProfile.doctorName);
            setEditHpl(userProfile.hplDate);
            setEditHospital(userProfile.hospitalName);
            setIsEditingProfile(true);
          }}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors cursor-pointer"
          title="Ubah Profil"
        >
          <Edit3 className="w-4 h-4" />
        </button>

        {/* Hidden File Input for Avatar */}
        <input 
          type="file" 
          ref={avatarInputRef} 
          accept="image/*" 
          onChange={handleAvatarUpload} 
          className="hidden" 
        />

        {/* Interactive Avatar Upload Button */}
        <div className="relative inline-block mx-auto mb-3">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="group relative w-20 h-20 rounded-full bg-stone-200 border-4 border-[#C87A64]/30 overflow-hidden shadow-xs cursor-pointer block focus:outline-hidden hover:ring-2 hover:ring-[#556B2F] transition-all"
            title="Klik untuk mengunggah atau mengganti foto profil"
          >
            <img 
              src={userProfile.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80"} 
              alt={userProfile.name} 
              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
              onError={(e) => {
                (e.target as HTMLElement).src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80";
              }}
            />
            {/* Subtle hover overlay */}
            <div className="absolute inset-0 bg-black/45 backdrop-blur-2xs opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200">
              <Camera className="w-5 h-5 mb-0.5 text-stone-100" />
              <span className="text-[9px] font-sans font-medium">Ubah</span>
            </div>
          </button>
          
          {/* Badge at bottom right */}
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white text-stone-700 shadow-md border border-stone-200 flex items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors"
            title="Unggah Foto Profil"
          >
            <Camera className="w-3 h-3 text-[#556B2F]" />
          </button>
        </div>

        <h3 className="font-serif text-lg font-bold text-stone-850">
          {userProfile.name}
        </h3>
        <p className="text-xs text-stone-500 font-light">
          Calon Ibu Hebat • Trimester 1
        </p>

        <div className="mt-4 p-3 bg-[#FAF8F5] rounded-2xl border border-stone-200/60 flex items-center justify-around text-xs">
          <div>
            <span className="block text-[10px] text-stone-400 uppercase tracking-wider">Perkiraan Lahir (HPL)</span>
            <span className="font-serif font-bold text-[#C87A64] text-sm">{userProfile.hplDate}</span>
          </div>
          <div className="w-px h-7 bg-stone-200"></div>
          <div>
            <span className="block text-[10px] text-stone-400 uppercase tracking-wider">Dokter Obgyn</span>
            <span className="font-serif font-bold text-stone-800 text-sm">{userProfile.doctorName}</span>
          </div>
        </div>
      </div>

      {/* Cloud & Safety: Auto-Sync to Google Drive */}
      <div className="bg-stone-900 border border-stone-800 text-white p-5 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[#E59882]">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-bold text-white">Cadangan Google Drive</h4>
            <p className="text-[11px] text-stone-300 font-light">Jaga keamanan data kenangan bila ganti HP</p>
          </div>
        </div>

        <button 
          onClick={onSync}
          disabled={isSyncing}
          className={`w-full mt-3 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            syncSuccess 
              ? 'bg-emerald-600 text-white' 
              : 'bg-white text-stone-900 hover:bg-stone-100 active:scale-98'
          }`}
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-stone-600" />
              <span>Sedang Menyinkronkan...</span>
            </>
          ) : syncSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Tersinkron ke Google Drive!</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-[#556B2F]" />
              <span>Sinkronkan ke Google Drive Sekarang</span>
            </>
          )}
        </button>

        <div className="mt-3 pt-2.5 border-t border-stone-700/60 flex items-center justify-between text-[11px] text-stone-400">
          <span>Penyimpanan Lokal: {journalEntries.length} catatan, {photos.length} foto</span>
          <button 
            onClick={handleExportData}
            className="text-stone-300 hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Ekspor JSON</span>
          </button>
        </div>
      </div>

      {/* Helpful Pregnancy Tools */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/60 shadow-xs space-y-2.5">
        <h4 className="font-serif text-xs font-bold text-stone-800 uppercase tracking-wider">
          Fitur Bantuan Cepat Bunda
        </h4>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowKickCounter(true)}
            className="p-3 bg-[#FAF8F5] rounded-2xl border border-stone-200/60 text-left hover:border-[#556B2F]/40 transition-all cursor-pointer"
          >
            <Heart className="w-4 h-4 text-[#C87A64] mb-1" />
            <p className="text-xs font-bold text-stone-800">Hitung Tendangan</p>
            <p className="text-[10px] text-stone-400 font-light">Catat keaktifan gerak si kecil</p>
          </button>

          <button
            onClick={() => setShowContractionTimer(true)}
            className="p-3 bg-[#FAF8F5] rounded-2xl border border-stone-200/60 text-left hover:border-[#556B2F]/40 transition-all cursor-pointer"
          >
            <Timer className="w-4 h-4 text-[#556B2F] mb-1" />
            <p className="text-xs font-bold text-stone-800">Timer Kontraksi</p>
            <p className="text-[10px] text-stone-400 font-light">Durasi & interval kontraksi</p>
          </button>
        </div>
      </div>

      {/* Notification & Preferences Settings */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/60 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <h4 className="font-serif text-xs font-bold text-stone-800 uppercase tracking-wider">
            Pengingat Harian & Habit Bunda
          </h4>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            reminderSettings.enabled ? 'bg-[#556B2F]/15 text-[#556B2F]' : 'bg-stone-100 text-stone-500'
          }`}>
            {reminderSettings.enabled ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            <BellRing className={`w-4 h-4 ${reminderSettings.enabled ? 'text-[#556B2F]' : 'text-stone-400'}`} />
            <div>
              <p className="text-xs font-semibold text-stone-850">Alarm Pengingat Otomatis</p>
              <p className="text-[10px] text-stone-500">Notifikasi minum vitamin & habit tracking</p>
            </div>
          </div>
          <button 
            onClick={() => {
              const nextVal = !reminderSettings.enabled;
              setReminderSettings(prev => ({ ...prev, enabled: nextVal }));
              setNotificationsEnabled(nextVal);
              if (onShowToast) onShowToast(nextVal ? 'Pengingat harian diaktifkan' : 'Pengingat harian dinonaktifkan');
            }}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
              reminderSettings.enabled ? 'bg-[#556B2F]' : 'bg-stone-300'
            }`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ease-in-out ${
              reminderSettings.enabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Time Settings */}
        {reminderSettings.enabled && (
          <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-stone-200/70 space-y-2.5">
            {/* Vitamin Reminder Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-3.5 h-3.5 text-[#C87A64]" />
                <div>
                  <p className="text-xs font-medium text-stone-800">Jadwal Minum Vitamin</p>
                  <p className="text-[10px] text-stone-400">Asam folat & zat besi</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <input 
                  type="time" 
                  value={reminderSettings.vitaminTime}
                  onChange={(e) => {
                    setReminderSettings(prev => ({ ...prev, vitaminTime: e.target.value }));
                  }}
                  className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-sans text-stone-800 focus:outline-[#556B2F]"
                />
                <span className="text-[10px] text-stone-400">WIB</span>
              </div>
            </div>

            {/* Journal Reminder Time */}
            <div className="flex items-center justify-between border-t border-stone-200/60 pt-2">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#556B2F]" />
                <div>
                  <p className="text-xs font-medium text-stone-800">Jadwal Jurnal & Tidur</p>
                  <p className="text-[10px] text-stone-400">Refleksi harian & istirahat</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <input 
                  type="time" 
                  value={reminderSettings.journalTime}
                  onChange={(e) => {
                    setReminderSettings(prev => ({ ...prev, journalTime: e.target.value }));
                  }}
                  className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-sans text-stone-800 focus:outline-[#556B2F]"
                />
                <span className="text-[10px] text-stone-400">WIB</span>
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between border-t border-stone-200/60 pt-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-xs text-stone-700">Lonceng Pengingat Lembut</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !reminderSettings.soundEnabled;
                  setReminderSettings(prev => ({ ...prev, soundEnabled: nextVal }));
                  if (nextVal) playGentleChime();
                }}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  reminderSettings.soundEnabled ? 'bg-[#556B2F]' : 'bg-stone-300'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                  reminderSettings.soundEnabled ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Test Button & Browser Permission */}
            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (reminderSettings.soundEnabled) playGentleChime();
                  const perm = await requestNotificationPermission();
                  if (perm === 'granted') {
                    sendSystemNotification('Pengingat Vitamin Bunda', 'Saatnya minum vitamin kehamilan & asupan air hari ini!');
                  }
                  if (onShowToast) onShowToast('Uji pengingat & lonceng berhasil dijalankan');
                }}
                className="w-full py-1.5 px-3 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bell className="w-3 h-3 text-[#556B2F]" />
                <span>Uji Notifikasi & Alarm Sekarang</span>
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-stone-100 pt-2 flex items-center justify-between text-xs text-stone-700 py-1">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-stone-600" />
            <span>Bahasa Aplikasi</span>
          </div>
          <span className="text-stone-400 font-medium">Bahasa Indonesia</span>
        </div>

        <div className="border-t border-stone-100 pt-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-stone-700">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#556B2F]" />
              <span className="font-semibold text-stone-850">Variasi Tema Warna</span>
            </div>
            <span className="text-[10px] text-stone-400 font-sans">
              Clean Editorial
            </span>
          </div>

          {/* 3 Theme Options (Sage Green, Warm Sand, Soft Rose) */}
          <div className="grid grid-cols-3 gap-2 pt-0.5">
            {(Object.values(APP_COLOR_THEMES) as ColorThemeOption[]).map((theme) => {
              const isSelected = selectedColorTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    setSelectedColorTheme(theme.id);
                    applyAppColorTheme(theme.id);
                    if (onShowToast) {
                      onShowToast(`Tema diubah menjadi ${theme.name}`);
                    }
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#556B2F] bg-[#FAF8F5] ring-1 ring-[#556B2F]/30 shadow-xs'
                      : 'border-stone-200/80 bg-white hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs inline-block"
                      style={{ backgroundColor: theme.swatchHex }} 
                    />
                    {isSelected && (
                      <Check className="w-3 h-3 text-[#556B2F]" />
                    )}
                  </div>
                  <div>
                    <p className={`text-[11px] font-serif font-bold ${isSelected ? 'text-stone-900' : 'text-stone-700'}`}>
                      {theme.name}
                    </p>
                    <p className="text-[8.5px] text-stone-400 font-light truncate">
                      {theme.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logout / Switch User */}
      <div className="pt-2 pb-4">
        <button 
          onClick={onLogout}
          className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-2xl border border-rose-200/80 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>Keluar Akun (Logout)</span>
        </button>
        <p className="text-[10px] text-stone-400 mt-2 text-center">Bunda Journal v2.4 • Data Tersimpan Aman di Perangkat</p>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-100">
              <h3 className="font-serif text-base font-bold text-stone-850">
                Ubah Profil Bunda
              </h3>
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 font-medium mb-1">Nama Bunda</label>
                <input 
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#556B2F] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Hari Perkiraan Lahir (HPL)</label>
                <input 
                  type="text"
                  placeholder="Contoh: 18 Mei 2025"
                  value={editHpl}
                  onChange={(e) => setEditHpl(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#556B2F] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Nama Dokter Obgyn</label>
                <input 
                  type="text"
                  placeholder="Contoh: dr. Anita, Sp.OG"
                  value={editDoctor}
                  onChange={(e) => setEditDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#556B2F] focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#556B2F] text-white font-medium hover:bg-[#465926] cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kick Counter Modal */}
      {showKickCounter && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-stone-200 text-center">
            <div className="flex justify-between items-center mb-4">
              <span className="font-serif font-bold text-stone-800 text-sm">Hitung Gerak Janin</span>
              <button onClick={() => setShowKickCounter(false)} className="text-stone-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500 mb-4">
              Ketuk tombol hati setiap kali si kecil terasa menendang atau bergerak.
            </p>

            <button
              onClick={() => setKicksCount(c => c + 1)}
              className="w-28 h-28 mx-auto rounded-full bg-[#C87A64]/15 border-4 border-[#C87A64] text-[#C87A64] flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer shadow-md mb-4"
            >
              <Heart className="w-8 h-8 fill-[#C87A64] mb-1" />
              <span className="font-serif text-2xl font-bold">{kicksCount}</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setKicksCount(0)}
                className="flex-1 py-2 text-xs border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setShowKickCounter(false)}
                className="flex-1 py-2 text-xs bg-[#556B2F] text-white rounded-xl font-medium cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contraction Timer Modal */}
      {showContractionTimer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-stone-200 text-center">
            <div className="flex justify-between items-center mb-3">
              <span className="font-serif font-bold text-stone-800 text-sm">Timer Kontraksi</span>
              <button onClick={() => setShowContractionTimer(false)} className="text-stone-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500 mb-4">
              Mulai timer saat kontraksi datang dan tekan berhenti saat reda.
            </p>

            <div className="py-4 font-sans text-3xl font-bold text-stone-800 tracking-wider">
              00:{contractionSeconds.toString().padStart(2, '0')}
            </div>

            <button
              onClick={() => {
                if (isContractionRunning) {
                  setIsContractionRunning(false);
                } else {
                  setIsContractionRunning(true);
                  setContractionSeconds(1);
                  const timer = setInterval(() => {
                    setContractionSeconds(prev => {
                      if (prev >= 60) {
                        clearInterval(timer);
                        setIsContractionRunning(false);
                        return 0;
                      }
                      return prev + 1;
                    });
                  }, 1000);
                }
              }}
              className={`w-full py-3 rounded-2xl text-xs font-semibold mb-2 transition-colors cursor-pointer text-white ${
                isContractionRunning ? 'bg-rose-600' : 'bg-[#556B2F]'
              }`}
            >
              {isContractionRunning ? 'Hentikan Kontraksi' : 'Mulai Kontraksi'}
            </button>

            <button
              onClick={() => {
                setIsContractionRunning(false);
                setContractionSeconds(0);
                setShowContractionTimer(false);
              }}
              className="text-xs text-stone-400 hover:text-stone-600 py-1"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
