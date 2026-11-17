import { storageGet, storageSet, storageRemove, storageClear } from '../lib/storage/appStorage';
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, JournalEntry, PhotoMemory, HabitState, ReminderSettings } from '../types';
import { PRICING_CONFIG } from '../config/pricing';
import { getRestoreSnapshotInfo, undoLastRestore } from '../lib/authClient';
import { getTodayPosition } from '../lib/pregnancyDate';
import { estimateLocalStorageBytes } from '../lib/storageQuota';
import { clearErrorLog, getErrorLog } from '../lib/errorLog';
import {
  backupJournalToDrive,
  getBackupMeta,
  isAutoBackupEnabled,
  setAutoBackupEnabled,
  listDriveBackups,
  downloadBackup,
  DriveBackupMeta,
} from '../lib/driveBackup';
import { playGentleChime, requestNotificationPermission, sendSystemNotification } from '../utils/notifications';
import { AutoFillJournalModal } from './AutoFillJournalModal';
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
  Trash2,
  Sparkles,
  Volume2,
  BellRing,
  Camera,
  RotateCcw,
  ShieldCheck,
  HelpCircle,
  FileText,
  Loader2
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
  onResetAll?: () => void;
  onOpenUpgradeModal?: () => void;
  userTier?: 'essential' | 'vip';
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
  onResetAll,
  onOpenUpgradeModal,
  userTier = 'essential',
  journalEntries,
  photos,
  habits,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Trimester mengikuti posisi minggu saat ini (bukan hardcode).
  const currentTrimester = (() => {
    try {
      const w = getTodayPosition().week;
      return w <= 13 ? 1 : w <= 27 ? 2 : 3;
    } catch {
      return 1;
    }
  })();
  const [editName, setEditName] = useState(userProfile.name);
  const [editDoctor, setEditDoctor] = useState(userProfile.doctorName);
  const [editHpl, setEditHpl] = useState(userProfile.hplDate);
  const [editHospital, setEditHospital] = useState(userProfile.hospitalName);

  // Pemulihan data (snapshot sebelum restore) — dipakai untuk tombol "Batalkan".
  const [restoreInfo, setRestoreInfo] = useState<{ at: string; count: number } | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  // Pemakaian storage sebenarnya (bukan bar 100% statis).
  const [driveMeta, setDriveMeta] = useState<DriveBackupMeta | null>(() => getBackupMeta());
  const [storageUsage, setStorageUsage] = useState<{ used: number; quota: number } | null>(null);
  const [errorLogCount, setErrorLogCount] = useState<number>(() => getErrorLog().length);

  useEffect(() => {
    let alive = true;
    (async () => {
      let used = 0;
      let quota = 0;
      try {
        const est = await navigator.storage?.estimate?.();
        used = Number(est?.usage || 0);
        quota = Number(est?.quota || 0);
      } catch {}
      if (!used) used = estimateLocalStorageBytes();
      if (alive) setStorageUsage({ used, quota });
    })();
    return () => {
      alive = false;
    };
  }, [driveMeta]);

  const fmtBytes = (n: number) =>
    n >= 1073741824 ? `${(n / 1073741824).toFixed(2)} GB` : n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

  const storagePct = storageUsage?.quota
    ? Math.min(100, Math.max(1, Math.round((storageUsage.used / storageUsage.quota) * 100)))
    : 0;

  const backupDays = driveMeta?.at
    ? Math.max(0, Math.floor((Date.now() - new Date(driveMeta.at).getTime()) / 86400000))
    : null;

  const handleDownloadErrorLog = () => {
    try {
      const payload = JSON.stringify(
        { exportedAt: new Date().toISOString(), errors: getErrorLog() },
        null,
        2
      );
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bunda-error-log-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;
    getRestoreSnapshotInfo()
      .then((info) => { if (!cancelled) setRestoreInfo(info); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleUndoRestore = async () => {
    if (isUndoing) return;
    setIsUndoing(true);
    const res = await undoLastRestore();
    setIsUndoing(false);
    if (res.ok) {
      if (onShowToast) onShowToast('Data dikembalikan ke kondisi sebelum pemulihan');
      window.location.reload();
    } else if (onShowToast) {
      onShowToast('Cadangan pemulihan tidak ditemukan');
    }
  };

  // ---- Backup ke Google Drive milik user ----
  const [autoBackup, setAutoBackupState] = useState<boolean>(() => isAutoBackupEnabled());
  const [isDriveBusy, setIsDriveBusy] = useState(false);

  const driveErrorMessage = (reason?: string): string => {
    switch (reason) {
      case 'google-not-configured':
        return 'Google Drive belum dikonfigurasi. Hubungi admin.';
      case 'auth-required':
      case 'auth-failed':
      case 'token-failed':
      case 'token-error':
        return 'Izin Google Drive dibutuhkan. Coba lagi lalu setujui akses.';
      case 'access_denied':
      case 'drive-403':
      case 'drive-update-403':
      case 'drive-create-403':
        return 'Google menolak akses Drive (403). Tambahkan email Bunda sebagai test user di Google Cloud, atau publikasikan aplikasi OAuth.';
      case 'popup_closed':
        return 'Jendela izin Google ditutup. Coba lagi lalu setujui akses.';
      case 'offline':
        return 'Tidak ada koneksi internet.';
      case 'empty':
        return 'Belum ada data untuk dibackup.';
      case 'gsi-load-failed':
        return 'Gagal memuat Google. Periksa koneksi lalu coba lagi.';
      default:
        return reason ? `Backup gagal: ${reason}` : 'Backup gagal. Coba lagi.';
    }
  };

  const handleDriveBackup = async () => {
    if (isDriveBusy) return;
    setIsDriveBusy(true);
    try {
      const res = await backupJournalToDrive({ interactive: true, force: true });
      if (res.ok) {
        setDriveMeta(res.meta || getBackupMeta());
        if (onShowToast) onShowToast(res.skipped ? 'Backup sudah paling baru' : 'Backup ke Google Drive berhasil');
      } else if (onShowToast) {
        onShowToast(driveErrorMessage(res.reason));
      }
    } catch (err: any) {
      if (onShowToast) onShowToast(driveErrorMessage(err?.message));
    } finally {
      setIsDriveBusy(false);
    }
  };

  const handleDriveRestore = async () => {
    if (isDriveBusy) return;
    setIsDriveBusy(true);
    try {
      const files = await listDriveBackups();
      if (!files.length) {
        if (onShowToast) onShowToast('Belum ada file backup di Google Drive');
        return;
      }
      const latest = files[0];
      const when = latest.modifiedTime ? new Date(latest.modifiedTime).toLocaleString('id-ID') : '-';
      const confirmed = window.confirm(
        `Pulihkan data dari "${latest.name}" (${when})?\n\nData saat ini disalin dulu, jadi masih bisa dibatalkan lewat "Batalkan".`
      );
      if (!confirmed) return;
      const res = await downloadBackup(latest.id);
      if (res.ok) {
        if (onShowToast) onShowToast('Data berhasil dipulihkan dari Drive');
        setTimeout(() => window.location.reload(), 900);
      } else if (onShowToast) {
        onShowToast(driveErrorMessage(res.reason));
      }
    } catch (err: any) {
      if (onShowToast) onShowToast(driveErrorMessage(err?.message));
    } finally {
      setIsDriveBusy(false);
    }
  };

  const handleToggleAutoBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setAutoBackupState(next);
    setAutoBackupEnabled(next);
    if (onShowToast) {
      onShowToast(next ? 'Backup otomatis aktif (maks. 1× sehari)' : 'Backup otomatis dimatikan');
    }
  };

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
  const [showAutoFill, setShowAutoFill] = useState(false);
  const [kicksCount, setKicksCount] = useState(0);
  const [kickStartedAt, setKickStartedAt] = useState<Date | null>(null);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderMessage, setNewReminderMessage] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('09:00');
  const [kickHistory, setKickHistory] = useState<Array<{ date: string; start?: string; end?: string; count: number }>>(() => {
    try {
      const parsed = JSON.parse(storageGet('bunda_kick_history') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Contraction Timer State
  const [showContractionTimer, setShowContractionTimer] = useState(false);
  const [isContractionRunning, setIsContractionRunning] = useState(false);
  const [contractionSeconds, setContractionSeconds] = useState(0);
  const [contractionStartedAt, setContractionStartedAt] = useState<Date | null>(null);
  const [contractionHistory, setContractionHistory] = useState<Array<{ date: string; start?: string; end?: string; durationSeconds: number }>>(() => {
    try {
      const parsed = JSON.parse(storageGet('bunda_contraction_history') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const contractionTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveKickHistory = (next: typeof kickHistory) => {
    setKickHistory(next);
    try { storageSet('bunda_kick_history', JSON.stringify(next)); } catch {}
  };

  const saveContractionHistory = (next: typeof contractionHistory) => {
    setContractionHistory(next);
    try { storageSet('bunda_contraction_history', JSON.stringify(next)); } catch {}
  };

  const formatClock = (seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
  };

  const formatHistoryMoment = (iso?: string) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  useEffect(() => {
    return () => {
      if (contractionTimerRef.current) {
        clearInterval(contractionTimerRef.current);
      }
    };
  }, []);

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
      const raw = storageGet('bunda_fetal_usg_records');
      if (raw) usgRecords = JSON.parse(raw);
    } catch {
      // ignore
    }

    const backupData = {
      profile: userProfile,
      currentWeek: Number(storageGet('bunda_week') || 12),
      journalEntries,
      photos,
      habits,
      reminderSettings,
      fetalUsgRecords: usgRecords,
      exportedAt: new Date().toISOString(),
      appName: 'Bunda Journal',
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bunda-journal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) {
      onShowToast('Cadangan data berhasil diekspor dan diunduh');
    }
  };

  // Import JSON backup data
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.profile) storageSet('bunda_user_profile', JSON.stringify(data.profile));
        if (data.currentWeek) storageSet('bunda_week', String(data.currentWeek));
        if (data.journalEntries) storageSet('bunda_journal_entries', JSON.stringify(data.journalEntries));
        if (data.photos) storageSet('bunda_user_photos', JSON.stringify(data.photos));
        if (onShowToast) onShowToast('Data JSON berhasil diimpor & dipulihkan!');
        setTimeout(() => window.location.reload(), 800);
      } catch {
        if (onShowToast) onShowToast('Gagal membaca file JSON backup!');
      }
    };
    reader.readAsText(file);
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
          className="absolute top-4 right-4 p-2 text-stone-600 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors cursor-pointer"
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
            {userProfile.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#C87A64]/15 text-[#A85A44] font-serif text-2xl font-bold">
                {(userProfile.name || 'B').trim().charAt(0).toUpperCase()}
              </div>
            )}
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
          {userProfile.name || 'Bunda'}
        </h3>
        <p className="text-xs text-stone-500 font-light">
          Calon Ibu Hebat • Trimester {currentTrimester}
        </p>

        <div className="mt-4 p-3 bg-[#FAF8F5] rounded-2xl border border-stone-200/60 flex items-center justify-around text-xs">
          <div>
            <span className="block text-[10px] text-stone-600 uppercase tracking-wider">Perkiraan Lahir (HPL)</span>
            <span className="font-serif font-bold text-[#A85A44] text-sm">{userProfile.hplDate || '-'}</span>
          </div>
          <div className="w-px h-7 bg-stone-200"></div>
          <div>
            <span className="block text-[10px] text-stone-600 uppercase tracking-wider">Dokter Obgyn</span>
            <span className="font-serif font-bold text-stone-800 text-sm">{userProfile.doctorName || '-'}</span>
          </div>
        </div>
      </div>

      {/* Membership Tier Status & Upgrade to VIP */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/60 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xs font-bold text-stone-800 uppercase tracking-wider">
              Paket Akun
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                userTier === 'vip'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-[#556B2F]/10 text-[#556B2F] border border-[#556B2F]/20'
              }`}
            >
              {userTier === 'vip' ? 'VIP BUNDLE' : 'ESSENTIAL'}
            </span>
          </div>
          {userTier === 'essential' && onOpenUpgradeModal && (
            <button
              id="btn-upgrade-vip"
              onClick={onOpenUpgradeModal}
              className="px-3 py-1.5 bg-[#556B2F] hover:bg-[#465926] text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <span>Upgrade VIP (+{PRICING_CONFIG.upgrade_vip.label})</span>
            </button>
          )}
        </div>
        <p className="text-[11px] text-stone-500 mt-2">
          {userTier === 'vip'
            ? 'Akun VIP aktif seumur hidup. Termasuk akses penuh 100 halaman, konsultasi prioritas, dan audio voice.'
            : `Akun Essential aktif. Upgrade ke VIP hanya ${PRICING_CONFIG.upgrade_vip.label} (total ${PRICING_CONFIG.vip.label}) tanpa biaya admin.`}
        </p>
      </div>

      {/* Cloud & Safety: Auto-Sync to Google Drive */}
      {/* Storage Bar & Mode Khusus (TC09) */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/60 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-serif text-xs font-bold text-stone-800 uppercase tracking-wider">
            Kapasitas Penyimpanan
          </h4>
          <span className={`text-[10px] font-mono font-semibold ${storagePct >= 85 ? 'text-red-600' : storagePct >= 60 ? 'text-amber-600' : 'text-[#556B2F]'}`}>
            {storageUsage ? fmtBytes(storageUsage.used) : 'menghitung…'}
          </span>
        </div>
        
        {/* Progress Bar — pemakaian sebenarnya */}
        <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${storagePct >= 85 ? 'bg-red-500' : storagePct >= 60 ? 'bg-amber-500' : 'bg-[#556B2F]'}`}
            style={{ width: `${storagePct}%` }}
          ></div>
        </div>
        <p className="text-[10px] text-stone-500 font-medium">
          {storageUsage
            ? `${storagePct}% terpakai${storageUsage.quota ? ` dari ${fmtBytes(storageUsage.quota)}` : ''} · ${storagePct >= 85 ? 'hampir penuh' : storagePct >= 60 ? 'pantau pemakaian' : 'aman'}`
            : 'Menghitung pemakaian penyimpanan…'}
        </p>

        {/* Pengingat backup */}
        <div
          className={`rounded-xl px-3 py-2 text-[10.5px] leading-snug border ${
            backupDays === null || backupDays > 7
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-[#F1F4EA] border-[#E3E9D6] text-[#556B2F]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span>
              {backupDays === null
                ? 'Belum pernah backup — data hanya ada di HP ini.'
                : backupDays === 0
                ? 'Backup terakhir: hari ini.'
                : `Backup terakhir: ${backupDays} hari lalu.`}
            </span>
            {(backupDays === null || backupDays > 7) && (
              <button
                type="button"
                onClick={handleDriveBackup}
                disabled={isDriveBusy}
                className="shrink-0 px-2 py-1 rounded-lg bg-[#556B2F] text-white text-[10px] font-semibold disabled:opacity-50 cursor-pointer"
              >
                {isDriveBusy ? 'Menyiapkan…' : 'Backup'}
              </button>
            )}
          </div>
        </div>

        {/* Diagnostik lokal */}
        <details className="pt-2 border-t border-stone-100">
          <summary className="text-[10px] text-stone-500 cursor-pointer select-none">
            Diagnostik & log error ({errorLogCount})
          </summary>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={handleDownloadErrorLog}
              className="flex-1 py-1.5 rounded-lg border border-stone-200 text-[10px] text-stone-600 hover:bg-stone-50 cursor-pointer"
            >
              Unduh log
            </button>
            <button
              type="button"
              onClick={() => {
                clearErrorLog();
                setErrorLogCount(0);
                if (onShowToast) onShowToast('Log error dibersihkan');
              }}
              className="flex-1 py-1.5 rounded-lg border border-stone-200 text-[10px] text-stone-600 hover:bg-stone-50 cursor-pointer"
            >
              Hapus log
            </button>
          </div>
          <p className="text-[9px] text-stone-600 mt-1.5">
            Log hanya tersimpan di perangkat ini, tidak dikirim ke server.
          </p>
        </details>

        {/* Toggles Mode Ayah & Mode Newborn */}
        <div className="pt-2 border-t border-stone-100 space-y-2">
          <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-2xl opacity-70">
            <div>
              <p className="text-xs font-bold text-stone-800">Mode Ayah (Read Only)</p>
              <p className="text-[10px] text-stone-600">Akses pantau kehamilan tanpa izin edit data</p>
            </div>
            <button 
              disabled
              className="px-2.5 py-1 bg-stone-200 text-stone-500 text-[10px] font-semibold rounded-lg cursor-not-allowed"
            >
              Segera Hadir
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-2xl opacity-70">
            <div>
              <p className="text-xs font-bold text-stone-800">Mode Newborn (0 - 30 Hari)</p>
              <p className="text-[10px] text-stone-600">Beralih ke pemantauan bayi baru lahir & ASI</p>
            </div>
            <button 
              disabled
              className="px-2.5 py-1 bg-stone-200 text-stone-500 text-[10px] font-semibold rounded-lg cursor-not-allowed"
            >
              Segera Hadir
            </button>
          </div>
        </div>
      </div>

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

        <div className="w-full mt-3 py-2 px-4 rounded-xl text-xs font-semibold bg-stone-800 text-stone-300 border border-stone-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-amber-400" />
            {driveMeta
              ? `Terakhir backup: ${new Date(driveMeta.at).toLocaleString('id-ID')}`
              : 'Belum pernah backup ke Drive'}
          </span>
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full font-medium">
            Opsional
          </span>
        </div>

        <p className="text-[10px] text-stone-600 font-light mt-2 leading-relaxed">
          Data Bunda tetap tersimpan di HP ini. File backup hanya dikirim ke{' '}
          <span className="text-stone-200">Google Drive milik Bunda sendiri</span>, bukan server kami.
        </p>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleDriveBackup}
            disabled={isDriveBusy}
            className="flex-1 py-2 px-3 rounded-xl text-[11px] font-semibold bg-[#556B2F] hover:bg-[#465926] text-white disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isDriveBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
            {isDriveBusy ? 'Menyiapkan…' : 'Backup sekarang'}
          </button>
          <button
            onClick={handleDriveRestore}
            disabled={isDriveBusy}
            className="flex-1 py-2 px-3 rounded-xl text-[11px] font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Pulihkan dari Drive
          </button>
        </div>

        <label className="mt-2.5 flex items-center gap-2 text-[11px] text-stone-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoBackup}
            onChange={handleToggleAutoBackup}
            className="w-3.5 h-3.5 accent-[#556B2F]"
          />
          Backup otomatis sekali sehari
        </label>
        <p className="mt-1 text-[10px] text-stone-400 leading-snug">
          Auto backup tidak membuka popup Google. Izin hanya diminta saat Bunda menekan
          “Backup sekarang”.
        </p>

        <div className="mt-3 pt-2.5 border-t border-stone-700/60 flex items-center justify-between text-[11px] text-stone-600">
          <span>Penyimpanan Lokal: {journalEntries.length} catatan, {photos.length} foto</span>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportData}
              className="text-stone-300 hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Ekspor JSON</span>
            </button>
            <label className="text-stone-300 hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer">
              <Upload className="w-3 h-3" />
              <span>Impor JSON</span>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept=".json" 
                onChange={handleImportJSON} 
                className="hidden" 
              />
            </label>
          </div>
        </div>
      </div>

      {/* Pemulihan data: salinan otomatis sebelum data ditimpa dari cloud */}
      {restoreInfo && (
        <div className="bg-white border border-stone-200/60 rounded-3xl p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-serif text-xs font-bold text-stone-800 uppercase tracking-wider">
                Pemulihan Data Terakhir
              </h4>
              <p className="text-[10px] text-stone-500 font-light mt-0.5 leading-relaxed">
                {restoreInfo.count} data disalin otomatis sebelum pemulihan ·{' '}
                {new Date(restoreInfo.at).toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-stone-600 font-light mt-0.5">
                Tersedia 7 hari. Gunakan bila isi jurnal terasa berubah setelah login.
              </p>
            </div>
            <button
              onClick={handleUndoRestore}
              disabled={isUndoing}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-2 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isUndoing ? 'Memulihkan…' : 'Batalkan'}
            </button>
          </div>
        </div>
      )}

      {/* Helpful Pregnancy Tools */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/60 shadow-xs space-y-2.5">
        <h4 className="font-serif text-xs font-bold text-stone-800 uppercase tracking-wider">
          Fitur Bantuan Cepat Bunda
        </h4>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setKicksCount(0);
              setKickStartedAt(new Date());
              setShowKickCounter(true);
            }}
            className="p-3 bg-[#FAF8F5] rounded-2xl border border-stone-200/60 text-left hover:border-[#556B2F]/40 transition-all cursor-pointer"
          >
            <Heart className="w-4 h-4 text-[#A85A44] mb-1" />
            <p className="text-xs font-bold text-stone-800">Hitung Tendangan</p>
            <p className="text-[10px] text-stone-600 font-light">Catat keaktifan gerak si kecil</p>
          </button>

          <button
            onClick={() => {
              setContractionSeconds(0);
              setIsContractionRunning(false);
              setContractionStartedAt(null);
              setShowContractionTimer(true);
            }}
            className="p-3 bg-[#FAF8F5] rounded-2xl border border-stone-200/60 text-left hover:border-[#556B2F]/40 transition-all cursor-pointer"
          >
            <Timer className="w-4 h-4 text-[#556B2F] mb-1" />
            <p className="text-xs font-bold text-stone-800">Timer Kontraksi</p>
            <p className="text-[10px] text-stone-600 font-light">Durasi & interval kontraksi</p>
          </button>
        </div>
      </div>

      {/* Auto-fill jurnal untuk yang join di tengah trimester */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/60 shadow-xs space-y-2">
        <h4 className="font-serif text-xs font-bold text-stone-800 uppercase tracking-wider">
          Bantu Isi Jurnal
        </h4>
        <p className="text-[11px] text-stone-600 leading-relaxed">
          Baru mulai di tengah trimester? Isi contoh kalimat untuk hari yang terlewat.
          Semua kalimat bisa dibaca dan diedit dulu sebelum disimpan.
        </p>
        <button
          type="button"
          onClick={() => setShowAutoFill(true)}
          className="w-full py-2 px-3 bg-[#FAF8F5] hover:bg-[#F3EFE8] border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#556B2F]" />
          Isi otomatis hari yang terlewat
        </button>
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
            <BellRing className={`w-4 h-4 ${reminderSettings.enabled ? 'text-[#556B2F]' : 'text-stone-600'}`} />
            <div>
              <p className="text-xs font-semibold text-stone-850">Alarm Pengingat Otomatis</p>
              <p className="text-[10px] text-stone-500">Notifikasi minum vitamin & habit tracking</p>
            </div>
          </div>
          <button 
            type="button"
            role="switch"
            aria-checked={reminderSettings.enabled}
            aria-label="Alarm pengingat otomatis"
            onClick={() => {
              const nextVal = !reminderSettings.enabled;
              setReminderSettings(prev => ({ ...prev, enabled: nextVal }));
              setNotificationsEnabled(nextVal);
              if (nextVal) {
                // Minta izin saat user menyalakan pengingat (gesture), supaya
                // alarm tidak perlu dites manual dulu.
                void requestNotificationPermission();
                // Hapus penanda hari ini agar jadwal yang sudah lewat tetap
                // memunculkan pop-up setelah pengingat dinyalakan.
                storageRemove('bunda_last_vitamin_date');
                storageRemove('bunda_last_journal_date');
                (reminderSettings.customReminders || []).forEach((item) => {
                  storageRemove(`bunda_last_custom_${item.id}_date`);
                });
              }
              if (onShowToast) onShowToast(nextVal ? 'Pengingat harian diaktifkan' : 'Pengingat harian dinonaktifkan');
            }}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
              reminderSettings.enabled ? 'bg-[#556B2F]' : 'bg-stone-300'
            }`}
          >
            <div aria-hidden="true" className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ease-in-out ${
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
                <Pill className="w-3.5 h-3.5 text-[#A85A44]" />
                <div>
                  <p className="text-xs font-medium text-stone-800">Jadwal Minum Vitamin</p>
                  <p className="text-[10px] text-stone-600">Asam folat & zat besi</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <input 
                  type="time" 
                  aria-label="Jam pengingat minum vitamin"
                  value={reminderSettings.vitaminTime}
                  onChange={(e) => {
                    setReminderSettings(prev => ({ ...prev, vitaminTime: e.target.value }));
                    storageRemove('bunda_last_vitamin_date');
                  }}
                  className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-sans text-stone-800 focus:outline-[#556B2F]"
                />
                <span className="text-[10px] text-stone-600">WIB</span>
              </div>
            </div>

            {/* Journal Reminder Time */}
            <div className="flex items-center justify-between border-t border-stone-200/60 pt-2">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#556B2F]" />
                <div>
                  <p className="text-xs font-medium text-stone-800">Jadwal Jurnal & Tidur</p>
                  <p className="text-[10px] text-stone-600">Refleksi harian & istirahat</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <input 
                  type="time" 
                  aria-label="Jam pengingat jurnal dan tidur"
                  value={reminderSettings.journalTime}
                  onChange={(e) => {
                    setReminderSettings(prev => ({ ...prev, journalTime: e.target.value }));
                    storageRemove('bunda_last_journal_date');
                  }}
                  className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-sans text-stone-800 focus:outline-[#556B2F]"
                />
                <span className="text-[10px] text-stone-600">WIB</span>
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
                role="switch"
                aria-checked={reminderSettings.soundEnabled}
                aria-label="Lonceng pengingat lembut"
                onClick={() => {
                  const nextVal = !reminderSettings.soundEnabled;
                  setReminderSettings(prev => ({ ...prev, soundEnabled: nextVal }));
                  if (nextVal) playGentleChime();
                }}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  reminderSettings.soundEnabled ? 'bg-[#556B2F]' : 'bg-stone-300'
                }`}
              >
                <div aria-hidden="true" className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
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
                    await sendSystemNotification(
                      'Pengingat Vitamin Bunda',
                      `Saatnya minum vitamin kehamilan & asupan air hari ini (${reminderSettings.vitaminTime} WIB).`,
                      { tag: 'bunda-test-vitamin', silent: true }
                    );
                    if (onShowToast) onShowToast('Notifikasi uji dikirim ke perangkat');
                  } else {
                    if (onShowToast) onShowToast('Izin notifikasi diblokir. Aktifkan di pengaturan browser.');
                  }
                }}
                className="w-full py-1.5 px-3 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bell className="w-3 h-3 text-[#556B2F]" />
                <span>Uji Notifikasi & Alarm Sekarang</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new Event('bunda_check_reminders'));
                if (onShowToast) onShowToast('Pengingat dicek. Kalau sudah waktunya, pop-up akan muncul.');
              }}
              className="w-full py-1.5 px-3 bg-[#FAF8F5] hover:bg-white text-stone-700 border border-stone-200 rounded-xl text-[11px] font-medium transition-all cursor-pointer"
            >
              Cek Pengingat Sekarang
            </button>

            {/* Custom notifications */}
            <div className="pt-2 border-t border-stone-200/60 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-600">Notifikasi Custom</p>
                <span className="text-[10px] text-stone-600">{(reminderSettings.customReminders || []).length} pengingat</span>
              </div>

              {(reminderSettings.customReminders || []).map((reminder) => (
                <div key={reminder.id} className="bg-white rounded-xl border border-stone-200 px-2.5 py-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-stone-800 truncate">
                      {reminder.time} · {reminder.title}
                    </p>
                    {reminder.message && (
                      <p className="text-[10px] text-stone-600 truncate">{reminder.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={reminder.enabled}
                      aria-label={`Aktifkan notifikasi ${reminder.title}`}
                      onClick={() => {
                        setReminderSettings((prev) => ({
                          ...prev,
                          customReminders: (prev.customReminders || []).map((item) =>
                            item.id === reminder.id ? { ...item, enabled: !item.enabled } : item
                          ),
                        }));
                      }}
                      className={`w-8 h-[18px] flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                        reminder.enabled ? 'bg-[#556B2F]' : 'bg-stone-300'
                      }`}
                    >
                      <span aria-hidden="true" className={`bg-white w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform ${
                        reminder.enabled ? 'translate-x-3.5' : 'translate-x-0'
                      }`} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus notifikasi ${reminder.title}`}
                      onClick={() => {
                        setReminderSettings((prev) => ({
                          ...prev,
                          customReminders: (prev.customReminders || []).filter((item) => item.id !== reminder.id),
                        }));
                      }}
                      className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="bg-white rounded-xl border border-stone-200 p-2.5 space-y-2">
                <input
                  type="text"
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  maxLength={40}
                  placeholder="Judul (mis. Minum obat)"
                  aria-label="Judul notifikasi custom"
                  className="w-full text-[11px] bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#556B2F]"
                />
                <input
                  type="text"
                  value={newReminderMessage}
                  onChange={(e) => setNewReminderMessage(e.target.value)}
                  maxLength={90}
                  placeholder="Pesan (mis. Habiskan setelah makan)"
                  aria-label="Pesan notifikasi custom"
                  className="w-full text-[11px] bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#556B2F]"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                    aria-label="Jam notifikasi custom"
                    className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-[11px] text-stone-800"
                  />
                  <span className="text-[10px] text-stone-600">WIB</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const title = newReminderTitle.trim();
                      if (!title) {
                        if (onShowToast) onShowToast('Isi judul notifikasi dulu ya');
                        return;
                      }
                      const reminder = {
                        id: `custom-${Date.now()}`,
                        title,
                        message: newReminderMessage.trim(),
                        time: newReminderTime || '09:00',
                        enabled: true,
                      };
                      setReminderSettings((prev) => ({
                        ...prev,
                        customReminders: [...(prev.customReminders || []), reminder],
                      }));
                      setNewReminderTitle('');
                      setNewReminderMessage('');
                      const perm = await requestNotificationPermission();
                      if (onShowToast) {
                        onShowToast(
                          perm === 'granted'
                            ? `Pengingat "${title}" ditambahkan`
                            : 'Pengingat disimpan, tapi izin notifikasi belum aktif'
                        );
                      }
                    }}
                    className="ml-auto px-3 py-1.5 rounded-lg bg-[#556B2F] text-white text-[11px] font-semibold hover:bg-[#465926] cursor-pointer"
                  >
                    + Tambah
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-stone-600 leading-snug">
                Notifikasi tampil dengan logo Bunda Journal. Pengingat berjalan saat aplikasi aktif;
                kalau browser ditutup total, Android bisa menundanya.
              </p>
            </div>
          </div>
        )}

        <div className="border-t border-stone-100 pt-2 flex items-center justify-between text-xs text-stone-700 py-1">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-stone-600" />
            <span>Bahasa Aplikasi</span>
          </div>
          <span className="text-stone-600 font-medium">Bahasa Indonesia</span>
        </div>

        <div className="border-t border-stone-100 pt-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-stone-700">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#556B2F]" />
              <span className="font-semibold text-stone-850">Variasi Tema Warna</span>
            </div>
            <span className="text-[10px] text-stone-600 font-sans">
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
                    <p className="text-[8.5px] text-stone-600 font-light truncate">
                      {theme.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Safety, Privacy & Support */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-xs space-y-2">
        <h4 className="font-serif text-xs font-bold text-stone-850 uppercase tracking-wider mb-2">
          Privasi & Bantuan
        </h4>

        <button
          onClick={() => {
            const data: Record<string, any> = {};
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k) data[k] = storageGet(k);
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bunda_journal_backup_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="w-full py-2 px-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-medium rounded-xl border border-stone-200/70 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[#556B2F]" />
            <span>Unduh Salinan Data Saya (JSON)</span>
          </div>
          <span className="text-[10px] text-stone-600">Backup</span>
        </button>

        <a
          href="https://wa.me/6281234567890?text=Halo%20Admin%20Bunda%20Journal,%20saya%20butuh%20bantuan"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-medium rounded-xl border border-stone-200/70 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>Hubungi Kami (WhatsApp CS)</span>
          </div>
          <span className="text-[10px] text-stone-600">Respon Cepat</span>
        </a>

        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 px-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
            <span>Data Bunda tersimpan di HP ini</span>
          </div>
          <span className="text-[10px] text-stone-600">Enkripsi Perangkat</span>
        </div>
      </div>

      {/* Logout & Reset Data */}
      <div className="pt-2 pb-4 space-y-2">
        <button 
          onClick={onLogout}
          className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-2xl border border-stone-200/80 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-stone-600" />
          <span>Keluar Akun (Logout)</span>
        </button>

        <button 
          id="btn-reset-data"
          onClick={() => {
            if (onResetAll) {
              onResetAll();
            } else {
              storageClear();
              window.location.hash = '';
              window.location.reload();
            }
          }}
          className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-2xl border border-rose-200/80 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-rose-600" />
          <span>Reset Semua Data</span>
        </button>
        <p className="text-[10px] text-stone-600 mt-2 text-center">Bunda Journal v2.4 • Data Tersimpan Aman di Perangkat</p>
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
                className="text-stone-600 hover:text-stone-600 p-1 cursor-pointer"
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
                  placeholder="Contoh: 18 Desember 2025"
                  value={editHpl}
                  onChange={(e) => setEditHpl(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#556B2F] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Nama Dokter Obgyn</label>
                <input 
                  type="text"
              placeholder="Contoh: dr. Sarah, Sp.OG"
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

      <AutoFillJournalModal
        isOpen={showAutoFill}
        onClose={() => setShowAutoFill(false)}
        onApplied={(count) => {
          if (onShowToast) onShowToast(`${count} hari diisi. Periksa lagi di tab Jurnal.`);
        }}
      />

      {/* Kick Counter Modal */}
      {showKickCounter && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-label="Hitung Gerak Janin" className="bg-white rounded-3xl p-5 max-w-sm w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-stone-200 text-center">
            <div className="flex justify-between items-center mb-3">
              <span className="font-serif font-bold text-stone-800 text-sm">Hitung Gerak Janin</span>
              <button onClick={() => setShowKickCounter(false)} aria-label="Tutup" className="text-stone-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 mb-3 leading-relaxed">
              Ketuk tombol hati setiap kali si kecil menendang/bergerak. Waktu mulai dan selesai
              tersimpan otomatis — Bunda tidak perlu mengisi jam.
            </p>

            <button
              onClick={() => setKicksCount(c => c + 1)}
              aria-label={`Tambah gerakan, saat ini ${kicksCount}`}
              className="w-28 h-28 mx-auto rounded-full bg-[#C87A64]/15 border-4 border-[#C87A64] text-[#A85A44] flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer shadow-md mb-3"
            >
              <Heart className="w-8 h-8 fill-[#C87A64] mb-1" />
              <span className="font-serif text-2xl font-bold">{kicksCount}</span>
            </button>

            <p className="text-[10px] text-stone-600 mb-3">
              Mulai: {formatHistoryMoment(kickStartedAt?.toISOString())}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setKicksCount(0);
                  setKickStartedAt(new Date());
                }}
                className="flex-1 py-2 text-xs border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  if (kicksCount > 0) {
                    const end = new Date();
                    const entry = {
                      date: end.toISOString(),
                      start: kickStartedAt?.toISOString(),
                      end: end.toISOString(),
                      count: kicksCount,
                    };
                    const next = [entry, ...kickHistory].slice(0, 30);
                    saveKickHistory(next);
                    if (onShowToast) onShowToast(`${kicksCount} gerakan tersimpan di riwayat`);
                  }
                  setShowKickCounter(false);
                }}
                className="flex-1 py-2 text-xs bg-[#556B2F] text-white rounded-xl font-medium cursor-pointer"
              >
                Selesai
              </button>
            </div>

            {kickHistory.length > 0 && (
              <div className="mt-4 text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-600">Riwayat gerakan</p>
                  <button
                    type="button"
                    onClick={() => saveKickHistory([])}
                    className="text-[10px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Hapus
                  </button>
                </div>
                <div className="space-y-1.5">
                  {kickHistory.slice(0, 8).map((item, index) => (
                    <div key={`${item.date}-${index}`} className="rounded-xl border border-stone-200 bg-stone-50/60 px-2.5 py-1.5">
                      <p className="text-[11px] font-semibold text-stone-800">
                        Sesi {kickHistory.length - index}: {item.count} gerakan
                      </p>
                      <p className="text-[10px] text-stone-600">
                        {formatHistoryMoment(item.start || item.date)}
                        {item.end ? ` – ${formatHistoryMoment(item.end)}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contraction Timer Modal */}
      {showContractionTimer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-label="Timer Kontraksi" className="bg-white rounded-3xl p-5 max-w-sm w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-stone-200 text-center">
            <div className="flex justify-between items-center mb-3">
              <span className="font-serif font-bold text-stone-800 text-sm">Timer Kontraksi</span>
              <button 
                onClick={() => {
                  if (contractionTimerRef.current) clearInterval(contractionTimerRef.current);
                  setIsContractionRunning(false);
                  setShowContractionTimer(false);
                }} 
                aria-label="Tutup"
                className="text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 mb-3 leading-relaxed">
              Mulai saat kontraksi datang, hentikan saat reda. Setiap kontraksi masuk riwayat
              dengan durasi dan jam otomatis.
            </p>

            <div className="py-3 font-sans text-3xl font-bold text-stone-800 tracking-wider">
              {formatClock(contractionSeconds)}
            </div>
            <p className="text-[10px] text-stone-600 mb-3">
              {isContractionRunning
                ? `Berjalan sejak ${formatHistoryMoment(contractionStartedAt?.toISOString())}`
                : contractionHistory.length > 0
                  ? `Kontraksi terakhir: ${contractionHistory[0].durationSeconds} detik`
                  : 'Belum ada kontraksi tercatat'}
            </p>

            <button
              onClick={() => {
                if (isContractionRunning) {
                  if (contractionTimerRef.current) clearInterval(contractionTimerRef.current);
                  setIsContractionRunning(false);
                  if (contractionSeconds > 0) {
                    const end = new Date();
                    const entry = {
                      date: end.toISOString(),
                      start: contractionStartedAt?.toISOString(),
                      end: end.toISOString(),
                      durationSeconds: contractionSeconds,
                    };
                    const next = [entry, ...contractionHistory].slice(0, 30);
                    saveContractionHistory(next);
                    if (onShowToast) onShowToast(`Kontraksi #${next.length}: ${contractionSeconds} detik tercatat`);
                  }
                } else {
                  setContractionStartedAt(new Date());
                  setIsContractionRunning(true);
                  setContractionSeconds(0);
                  if (contractionTimerRef.current) clearInterval(contractionTimerRef.current);
                  contractionTimerRef.current = setInterval(() => {
                    setContractionSeconds(prev => prev + 1);
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
                if (contractionTimerRef.current) clearInterval(contractionTimerRef.current);
                setIsContractionRunning(false);
                setContractionSeconds(0);
                setShowContractionTimer(false);
              }}
              className="text-xs text-stone-600 hover:text-stone-700 py-1"
            >
              Tutup
            </button>

            {contractionHistory.length > 0 && (
              <div className="mt-4 text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-600">Riwayat kontraksi</p>
                  <button
                    type="button"
                    onClick={() => saveContractionHistory([])}
                    className="text-[10px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Hapus
                  </button>
                </div>
                <div className="space-y-1.5">
                  {contractionHistory.slice(0, 10).map((item, index) => (
                    <div key={`${item.date}-${index}`} className="rounded-xl border border-stone-200 bg-stone-50/60 px-2.5 py-1.5 flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold text-stone-800">
                        Kontraksi #{contractionHistory.length - index}
                      </p>
                      <div className="text-right">
                        <p className="text-[11px] font-bold text-[#A85A44]">{item.durationSeconds} detik</p>
                        <p className="text-[10px] text-stone-600">{formatHistoryMoment(item.start || item.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
