import { storageGet, storageSet, storageRemove, storageClear } from './lib/storage/appStorage';
import React, { useState, useEffect, useRef } from 'react';
import { 
  TabType, 
  HabitState, 
  PhotoMemory, 
  JournalEntry, 
  UserProfile, 
  BookOrder,
  ReminderSettings
} from './types';
import { playGentleChime, sendSystemNotification } from './utils/notifications';
import { STORAGE_FULL_EVENT } from './lib/storageQuota';
import { mediaGet, mediaSet } from './lib/mediaStore';
import { logError } from './lib/errorLog';
import { applyAppColorTheme, getSavedAppColorTheme } from './utils/themeManager';
import { LandingPage } from './components/LandingPage';
import { TabHome } from './components/TabHome';
// Tab besar diunduh saat dibuka, bukan di bundle awal.
const TabJurnal = lazyWithRetry(() =>
  import('./components/TabJurnal').then((m) => ({ default: m.TabJurnal }))
);
import { notifyUserChanged } from './lib/appointmentStore';
import { LoginModal } from './components/LoginModal';
import {
  AuthUser,
  apiLogout,
  apiMe,
  clearAuthUser,
  collectUserPayload,
  applyUserPayload,
  getToken,
  pullUserData,
  pushUserData,
  pushUserDataNow,
  saveAuthUser,
  scheduleUserDataPush,
  wipeLocalJournalData,
  getSyncMarker,
  setSyncMarker,
  setToken,
  setSyncReady,
  markOfflineSnapshot,
  hasOfflineEdits,
  flushOfflineEdits,
} from './lib/authClient';
import { getTodayPosition } from './lib/pregnancyDate';
import { TabKatalog } from './components/TabKatalog';
const TabProfil = lazyWithRetry(() =>
  import('./components/TabProfil').then((m) => ({ default: m.TabProfil }))
);
import { ErrorBoundary } from './components/ErrorBoundary';
import { lazyWithRetry } from './lib/lazyWithRetry';
// Code-split: buku/cetak hanya diunduh saat Studio atau /print dibuka.
const PrintBookStudio = lazyWithRetry(() =>
  import('./components/bookPrint/PrintBookStudio').then((m) => ({ default: m.PrintBookStudio }))
);
const PrintBookView = lazyWithRetry(() => import('./components/bookPrint/PrintBookView'));
import { isJournalLocalOnly } from './config/storage';
import { maybeAutoBackup } from './lib/driveBackup';
import { isReminderDue, reminderDayKey } from './lib/reminderSchedule';
import { ReminderPopup, type ReminderPopupData } from './components/ReminderPopup';
import { OnboardingModal } from './components/OnboardingModal';
import { PicModal } from './components/PicModal';
import { CheckoutModal } from './components/CheckoutModal';
import { PAYMENT_PAUSED } from './config/payments';
import { SuccessPage } from './components/SuccessPage';import {
  syncSubscriptionToSupabase,
  syncProfileToSupabase,
  fetchUserTierFromSupabase,
  sendMagicLink
} from './lib/supabase';
import { idbSet, idbGet, getPendingSyncCount, markQueueSynced, getPendingQueueItems } from './lib/idb';
import {
  Home,
  BookMarked,
  User,
  CheckCircle,
  BookOpen
} from 'lucide-react';

const INITIAL_PHOTOS: PhotoMemory[] = [];

const INITIAL_ENTRIES: JournalEntry[] = [];

export default function App() {
  // App navigation & layout state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const paid = storageGet('bunda_is_paid') === 'true';
    const onboarded = storageGet('bunda_is_onboarded') === 'true';
    const logged = storageGet('bunda_isLoggedIn') !== 'false';
    // Sudah login dengan email+password (sesi D1) => boleh masuk.
    // Pembayaran hanya mengunci fitur OUTPUT (export PDF/hardcover), bukan pintu masuk.
    const hasSession = !!storageGet('bunda_session_token');
    if (logged && hasSession) return true;
    return paid && onboarded && logged;
  });
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const hash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
      if (hash === 'jurnal' || hash === 'studio' || hash === 'profil' || hash === 'home') {
        return hash as TabType;
      }
    } catch {}
    return 'home';
  });
  const [reminderQueue, setReminderQueue] = useState<ReminderPopupData[]>([]);
  const [reminderCheckNonce, setReminderCheckNonce] = useState(0);

  // Notifikasi yang diklik membawa hash #/jurnal → langsung buka tab Jurnal.
  useEffect(() => {
    const applyHash = () => {
      try {
        const hash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
        if (hash === 'jurnal' || hash === 'studio' || hash === 'profil' || hash === 'home') {
          setIsBookPreviewOpen(false);
          setActiveTab(hash as TabType);
        }
      } catch {}
    };
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  // Route /print — halaman cetak A4 (dibuka di tab baru dari Studio).
  const [isPrintRoute] = useState<boolean>(() => {
    try {
      return window.location.pathname === '/print' || window.location.hash === '#/print';
    } catch {
      return false;
    }
  });

  // TC03 / TC08: Paid status
  const [isPaid, setIsPaid] = useState<boolean>(() => {
    return storageGet('bunda_is_paid') === 'true';
  });

  // User Membership Tier: 'essential' | 'vip' (Diambil dari Supabase & fallback lokal)
  const [userTier, setUserTier] = useState<'essential' | 'vip'>(() => {
    const saved = storageGet('bunda_user_tier');
    return (saved === 'vip') ? 'vip' : 'essential';
  });

  // Modal Checkout & Upgrade Plan State
  const [checkoutDefaultPlan, setCheckoutDefaultPlan] = useState<'essential' | 'vip' | 'hardcover' | 'upgrade_vip'>('essential');

  // TC05: Mandatory Onboarding state
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return storageGet('bunda_is_onboarded') === 'true';
  });

  // Checkout gate modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>(() => {
    return storageGet('bunda_user_email') || '';
  });

  // Modal login (email + password) — auth beneran, bukan flag localStorage
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');

  // Validasi sesi saat boot + hidrasi data per-user dari D1 (lintas device)
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setSyncReady(true);
      return;
    }
    // OFFLINE: tetap bisa buka & edit dari cache. Jangan tarik/push apa pun.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      markOfflineSnapshot();
      setSyncReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      const me = await apiMe(token);
      if (cancelled) return;
      if (!me) {
        clearAuthUser();
        setSyncReady(true);
        return;
      }
      storageSet('bunda_user_email', me.email);
      storageSet('bunda_user_tier', me.tier === 'vip' ? 'vip' : 'essential');

      // MODE LOKAL (USP): jurnal tidak pernah ditarik atau didorong ke D1.
      // Server hanya dipakai untuk validasi sesi + tier akun.
      if (isJournalLocalOnly()) {
        setSyncReady(true);
        return;
      }

      // SELALU tarik dari API tiap boot (bukan sekali per sesi).
      const { ok, exists, payload, updatedAt } = await pullUserData(token);
      if (cancelled) return;

      // Ada editan offline yang belum terkirim -> gabung dulu, jangan ditimpa.
      if (ok && hasOfflineEdits()) {
        await flushOfflineEdits(token);
        setSyncReady(true);
        return;
      }

      // Server punya versi lebih baru -> pakai data server, reload sekali.
      if (ok && exists && payload && updatedAt && updatedAt !== getSyncMarker()) {
        setSyncMarker(updatedAt);
        applyUserPayload(payload, me.email);
        window.location.reload();
        return;
      }
      // Server masih kosong tapi device ini punya data -> dorong ke D1 (jangan hilang)
      if (ok && !exists && storageGet('bunda_profile')) {
        await pushUserData(token, collectUserPayload());
      }
      // Kalau profil sudah ada (dari cache / dari D1), jangan minta isi ulang.
      try {
        const prof = JSON.parse(storageGet('bunda_profile') || '{}');
        if (prof && prof.name) {
          storageSet('bunda_is_onboarded', 'true');
          setIsOnboarded(true);
        }
      } catch {}

      // Baru setelah tarik selesai, push diizinkan (biar tidak menimpa D1)
      setSyncReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Internet hilang -> catat snapshot (dasar hitung editan offline).
  // Internet balik -> tarik, gabung, baru push.
  useEffect(() => {
    let flushing = false;

    // MODE LOKAL: tidak ada antrean sync ke server.
    if (isJournalLocalOnly()) return;

    const onOffline = () => markOfflineSnapshot();

    const tryFlush = async () => {
      if (flushing) return;
      const tk = getToken();
      if (!tk) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      // antrean offline = snapshot ada
      if (!storageGet('bunda_offline_snapshot')) return;
      flushing = true;
      try {
        const ok = await flushOfflineEdits(tk);
        setSyncReady(true);
        if (ok) showToast('Tersambung lagi — data sudah disinkronkan');
      } finally {
        flushing = false;
      }
    };

    const onOnline = () => { tryFlush(); };
    const onVisible = () => {
      if (document.visibilityState === 'visible') tryFlush();
    };

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    // Fallback: sebagian tablet/Android tidak melempar event 'online' dengan andal,
    // jadi cek berkala selama masih ada editan offline yang belum terkirim.
    const timer = setInterval(() => { tryFlush(); }, 10000);

    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dorong data ke D1 tiap ada perubahan jurnal (debounce) + saat app disembunyikan
  useEffect(() => {
    // MODE LOKAL: jangan pernah push jurnal ke server.
    if (isJournalLocalOnly()) return;
    const onUpdated = () => scheduleUserDataPush();
    const onHide = () => { if (document.visibilityState === 'hidden') pushUserDataNow(); };
    window.addEventListener('bunda_journal_updated', onUpdated);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('bunda_journal_updated', onUpdated);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  // Auto-backup harian ke Google Drive milik user (mode lokal).
  // Tidak ada upload ke server Bunda; kalau izin belum ada, diam saja.
  // Tidak dijalankan 15 detik setelah buka app supaya tidak mengganggu layar;
  // hanya saat app ditinggalkan atau jaringan kembali online.
  useEffect(() => {
    const run = () => { void maybeAutoBackup(); };
    const onHide = () => { if (document.visibilityState === 'hidden') run(); };
    const onOnline = () => run();
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  // Login sukses -> simpan sesi + ambil data milik email itu (bukan data device)
  const handleLoginSuccess = async (user: AuthUser) => {
    const prevEmail = (storageGet('bunda_user_email') || '').trim().toLowerCase();
    saveAuthUser(user);
    try {
      if (isJournalLocalOnly()) {
        // MODE LOKAL: jangan tarik jurnal dari server. Hanya cegah data akun lama
        // terbawa ke akun baru di device yang sama.
        if (prevEmail && prevEmail !== (user.email || '').trim().toLowerCase()) {
          wipeLocalJournalData();
          storageRemove('bunda_is_onboarded');
        }
      } else {
        const { exists, payload } = await pullUserData(user.token);
        if (exists && payload) {
          applyUserPayload(payload, user.email);
        } else if (prevEmail && prevEmail === user.email) {
          // device ini memang milik email yang sama -> adopsi datanya ke server
          await pushUserData(user.token, collectUserPayload());
        } else {
          // akun lain di device bekas -> mulai bersih, JANGAN warisin data orang lain
          wipeLocalJournalData();
          storageRemove('bunda_is_onboarded');
        }
      }
    } catch {}
    setIsLoginOpen(false);
    window.location.reload();
  };

  // Core Pregnancy Data State
  const [week, setWeek] = useState<number>(() => {
    const saved = storageGet('bunda_week');
    // Default = minggu kehamilan HARI INI (dinamis), bukan 32 hardcode
    return saved ? parseInt(saved, 10) : getTodayPosition().week;
  });

  const [journalText, setJournalText] = useState<string>(() => {
    return storageGet('bunda_journal_text') || '';
  });
  const [journalSaved, setJournalSaved] = useState<boolean>(true);

  const [habits, setHabits] = useState<HabitState>(() => {
    try {
      const saved = storageGet('bunda_habits');
      return saved ? JSON.parse(saved) : {
        water: false,
        vitamins: false,
        walk: false,
        sleep: false,
        yoga: false,
      };
    } catch {
      return {
        water: false,
        vitamins: false,
        walk: false,
        sleep: false,
        yoga: false,
      };
    }
  });

  const [selectedMood, setSelectedMood] = useState<number>(() => {
    try {
      const saved = storageGet('bunda_mood');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [photos, setPhotos] = useState<PhotoMemory[]>(() => {
    try {
      const saved = mediaGet('bunda_photos');
      return saved ? JSON.parse(saved) : INITIAL_PHOTOS;
    } catch {
      return INITIAL_PHOTOS;
    }
  });

  const [pastEntries, setPastEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = storageGet('bunda_entries');
      return saved ? JSON.parse(saved) : INITIAL_ENTRIES;
    } catch {
      return INITIAL_ENTRIES;
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = storageGet('bunda_profile');
      return saved ? JSON.parse(saved) : {
        name: '',
        babyNickname: '',
        hplDate: '',
        doctorName: '',
        hospitalName: '',
        bloodType: ''
      };
    } catch {
      return {
        name: '',
        babyNickname: '',
        hplDate: '',
        doctorName: '',
        hospitalName: '',
        bloodType: ''
      };
    }
  });

  // Minggu kehamilan diturunkan dari HPL. Kalau HPL baru muncul (habis pull D1)
  // atau user mengganti HPL, hitung ulang — jangan biarkan minggu lama nyangkut.
  useEffect(() => {
    const hpl = userProfile.hplDate;
    if (!hpl) return;
    const d = new Date(hpl);
    if (Number.isNaN(d.getTime())) return;
    if (storageGet('bunda_week_hpl') === hpl) return;
    const pos = getTodayPosition(new Date(), d);
    storageSet('bunda_week_hpl', hpl);
    storageSet('bunda_week', String(pos.week));
    setWeek(pos.week);
  }, [userProfile.hplDate]);

  // Offline banner & sync queue state
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Monitor network status & sync pending IndexedDB items
  useEffect(() => {
    let offlineTimeout: NodeJS.Timeout | null = null;

    const handleOffline = () => {
      // AFD 3.7: jangan langsung banner offline, tunggu 3 detik baru tampilkan jika koneksi benar putus
      offlineTimeout = setTimeout(() => {
        setIsOffline(true);
        setShowOfflineBanner(true);
      }, 3000);
    };

    const handleOnline = async () => {
      if (offlineTimeout) clearTimeout(offlineTimeout);
      setIsOffline(false);
      setShowOfflineBanner(false);
      // Process pending queue
      try {
        const count = await getPendingSyncCount();
        if (count > 0) {
          setSyncToast(`Menyinkronkan ${count} data tersimpan...`);
          const items = await getPendingQueueItems();
          for (const item of items) {
            if (item.id) await markQueueSynced(item.id);
          }
          setPendingSyncCount(0);
          setTimeout(() => {
            setSyncToast('Semua data berhasil tersinkron');
            setTimeout(() => setSyncToast(null), 4000);
          }, 800);
        }
      } catch (err) {
        console.error('Sync error:', err);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    (window as any).__triggerOnlineSync = handleOnline;
    (window as any).__setSyncToast = setSyncToast;

    // Initial check pending queue
    getPendingSyncCount().then(setPendingSyncCount).catch(() => {});

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (offlineTimeout) clearTimeout(offlineTimeout);
    };
  }, []);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => {
    const saved = storageGet('bunda_reminder_settings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      vitaminTime: '08:00',
      journalTime: '20:00',
      waterIntervalHours: 2,
      soundEnabled: true,
    };
  });

  // Versi mesin pengingat. Sekali saja setelah update: buang penanda "sudah
  // terkirim hari ini" dari versi lama supaya alarm yang terlewat tetap muncul.
  useEffect(() => {
    if (storageGet('bunda_reminder_engine') === 'v2') return;
    try {
      storageRemove('bunda_last_vitamin_date');
      storageRemove('bunda_last_journal_date');
      (reminderSettings.customReminders || []).forEach((item) => {
        storageRemove(`bunda_last_custom_${item.id}_date`);
      });
      storageSet('bunda_reminder_engine', 'v2');
    } catch {}
  }, []);

  // Tombol "Cek Pengingat Sekarang" di Profil memicu pemeriksaan ulang.
  useEffect(() => {
    const onCheck = () => setReminderCheckNonce((n) => n + 1);
    const onDemo = () => {
      setReminderQueue((prev) => [
        ...prev.filter((item) => item.tag !== 'demo'),
        {
          tag: 'demo',
          title: 'Bunda Journal — Contoh pengingat',
          message: 'Ini contoh pop-up pengingat. Kalau ini muncul, tampilan pengingat di HP Bunda sudah benar.',
          time: '',
        },
      ]);
    };
    window.addEventListener('bunda_check_reminders', onCheck);
    window.addEventListener('bunda_demo_reminder', onDemo);
    return () => {
      window.removeEventListener('bunda_check_reminders', onCheck);
      window.removeEventListener('bunda_demo_reminder', onDemo);
    };
  }, []);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; price?: string } | null>(null);

  // Book Preview Modal State
  const [isBookPreviewOpen, setIsBookPreviewOpen] = useState<boolean>(false);

  // TC10: PIC Modal state
  const [isPicOpen, setIsPicOpen] = useState<boolean>(() => {
    return window.location.pathname === '/pic' || window.location.hash === '#/pic';
  });
  const [isSuccessPage, setIsSuccessPage] = useState<boolean>(() => {
    try {
      const p = window.location.pathname;
      const h = window.location.hash;
      return p === '/success' || h === '#/success';
    } catch {
      return false;
    }
  });

  // Listen for hash / popstate / keyboard shortcut for /pic and /app
  useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      if (path === '/pic' || hash === '#/pic') {
        setIsPicOpen(true);
      }

      if (path === '/success' || hash === '#/success') {
        setIsSuccessPage(true);
      }

      if (path === '/jurnal' || hash === '#/jurnal') {
        setIsSuccessPage(false);
        // Jangan buka app tanpa dasar: wajib sesi valid, atau sudah bayar + isi form.
        const hasSession = !!storageGet('bunda_session_token');
        const paidNow = storageGet('bunda_is_paid') === 'true';
        const onboardedNow = storageGet('bunda_is_onboarded') === 'true';
        const loggedNow = storageGet('bunda_isLoggedIn') !== 'false';
        if ((loggedNow && hasSession) || (paidNow && onboardedNow && loggedNow)) {
          setIsLoggedIn(true);
          setActiveTab('jurnal');
        }
      }

      // Intercept direct access to /app or #/app
      if (path === '/app' || hash === '#/app') {
        const paid = storageGet('bunda_is_paid') === 'true';
        const onboarded = storageGet('bunda_is_onboarded') === 'true';

        if (!paid && !PAYMENT_PAUSED) {
          // Cecegat akses /app ke checkout modal
          setIsLoggedIn(false);
          setIsCheckoutOpen(true);
          showToast('Selesaikan pembelian untuk mengakses aplikasi.');
        } else if (!onboarded && paid) {
          // Sudah bayar tapi belum isi form Bunda
          setIsLoggedIn(false);
          showToast('Lengkapi formulir informasi Bunda terlebih dahulu.');
        } else {
          setIsLoggedIn(true);
          setActiveTab('home');
        }
      }
    };

    handleLocation();
    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', handleLocation);
    return () => {
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', handleLocation);
    };
  }, []);

  // Intercept direct access to /app or #/app and sync Tier from Supabase
  useEffect(() => {
    // Sinkronisasi status tier dari Supabase jika user punya email
    const email = storageGet('bunda_user_email');
    if (email) {
      fetchUserTierFromSupabase(email).then((tierFromDb) => {
        if (tierFromDb === 'vip') {
          // Server adalah sumber kebenaran: kalau server bilang VIP, naikkan lokal.
          setUserTier('vip');
          storageSet('bunda_user_tier', 'vip');
          if (!isPaid) {
            setIsPaid(true);
            storageSet('bunda_is_paid', 'true');
          }
        } else if (tierFromDb === 'essential') {
          setUserTier('essential');
          storageSet('bunda_user_tier', 'essential');
          if (isPaid) {
            // Jangan turunkan otomatis (bisa jadi offline/transaksi baru),
            // cukup catat untuk diagnosa.
            logError('Tier mismatch: lokal VIP, server essential', { source: 'tier-sync' });
          }
        }
      });
    }
  }, [userEmail, isPaid]);

  // Save changes to localStorage
  useEffect(() => {
    storageSet('bunda_isLoggedIn', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    storageSet('bunda_week', String(week));
  }, [week]);

  useEffect(() => {
    storageSet('bunda_journal_text', journalText);
  }, [journalText]);

  useEffect(() => {
    storageSet('bunda_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    storageSet('bunda_reminder_settings', JSON.stringify(reminderSettings));
  }, [reminderSettings]);

  useEffect(() => {
    storageSet('bunda_mood', String(selectedMood));
  }, [selectedMood]);

  useEffect(() => {
    // Foto base64 disimpan di IndexedDB (bukan localStorage) supaya kuota ~5 MB
    // tidak penuh. `mediaSet` punya fallback ke localStorage bila IDB gagal.
    mediaSet('bunda_photos', JSON.stringify(photos));
  }, [photos]);

  useEffect(() => {
    storageSet('bunda_entries', JSON.stringify(pastEntries));
  }, [pastEntries]);

  useEffect(() => {
    storageSet('bunda_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Periodic Reminder Checker (every 30s + saat app kembali terlihat)
  useEffect(() => {
    if (!reminderSettings.enabled) return;

    let checking = false;
    const checkReminders = async () => {
      if (checking) return;
      checking = true;
      try {
        const now = new Date();
        const todayDateStr = reminderDayKey(now);
        const visible = document.visibilityState === 'visible';

        // Jadwal dianggap jatuh tempo kalau menitnya sudah lewat (maks. 12 jam).
        // Android menahan timer saat app di latar belakang, jadi jangan pakai
        // kecocokan menit persis — alarm tetap muncul saat app dibuka kembali.
        const isDue = (time: string) => isReminderDue(time, now, 720);

        const enqueue = (item: ReminderPopupData) => {
          setReminderQueue((prev) =>
            prev.some((existing) => existing.tag === item.tag) ? prev : [...prev, item]
          );
        };

        const notifyOnce = async (
          key: string,
          title: string,
          body: string,
          options: { tag: string; time?: string }
        ) => {
          if (storageGet(key) === todayDateStr) return false;

          // Saat app terlihat: tampilkan pop-up di dalam app (tidak perlu izin
          // notifikasi dan tidak dobel dengan notifikasi sistem).
          if (visible) {
            storageSet(key, todayDateStr);
            if (reminderSettings.soundEnabled) playGentleChime();
            enqueue({
              tag: options.tag,
              title,
              message: body,
              time: options.time,
            });
            return true;
          }

          // Saat app di background: coba notifikasi sistem; kalau gagal, jangan
          // tandai terkirim supaya pop-up muncul saat app dibuka kembali.
          const shown = await sendSystemNotification(title, body, {
            tag: options.tag,
            url: '/#/jurnal',
          });
          if (shown) storageSet(key, todayDateStr);
          return shown;
        };

        // Vitamin
        if (isDue(reminderSettings.vitaminTime) && !habits.vitamins) {
          await notifyOnce(
            'bunda_last_vitamin_date',
            'Bunda Journal — Minum vitamin',
            'Asam folat & zat besi penting untuk perkembangan sel darah dan saraf buah hati hari ini.',
            { tag: 'bunda-vitamin', time: reminderSettings.vitaminTime }
          );
        }

        // Jurnal
        if (isDue(reminderSettings.journalTime)) {
          await notifyOnce(
            'bunda_last_journal_date',
            'Bunda Journal — Isi jurnal',
            'Luangkan waktu sejenak untuk mencatat momen manis kehamilan hari ini.',
            { tag: 'bunda-journal', time: reminderSettings.journalTime }
          );
        }

        // Notifikasi custom
        for (const reminder of reminderSettings.customReminders || []) {
          if (!reminder.enabled || !reminder.title.trim() || !isDue(reminder.time)) continue;
          await notifyOnce(
            `bunda_last_custom_${reminder.id}_date`,
            `Bunda Journal — ${reminder.title.trim()}`,
            reminder.message.trim() || 'Pengingat dari Bunda Journal.',
            { tag: `bunda-custom-${reminder.id}`, time: reminder.time }
          );
        }
      } finally {
        checking = false;
      }
    };

    void checkReminders();
    const timer = setInterval(() => { void checkReminders(); }, 30000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkReminders();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('pageshow', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };
  }, [reminderSettings, habits.vitamins, reminderCheckNonce]);

  // Auto-balik 5 menit (300.000 ms) idle view-only ke tanggal & minggu hari ini.
  // Ini BUKAN reset data: catatan history tetap tersimpan di localStorage.
  useEffect(() => {
    const IDLE_TIMEOUT = 5 * 60 * 1000;
    let idleTimer: NodeJS.Timeout;

    const resetToToday = () => {
      const pos = getTodayPosition();
      // Kembalikan view ke minggu + hari ini (sesuai spec V5), data tidak dihapus.
      // setWeek juga memperbarui Home; TabJurnal menerima event di bawah.
      setWeek(pos.week);
      window.dispatchEvent(new CustomEvent('bunda_return_today', { detail: { dayIndex: pos.dayIndex, week: pos.week } }));
      showToast(`✓ Balik ke hari ini (Minggu ${pos.week})`);
    };

    const handleUserInteraction = () => {
      storageSet('bunda_lastActive', Date.now().toString());
      clearTimeout(idleTimer);
      idleTimer = setTimeout(resetToToday, IDLE_TIMEOUT);
    };

    // Cek durasi saat mount: jika ditinggal >5 menit, langsung arahkan ke hari ini
    const lastActive = storageGet('bunda_lastActive');
    if (lastActive && Date.now() - parseInt(lastActive, 10) > IDLE_TIMEOUT) {
      resetToToday();
    }
    handleUserInteraction();

    const events = ['click', 'touchstart', 'keydown', 'input', 'scroll'];
    events.forEach((ev) => document.addEventListener(ev, handleUserInteraction, { passive: true }));

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const last = storageGet('bunda_lastActive');
        if (last && Date.now() - parseInt(last, 10) > IDLE_TIMEOUT) {
          resetToToday();
        }
        handleUserInteraction();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(idleTimer);
      events.forEach((ev) => document.removeEventListener(ev, handleUserInteraction));
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const toggleHabit = (key: keyof HabitState) => {
    setHabits(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Hasil OAuth Google (#glt=<token>) + pesan error (?google_error=...)
  useEffect(() => {
    const hash = window.location.hash || '';
    if (hash.startsWith('#glt=')) {
      const raw = hash.slice('#glt='.length);
      const [tokenPart, planPart] = raw.split('&');
      const oauthToken = decodeURIComponent(tokenPart || '');
      const plan = planPart && planPart.startsWith('plan=')
        ? decodeURIComponent(planPart.slice('plan='.length))
        : '';
      if (oauthToken) {
        setToken(oauthToken);
        (async () => {
          const me = await apiMe(oauthToken);
          if (me) {
            saveAuthUser(me);
            // plan di URL cuma penanda. Saat payment paused, jangan kasih tier/paid.
            if (plan && !PAYMENT_PAUSED) {
              const tier = plan === 'essential' ? 'essential' : 'vip';
              storageSet('bunda_is_paid', 'true');
              storageSet('bunda_user_tier', tier);
            }
            storageSet('bunda_isLoggedIn', 'true');
          }
          try { window.history.replaceState({}, '', window.location.pathname); } catch {}
          window.location.reload();
        })();
        return;
      }
    }

    const params = new URLSearchParams(window.location.search);
    const gErr = params.get('google_error');
    if (gErr) {
      const msg =
        gErr === 'cancelled'
          ? 'Login Google dibatalkan'
          : gErr === 'not_configured'
          ? 'Login Google belum aktif — pakai email & password dulu ya'
          : 'Login Google gagal. Coba lagi.';
      showToast(msg);
      params.delete('google_error');
      const qs = params.toString();
      try {
        window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (text: string, price?: string) => {
    setToastMessage({ text, price });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // P0: beri tahu user kalau penyimpanan lokal penuh (foto base64).
  useEffect(() => {
    const onStorageFull = () => {
      showToast('Penyimpanan HP penuh. Hapus beberapa foto lama atau ekspor data dulu.');
    };
    window.addEventListener(STORAGE_FULL_EVENT, onStorageFull);
    return () => window.removeEventListener(STORAGE_FULL_EVENT, onStorageFull);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // P2: prefetch tab besar setelah idle, supaya navigasi pertama tetap instan
  // walau bundle-nya di-code-split.
  useEffect(() => {
    const preload = () => {
      void import('./components/TabJurnal');
      void import('./components/TabProfil');
      // Chunk /print kecil (±7 KB): prefetch supaya dialog print cepat siap.
      void import('./components/bookPrint/PrintBookView');
    };
    const idle = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;
    if (typeof idle === 'function') idle(preload, { timeout: 4000 });
    else setTimeout(preload, 1500);
  }, []);

  const openCheckout = (plan: 'essential' | 'vip' | 'hardcover' | 'upgrade_vip' = 'essential') => {
    if (PAYMENT_PAUSED) {
      showToast('Pembayaran sedang diperbaiki. VIP segera hadir.');
      return;
    }
    setCheckoutDefaultPlan(plan);
    setIsCheckoutOpen(true);
  };

  const handleSaveCurrentEntry = () => {
    // 1. Sync daily notes of the current week to main journalText if needed
    try {
      const savedDaily = storageGet(`bunda_daily_w${week}`);
      let compiledText = journalText;
      if (savedDaily) {
        const parsed = JSON.parse(savedDaily);
        const nonEmpty = Object.entries(parsed)
          .filter(([_, v]) => typeof v === 'string' && (v as string).trim().length > 0)
          .map(([k, v]) => `${k}: ${v}`);
        if (nonEmpty.length > 0) {
          compiledText = nonEmpty.join('\n');
          setJournalText(compiledText);
        }
      }

      if (!compiledText.trim()) return;

      const newEntry: JournalEntry = {
        id: `entry-${Date.now()}`,
        week,
        date: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date()),
        text: compiledText,
        moodIndex: selectedMood,
        habitsSnapshot: { ...habits },
        sleepHours: habits.sleepHours || (habits.sleep ? 8.0 : 6.5),
        createdAt: Date.now(),
      };
      setPastEntries(prev => [newEntry, ...prev]);
      window.dispatchEvent(new Event('bunda_journal_updated'));
      showToast(`Jurnal Minggu ke-${week} berhasil disimpan!`);
    } catch {
      showToast('Berhasil menyimpan catatan jurnal');
    }
  };

  const handleDeleteEntry = (id: string) => {
    setPastEntries(prev => prev.filter(e => e.id !== id));
  };

  const triggerGoogleDriveSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      showToast('Data Jurnal & Foto berhasil disinkronkan ke Google Drive');
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1200);
  };

  const handlePlaceOrder = (order: BookOrder) => {
    showToast('Pesanan Buku Cetak sedang dipersiapkan!', 'Rp 249.000');
  };

  // Halaman /print: render buku saja (tanpa shell aplikasi, tanpa gate login).
  // Data dibaca langsung dari localStorage/IndexedDB oleh PrintBookView.
  if (isPrintRoute) {
    return (
      <React.Suspense fallback={<div style={{ padding: 24, fontFamily: 'sans-serif' }}>Memuat buku…</div>}>
        <PrintBookView />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#ECE8E1] flex flex-col items-center justify-start sm:p-4 md:p-6 text-[#292524]">
      {/* Main Screen Container (Smartphone Frame or Responsive Card) */}
      <div 
        className={`w-full bg-[#F5F2EB] shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300 ${
          !isLoggedIn
            ? 'max-w-6xl min-h-screen rounded-2xl border border-stone-200'
            : 'max-w-[430px] min-h-screen md:min-h-[880px] md:rounded-[40px] md:border-[8px] md:border-[#2C2927]'
        }`}
      >

        {/* Floating Toast Notification for Sync & Mode */}
        {syncToast && (
          <div 
            id="toast-sync-status"
            className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-[#556B2F] text-white text-xs px-4 py-2 rounded-full shadow-lg font-medium flex items-center gap-2 whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span>{syncToast}</span>
          </div>
        )}

        {/* Offline Banner: Only displayed when truly offline for >3s */}
        {showOfflineBanner && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs flex items-center justify-between z-40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-medium">Mode Offline Aktif</span>
              <span className="text-amber-700 text-[11px] hidden sm:inline">— Data tetap tersimpan di perangkat</span>
            </div>
            {pendingSyncCount > 0 && (
              <span className="text-[10px] bg-amber-200/60 px-2 py-0.5 rounded-full font-bold">
                {pendingSyncCount} antrean
              </span>
            )}
          </div>
        )}

        {/* CONDITION 0: Success Page + PWA Tutorial (Post-Payment) */}
        {isSuccessPage ? (
          <SuccessPage
            userEmail={userEmail}
            userTier={userTier}
            onOpenJurnal={() => {
              setIsSuccessPage(false);
              // Paid hanya kalau SuccessPage sudah membuktikannya ke server.
              if (storageGet('bunda_is_paid') === 'true') setIsPaid(true);
              // Login hanya kalau ada sesi valid ATAU sudah bayar + sudah isi form.
              const hasSession = !!storageGet('bunda_session_token');
              const paidNow = storageGet('bunda_is_paid') === 'true';
              const onboardedNow = storageGet('bunda_is_onboarded') === 'true';
              const loggedNow = storageGet('bunda_isLoggedIn') !== 'false';
              if ((loggedNow && hasSession) || (paidNow && onboardedNow && loggedNow)) {
                setIsLoggedIn(true);
              }
              // isOnboarded TIDAK di-set di sini: wajib lewat form OnboardingModal.
              setActiveTab('jurnal');
              window.history.pushState({}, '', '#/jurnal');
            }}
          />
        ) : !isLoggedIn ? (
          <LandingPage 
            isPaid={isPaid}
            onLoginClick={() => { setLoginMode('login'); setIsLoginOpen(true); }}
            onRegisterClick={() => { setLoginMode('register'); setIsLoginOpen(true); }}
            onStartCheckout={(amount) => {
              openCheckout(amount === 129000 ? 'vip' : amount === 249000 ? 'hardcover' : 'essential');
            }}
            onEnterApp={() => {
              if (!isPaid && !PAYMENT_PAUSED) {
                setIsCheckoutOpen(true);
                return;
              }
              if (!isOnboarded) {
                showToast('Lengkapi formulir informasi Bunda.');
                return;
              }
              setIsLoggedIn(true);
              setActiveTab('home');
              storageSet('bunda_isLoggedIn', 'true');
            }} 
          />
        ) : (
          /* CONDITION 2: Authenticated App with 4 Tabs */
          <div className="flex flex-col h-full min-h-screen bg-[#F5F2EB] text-[#292524] relative pb-[calc(5rem+env(safe-area-inset-bottom,0px))] select-none">
            {/* App Sticky Header */}
            <header className="px-5 pt-3 pb-2.5 flex items-center justify-between border-b border-stone-200/50 bg-[#F5F2EB]/95 backdrop-blur-md sticky top-0 z-30">
              <div className="flex items-center gap-2">
                <img src="/bunda_journal_FINAL_BIG.png" alt="Bunda Journal" className="h-20 w-40 object-contain" />
              </div>
              <div className="text-[11px] font-sans font-medium text-stone-600 bg-stone-200/50 px-2.5 py-0.5 rounded-full">
                W{week} • Trimester {week <= 13 ? 1 : week <= 27 ? 2 : 3}
              </div>
            </header>

            {/* Main Scrollable Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar">
              {activeTab === 'home' && (
                <ErrorBoundary fallbackTitle="Kendala pada Beranda">
                  <TabHome 
                    week={week}
                    setWeek={setWeek}
                    habits={habits}
                    toggleHabit={toggleHabit}
                    userProfile={userProfile}
                    pastEntries={pastEntries}
                    selectedMood={selectedMood}
                    reminderSettings={reminderSettings}
                    onUpdateReminderSettings={setReminderSettings}
                    onShowToast={showToast}
                    onGoToJournal={() => setActiveTab('jurnal')}
                    onGoToKatalog={() => setActiveTab('studio')}
                    onGoToStudio={() => setActiveTab('studio')}
                    photos={photos}
                    onUpdatePhoto={(w, newPhoto) => {
                      setPhotos((prev) => [...prev.filter((p) => p.week !== w), newPhoto]);
                      window.dispatchEvent(new Event('bunda_journal_updated'));
                    }}
                  />
                </ErrorBoundary>
              )}

              {activeTab === 'jurnal' && (
                <ErrorBoundary fallbackTitle="Kendala pada Jurnal">
                  <React.Suspense fallback={null}>
                    <TabJurnal 
                      week={week}
                      setWeek={setWeek}
                      journalText={journalText}
                      setJournalText={setJournalText}
                      journalSaved={journalSaved}
                      setJournalSaved={setJournalSaved}
                      habits={habits}
                      toggleHabit={toggleHabit}
                      selectedMood={selectedMood}
                      setSelectedMood={setSelectedMood}
                      photos={photos}
                      setPhotos={setPhotos}
                      pastEntries={pastEntries}
                      userProfile={userProfile}
                      onOpenBookPreview={() => setIsBookPreviewOpen(true)}
                      onSaveCurrentEntry={handleSaveCurrentEntry}
                      onDeleteEntry={handleDeleteEntry}
                      onShowToast={showToast}
                    />
                  </React.Suspense>
                </ErrorBoundary>
              )}

              {(activeTab === 'studio' || activeTab === 'katalog') && (
                <ErrorBoundary fallbackTitle="Kendala pada Studio">
                  <TabKatalog 
                    userProfile={userProfile}
                    photos={photos}
                    journalText={journalText}
                    isPaid={isPaid}
                    userTier={userTier}
                    onOpenBookPreview={() => setIsBookPreviewOpen(true)}
                    onGoToJournal={() => setActiveTab('jurnal')}
                    onOpenUpgradeModal={() => openCheckout('upgrade_vip')}
                    onPlaceOrder={handlePlaceOrder}
                  />
                </ErrorBoundary>
              )}

              {activeTab === 'profil' && (
                <ErrorBoundary fallbackTitle="Kendala pada Tab Profil">
                  <React.Suspense fallback={null}>
                  <TabProfil 
                    userProfile={userProfile}
                    setUserProfile={setUserProfile}
                    notificationsEnabled={reminderSettings.enabled}
                    setNotificationsEnabled={(enabled) => setReminderSettings(prev => ({ ...prev, enabled }))}
                    reminderSettings={reminderSettings}
                    setReminderSettings={setReminderSettings}
                    onShowToast={showToast}
                    isSyncing={isSyncing}
                    syncSuccess={syncSuccess}
                    onSync={triggerGoogleDriveSync}
                    userTier={userTier}
                    onOpenUpgradeModal={() => openCheckout('upgrade_vip')}
                    onLogout={async () => {
                      try {
                        if (!isJournalLocalOnly()) await pushUserDataNow();
                        const tk = getToken();
                        if (tk) await apiLogout(tk);
                      } catch {}
                      // Logout = hapus SESI saja. Data per-email + status onboarding
                      // TETAP di device supaya login lagi tidak perlu isi ulang.
                      clearAuthUser();
                      setIsLoggedIn(false);
                      setIsPaid(false);
                      setUserTier('essential');
                      storageRemove('bunda_is_paid');
                      storageRemove('bunda_user_email');
                      notifyUserChanged('');
                      storageRemove('bunda_user_tier');
                      storageSet('bunda_isLoggedIn', 'false');
                      setIsLoginOpen(false);
                      showToast('Berhasil keluar akun. Data Bunda tetap tersimpan.');
                    }}
                    onResetAll={() => {
                      storageClear();
                      setUserProfile({
                        name: '',
                        babyNickname: '',
                        hplDate: '',
                        doctorName: '',
                        hospitalName: '',
                        bloodType: ''
                      });
                      setJournalText('');
                      setPastEntries([]);
                      setPhotos([]);
                      setHabits({
                        water: false,
                        vitamins: false,
                        walk: false,
                        sleep: false,
                        yoga: false,
                      });
                      setSelectedMood(0);
                      setIsPaid(false);
                      setIsOnboarded(false);
                      setIsLoggedIn(false);
                      setUserTier('essential');
                      setActiveTab('home');
                      window.location.hash = '';
                      window.location.reload();
                    }}
                    journalEntries={pastEntries}
                    photos={photos}
                    habits={habits}
                  />
                  </React.Suspense>
                </ErrorBoundary>
              )}
            </main>

            {/* Bottom Floating Navigation Bar (Hidden when Studio preview is active) */}
            {!isBookPreviewOpen && (
              <nav 
                id="bottom-navigation-bar"
                className="fixed bottom-0 left-0 right-0 w-full max-w-[430px] md:max-w-md mx-auto bg-[#FAF8F5]/98 backdrop-blur-md border-t border-stone-200/90 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-around items-center z-50 md:rounded-t-2xl shadow-sm"
              >
                <button 
                  id="nav-tab-beranda"
                  onClick={() => {
                    setActiveTab('home');
                    setIsBookPreviewOpen(false);
                  }} 
                  className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'home' && !isBookPreviewOpen ? 'text-[#556B2F] font-semibold' : 'text-stone-600 hover:text-stone-800'
                  }`}
                >
                  <Home className={`w-5 h-5 ${activeTab === 'home' && !isBookPreviewOpen ? 'stroke-[2.5]' : 'stroke-1.5'}`} />
                  <span className="text-[11px] mt-0.5 tracking-tight font-sans">Beranda</span>
                </button>

                <button 
                  id="nav-tab-jurnal"
                  onClick={() => {
                    setActiveTab('jurnal');
                    setIsBookPreviewOpen(false);
                  }} 
                  className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'jurnal' && !isBookPreviewOpen ? 'text-[#556B2F] font-semibold' : 'text-stone-600 hover:text-stone-800'
                  }`}
                >
                  <BookMarked className={`w-5 h-5 ${activeTab === 'jurnal' && !isBookPreviewOpen ? 'stroke-[2.5]' : 'stroke-1.5'}`} />
                  <span className="text-[11px] mt-0.5 tracking-tight font-sans">Jurnal</span>
                </button>

                <button 
                  id="nav-tab-studio"
                  onClick={() => {
                    setActiveTab('studio');
                    setIsBookPreviewOpen(false);
                  }} 
                  className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'studio' ? 'text-[#556B2F] font-semibold' : 'text-stone-600 hover:text-stone-800'
                  }`}
                >
                  <BookOpen className={`w-5 h-5 ${activeTab === 'studio' ? 'stroke-[2.5]' : 'stroke-1.5'}`} />
                  <span className="text-[11px] mt-0.5 tracking-tight font-sans">Studio</span>
                </button>

                <button 
                  id="nav-tab-profil"
                  onClick={() => {
                    setActiveTab('profil');
                    setIsBookPreviewOpen(false);
                  }} 
                  className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'profil' && !isBookPreviewOpen ? 'text-[#556B2F] font-semibold' : 'text-stone-600 hover:text-stone-800'
                  }`}
                >
                  <User className={`w-5 h-5 ${activeTab === 'profil' && !isBookPreviewOpen ? 'stroke-[2.5]' : 'stroke-1.5'}`} />
                  <span className="text-[11px] mt-0.5 tracking-tight font-sans">Profil</span>
                </button>
              </nav>
            )}
          </div>
        )}

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-[390px] bg-[#292524] text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between text-xs z-50 animate-bounce">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-[#C87A64] shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
            {toastMessage.price && (
              <span className="font-bold text-[#E59882] shrink-0">{toastMessage.price}</span>
            )}
          </div>
        )}

        {/* Master 100-Page B5 Print Studio & Album Engine */}
        {isBookPreviewOpen && (
          <React.Suspense fallback={null}>
            <PrintBookStudio 
              userProfile={userProfile}
              photos={photos}
              pastEntries={pastEntries}
              currentWeek={week}
              userTier={userTier}
              onUpdatePhoto={(w, newPhoto) => {
                setPhotos(prev => {
                  const filtered = prev.filter(p => p.week !== w);
                  return [...filtered, newPhoto];
                });
              }}
              onClose={() => setIsBookPreviewOpen(false)}
              onGoToJournal={() => {
                setIsBookPreviewOpen(false);
                setActiveTab('jurnal');
              }}
              onOpenUpgradeModal={() => {
                setIsBookPreviewOpen(false);
                openCheckout('upgrade_vip');
              }}
            />
          </React.Suspense>
        )}

        {/* Login / Daftar (email + password) */}
        <LoginModal
          isOpen={isLoginOpen}
          defaultMode={loginMode}
          onClose={() => setIsLoginOpen(false)}
          onSuccess={handleLoginSuccess}
        />

        {/* Gate Checkout Modal */}
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          defaultPlan={checkoutDefaultPlan}
          currentTier={isPaid ? userTier : 'none'}
          onSuccess={(email, tier, amount, consent) => {
            setIsCheckoutOpen(false);
            setIsPaid(true);
            setUserEmail(email);
            setUserTier(tier);
            storageSet('bunda_is_paid', 'true');
            storageSet('bunda_user_email', email);
            notifyUserChanged(email);
            storageSet('bunda_user_tier', tier);
            // Untuk Meta Purchase di /success: nominal + waktu checkout.
            storageSet('bunda_last_paid_amount', String(amount));
            storageSet('bunda_last_paid_at', String(Date.now()));
            if (typeof consent === 'boolean') {
              storageSet('bunda_promo_consent', consent ? 'true' : 'false');
            }

            // Sinkronisasi background ke Supabase
            syncSubscriptionToSupabase(email, tier, amount);
            // Magic link email-only (langsung masuk Beranda, tanpa OTP)
            sendMagicLink(email);

            // Navigate to /success
            setIsSuccessPage(true);
            try {
              window.history.pushState({}, '', '#/success');
            } catch {}

            if (tier === 'vip') {
              showToast('Selamat! Paket VIP aktif seumur hidup.');
            } else {
              showToast('Pembayaran berhasil! Bunda Journal Aktif.');
            }
          }}
        />

        {/* Pop-up pengingat (saat app terlihat) */}
        {reminderQueue.length > 0 && (
          <ReminderPopup
            reminder={reminderQueue[0]}
            onClose={() => setReminderQueue((prev) => prev.slice(1))}
            onOpenJournal={() => {
              setReminderQueue((prev) => prev.slice(1));
              setIsBookPreviewOpen(false);
              setActiveTab('jurnal');
              try { window.history.pushState({}, '', '#/jurnal'); } catch {}
            }}
          />
        )}

        {/* TC05: Mandatory Onboarding Dialog */}
        <OnboardingModal
          isOpen={!isSuccessPage && ((!isLoggedIn && isPaid && !isOnboarded) || (isLoggedIn && !isOnboarded))}
          onComplete={(data) => {
            const updatedProfile = {
              ...userProfile,
              name: data.name,
              babyNickname: data.babyNickname,
              hplDate: data.hplDate || userProfile.hplDate,
              doctorName: data.doctorName || userProfile.doctorName,
            };
            setUserProfile(updatedProfile);
            setWeek(data.week);
            setIsOnboarded(true);
            setIsLoggedIn(true);
            setActiveTab('home');
            storageSet('bunda_is_onboarded', 'true');
            storageSet('bunda_isLoggedIn', 'true');
            storageSet('bunda_week', String(data.week));
            storageSet('bunda_profile', JSON.stringify(updatedProfile));

            // Simpan profil ke Supabase
            syncProfileToSupabase({
              ...updatedProfile,
              currentWeek: data.week,
            });

            showToast(`Selamat datang di Bunda Journal, Bunda ${data.name}!`);
          }}
        />

        {/* TC10: PIC Management Dialog (/pic) */}
        <PicModal 
          isOpen={isPicOpen} 
          onClose={() => {
            setIsPicOpen(false);
            if (window.location.pathname === '/pic' || window.location.hash === '#/pic') {
              window.history.pushState({}, '', '/');
            }
          }}
          onShowToast={showToast}
        />
      </div>
    </div>
  );
}
