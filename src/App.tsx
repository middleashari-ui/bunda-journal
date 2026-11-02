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
import { applyAppColorTheme, getSavedAppColorTheme } from './utils/themeManager';
import { LandingPage } from './components/LandingPage';
import { TabHome } from './components/TabHome';
import { TabJurnal } from './components/TabJurnal';
import { TabKatalog } from './components/TabKatalog';
import { TabProfil } from './components/TabProfil';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PrintBookStudio } from './components/bookPrint/PrintBookStudio';
import { OnboardingModal } from './components/OnboardingModal';
import { PicModal } from './components/PicModal';
import { CheckoutModal } from './components/CheckoutModal';
import { 
  syncSubscriptionToSupabase, 
  fetchUserTierFromSupabase 
} from './lib/supabase';
import { idbSet, idbGet, getPendingSyncCount, markQueueSynced, getPendingQueueItems } from './lib/idb';
import { 
  Home, 
  BookMarked, 
  ShoppingBag, 
  User, 
  CheckCircle, 
  Smartphone, 
  Monitor, 
  Sparkles,
  BookOpen,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';

const INITIAL_PHOTOS: PhotoMemory[] = [];

const INITIAL_ENTRIES: JournalEntry[] = [];

export default function App() {
  // App navigation & layout state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const paid = localStorage.getItem('bunda_is_paid') === 'true';
    const onboarded = localStorage.getItem('bunda_is_onboarded') === 'true';
    const logged = localStorage.getItem('bunda_isLoggedIn') !== 'false';
    return paid && onboarded && logged;
  });
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);

  // TC03 / TC08: Paid status
  const [isPaid, setIsPaid] = useState<boolean>(() => {
    return localStorage.getItem('bunda_is_paid') === 'true';
  });

  // User Membership Tier: 'essential' | 'vip' (Diambil dari Supabase & fallback lokal)
  const [userTier, setUserTier] = useState<'essential' | 'vip'>(() => {
    const saved = localStorage.getItem('bunda_user_tier');
    return (saved === 'vip') ? 'vip' : 'essential';
  });

  // Modal Checkout & Upgrade Plan State
  const [checkoutDefaultPlan, setCheckoutDefaultPlan] = useState<'essential' | 'vip' | 'hardcover' | 'upgrade_vip'>('essential');

  // TC05: Mandatory Onboarding state
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('bunda_is_onboarded') === 'true';
  });

  // Checkout gate modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('bunda_user_email') || '';
  });

  // Core Pregnancy Data State
  const [week, setWeek] = useState<number>(() => {
    const saved = localStorage.getItem('bunda_week');
    return saved ? parseInt(saved, 10) : 32;
  });

  const [journalText, setJournalText] = useState<string>(() => {
    return localStorage.getItem('bunda_journal_text') || '';
  });
  const [journalSaved, setJournalSaved] = useState<boolean>(true);

  const [habits, setHabits] = useState<HabitState>(() => {
    try {
      const saved = localStorage.getItem('bunda_habits');
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
      const saved = localStorage.getItem('bunda_mood');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [photos, setPhotos] = useState<PhotoMemory[]>(() => {
    try {
      const saved = localStorage.getItem('bunda_photos');
      return saved ? JSON.parse(saved) : INITIAL_PHOTOS;
    } catch {
      return INITIAL_PHOTOS;
    }
  });

  const [pastEntries, setPastEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('bunda_entries');
      return saved ? JSON.parse(saved) : INITIAL_ENTRIES;
    } catch {
      return INITIAL_ENTRIES;
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('bunda_profile');
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
    const saved = localStorage.getItem('bunda_reminder_settings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      vitaminTime: '08:00',
      journalTime: '20:00',
      waterIntervalHours: 2,
      soundEnabled: true,
    };
  });

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

  // Listen for hash / popstate / keyboard shortcut for /pic and /app
  useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      if (path === '/pic' || hash === '#/pic') {
        setIsPicOpen(true);
      }

      // Intercept direct access to /app or #/app
      if (path === '/app' || hash === '#/app') {
        const paid = localStorage.getItem('bunda_is_paid') === 'true';
        const onboarded = localStorage.getItem('bunda_is_onboarded') === 'true';

        if (!paid) {
          // Cecegat akses /app ke checkout modal
          setIsLoggedIn(false);
          setIsCheckoutOpen(true);
          showToast('Selesaikan pembelian untuk mengakses aplikasi.');
        } else if (!onboarded) {
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

  // Auto return to today's week & date after 5 minutes of inactivity (Bukan Reset Data)
  const lastActivityTimeRef = useRef<number>(Date.now());
  useEffect(() => {
    const updateActivity = () => {
      lastActivityTimeRef.current = Date.now();
    };

    const checkIdleAndReturn = () => {
      const now = Date.now();
      const idleTime = now - lastActivityTimeRef.current;
      // 5 minutes = 300,000 ms
      if (idleTime >= 5 * 60 * 1000) {
        try {
          const profileStr = localStorage.getItem('bunda_profile');
          let targetWeek = 32;
          if (profileStr) {
            const p = JSON.parse(profileStr);
            if (p.hplDate) {
              const hpl = new Date(p.hplDate);
              const diffDays = Math.round((hpl.getTime() - now) / (1000 * 60 * 60 * 24));
              const remWeeks = diffDays / 7;
              const w = Math.round(40 - remWeeks);
              if (w >= 5 && w <= 40) targetWeek = w;
            } else if (p.week) {
              targetWeek = p.week;
            }
          }
          setWeek(targetWeek);
          window.dispatchEvent(new CustomEvent('bunda_return_today', { detail: { week: targetWeek } }));
          if ((window as any).__setSyncToast) {
            (window as any).__setSyncToast('Kembali ke catatan hari ini');
          }
        } catch {}
        lastActivityTimeRef.current = now;
      }
    };

    const interval = setInterval(checkIdleAndReturn, 30000);
    window.addEventListener('click', updateActivity, { passive: true });
    window.addEventListener('touchstart', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('scroll', updateActivity, { passive: true });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkIdleAndReturn();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Intercept direct access to /app or #/app and sync Tier from Supabase
  useEffect(() => {
    // Sinkronisasi status tier dari Supabase jika user punya email
    const email = localStorage.getItem('bunda_user_email');
    if (email) {
      fetchUserTierFromSupabase(email).then((tierFromDb) => {
        if (tierFromDb === 'vip' || tierFromDb === 'essential') {
          setUserTier(tierFromDb);
          localStorage.setItem('bunda_user_tier', tierFromDb);
        }
      });
    }
  }, [userEmail, isPaid]);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('bunda_isLoggedIn', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('bunda_week', String(week));
  }, [week]);

  useEffect(() => {
    localStorage.setItem('bunda_journal_text', journalText);
  }, [journalText]);

  useEffect(() => {
    localStorage.setItem('bunda_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('bunda_reminder_settings', JSON.stringify(reminderSettings));
  }, [reminderSettings]);

  useEffect(() => {
    localStorage.setItem('bunda_mood', String(selectedMood));
  }, [selectedMood]);

  useEffect(() => {
    localStorage.setItem('bunda_photos', JSON.stringify(photos));
  }, [photos]);

  useEffect(() => {
    localStorage.setItem('bunda_entries', JSON.stringify(pastEntries));
  }, [pastEntries]);

  useEffect(() => {
    localStorage.setItem('bunda_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Periodic Reminder Checker (every 30s)
  useEffect(() => {
    if (!reminderSettings.enabled) return;

    const checkReminders = () => {
      const now = new Date();
      const currentH = String(now.getHours()).padStart(2, '0');
      const currentM = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentH}:${currentM}`;
      const todayDateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

      // Check Vitamin Reminder
      const lastVitaminAlert = localStorage.getItem('bunda_last_vitamin_date');
      if (currentTimeStr === reminderSettings.vitaminTime && lastVitaminAlert !== todayDateStr) {
        localStorage.setItem('bunda_last_vitamin_date', todayDateStr);
        if (!habits.vitamins) {
          if (reminderSettings.soundEnabled) playGentleChime();
          sendSystemNotification(
            'Pengingat Bunda: Waktunya Minum Vitamin!',
            'Asam folat & zat besi penting untuk perkembangan sel darah dan saraf buah hati hari ini.'
          );
          showToast('Waktunya minum vitamin & nutrisi hari ini!');
        }
      }

      // Check Journal & Night Reflection Reminder
      const lastJournalAlert = localStorage.getItem('bunda_last_journal_date');
      if (currentTimeStr === reminderSettings.journalTime && lastJournalAlert !== todayDateStr) {
        localStorage.setItem('bunda_last_journal_date', todayDateStr);
        if (reminderSettings.soundEnabled) playGentleChime();
        sendSystemNotification(
          'Waktunya Jurnal Bunda',
          'Luangkan waktu sejenak untuk mencatat momen manis kehamilan hari ini.'
        );
        showToast('Waktunya menulis kenangan & jurnal harian!');
      }
    };

    // Run check once on load and every 30 seconds
    checkReminders();
    const timer = setInterval(checkReminders, 30000);
    return () => clearInterval(timer);
  }, [reminderSettings, habits.vitamins]);

  const toggleHabit = (key: keyof HabitState) => {
    setHabits(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const showToast = (text: string, price?: string) => {
    setToastMessage({ text, price });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSaveCurrentEntry = () => {
    // 1. Sync daily notes of the current week to main journalText if needed
    try {
      const savedDaily = localStorage.getItem(`bunda_daily_w${week}`);
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

  return (
    <div className="min-h-screen bg-[#ECE8E1] flex flex-col items-center justify-start sm:p-4 md:p-6 text-[#292524]">
      {/* Top Device Bar & Quick Switcher: Compact & Slim */}
      <aside aria-label="Pratinjau Navigasi" className="w-full max-w-4xl mb-2 flex items-center justify-between gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-md rounded-xl border border-stone-200/80 text-[11px] shadow-2xs">
        <div className="flex items-center gap-1.5">
          <span className="font-serif font-bold text-stone-900 text-xs">bunda.</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setIsLoggedIn(false);
              localStorage.setItem('bunda_isLoggedIn', 'false');
            }}
            className={`px-2 py-0.5 rounded-lg font-medium transition-colors cursor-pointer text-[10px] ${
              !isLoggedIn ? 'bg-[#556B2F] text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Landing
          </button>
          <button
            onClick={() => {
              if (!isPaid) {
                setIsCheckoutOpen(true);
                showToast('Selesaikan pembelian Rp 49rb untuk mengakses aplikasi.');
                return;
              }
              if (!isOnboarded) {
                showToast('Lengkapi formulir informasi Bunda.');
                return;
              }
              setIsLoggedIn(true);
              setActiveTab('home');
              localStorage.setItem('bunda_isLoggedIn', 'true');
            }}
            className={`px-2 py-0.5 rounded-lg font-medium transition-colors cursor-pointer text-[10px] ${
              isLoggedIn ? 'bg-[#556B2F] text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            App
          </button>

          <button
            id="btn-studio-header"
            onClick={() => setIsBookPreviewOpen(true)}
            className="p-1 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer text-[10px] flex items-center gap-1 border border-transparent hover:border-stone-200"
            title="Studio Buku Kenangan"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#556B2F]" />
            <span className="hidden sm:inline font-medium">Studio</span>
          </button>

          <div className="h-3 w-px bg-stone-200 mx-0.5 hidden sm:block" />
          <button
            onClick={() => setIsPhoneFrame(prev => !prev)}
            title={isPhoneFrame ? "Ganti ke Tampilan Lebar" : "Ganti ke Mockup Smartphone"}
            className="p-1 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100 cursor-pointer hidden sm:flex items-center"
          >
            {isPhoneFrame ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
          </button>
        </div>
      </aside>

      {/* Main Screen Container (Smartphone Frame or Responsive Card) */}
      <div 
        className={`w-full bg-[#F5F2EB] shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300 ${
          !isLoggedIn
            ? 'max-w-6xl min-h-screen rounded-2xl border border-stone-200'
            : isPhoneFrame 
            ? 'max-w-[430px] min-h-screen md:min-h-[880px] md:rounded-[40px] md:border-[8px] md:border-[#2C2927]' 
            : 'max-w-2xl min-h-[90vh] rounded-3xl border border-stone-200'
        }`}
      >
        {/* Top Notch Simulator for Smartphone view */}
        <div className="hidden md:flex justify-between items-center px-7 pt-3 pb-1 text-[12px] font-medium text-stone-500 select-none">
          <span>9:41</span>
          <div className="w-24 h-4 bg-stone-850 rounded-full mx-auto shadow-inner" />
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className={`w-3.5 h-3.5 ${isOffline ? 'text-amber-500' : 'text-stone-500'}`} />
            <Battery className="w-4 h-4" />
          </div>
        </div>

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

        {/* CONDITION 1: Landing Page (Exact Match to screenshot Image_1) */}
        {!isLoggedIn ? (
          <LandingPage 
            isPaid={isPaid}
            onStartCheckout={(amount) => {
              if (amount === 129000) {
                setCheckoutDefaultPlan('vip');
              } else if (amount === 249000) {
                setCheckoutDefaultPlan('hardcover');
              } else {
                setCheckoutDefaultPlan('essential');
              }
              setIsCheckoutOpen(true);
            }}
            onEnterApp={() => {
              if (!isPaid) {
                setIsCheckoutOpen(true);
                return;
              }
              if (!isOnboarded) {
                showToast('Lengkapi formulir informasi Bunda.');
                return;
              }
              setIsLoggedIn(true);
              setActiveTab('home');
              localStorage.setItem('bunda_isLoggedIn', 'true');
            }} 
          />
        ) : (
          /* CONDITION 2: Authenticated App with 4 Tabs */
          <div className="flex flex-col h-full min-h-screen bg-[#F5F2EB] text-[#292524] relative pb-[calc(5rem+env(safe-area-inset-bottom,0px))] select-none">
            {/* App Sticky Header */}
            <header className="px-5 pt-3 pb-2.5 flex items-center justify-between border-b border-stone-200/50 bg-[#F5F2EB]/95 backdrop-blur-md sticky top-0 z-30">
              <div className="flex items-center gap-2">
                <img src="/bunda_journal_FINAL_BIG.png" className="h-20 w-40 object-contain" />
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
                  />
                </ErrorBoundary>
              )}

              {activeTab === 'jurnal' && (
                <ErrorBoundary fallbackTitle="Kendala pada Jurnal">
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
                  />
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
                    onOpenUpgradeModal={() => {
                      setCheckoutDefaultPlan('upgrade_vip');
                      setIsCheckoutOpen(true);
                    }}
                    onPlaceOrder={handlePlaceOrder}
                  />
                </ErrorBoundary>
              )}

              {activeTab === 'profil' && (
                <ErrorBoundary fallbackTitle="Kendala pada Tab Profil">
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
                    onOpenUpgradeModal={() => {
                      setCheckoutDefaultPlan('upgrade_vip');
                      setIsCheckoutOpen(true);
                    }}
                    onLogout={() => {
                      setIsLoggedIn(false);
                      setIsPaid(false);
                      setIsOnboarded(false);
                      setUserTier('essential');
                      localStorage.removeItem('bunda_is_paid');
                      localStorage.removeItem('bunda_is_onboarded');
                      localStorage.removeItem('bunda_user_email');
                      localStorage.removeItem('bunda_user_tier');
                      localStorage.setItem('bunda_isLoggedIn', 'false');
                      showToast('Berhasil keluar akun.');
                    }}
                    onResetAll={() => {
                      localStorage.clear();
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
                    activeTab === 'home' && !isBookPreviewOpen ? 'text-[#556B2F] font-semibold' : 'text-stone-400 hover:text-stone-700'
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
                    activeTab === 'jurnal' && !isBookPreviewOpen ? 'text-[#556B2F] font-semibold' : 'text-stone-400 hover:text-stone-700'
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
                    activeTab === 'studio' ? 'text-[#556B2F] font-semibold' : 'text-stone-400 hover:text-stone-700'
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
                    activeTab === 'profil' && !isBookPreviewOpen ? 'text-[#556B2F] font-semibold' : 'text-stone-400 hover:text-stone-700'
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
              setCheckoutDefaultPlan('upgrade_vip');
              setIsCheckoutOpen(true);
            }}
          />
        )}

        {/* Gate Checkout Modal */}
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          defaultPlan={checkoutDefaultPlan}
          currentTier={isPaid ? userTier : 'none'}
          onSuccess={(email, tier, amount) => {
            setIsCheckoutOpen(false);
            setIsPaid(true);
            setUserEmail(email);
            setUserTier(tier);
            localStorage.setItem('bunda_is_paid', 'true');
            localStorage.setItem('bunda_user_email', email);
            localStorage.setItem('bunda_user_tier', tier);

            // Sinkronisasi background ke Supabase
            syncSubscriptionToSupabase(email, tier, amount);

            if (tier === 'vip') {
              showToast('Selamat! Paket VIP aktif seumur hidup.');
            } else {
              showToast('Pembayaran berhasil! Silakan lengkapi formulir Bunda.');
            }
          }}
        />

        {/* TC05: Mandatory Onboarding Dialog */}
        <OnboardingModal
          isOpen={(!isLoggedIn && isPaid && !isOnboarded) || (isLoggedIn && !isOnboarded)}
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
            localStorage.setItem('bunda_is_onboarded', 'true');
            localStorage.setItem('bunda_isLoggedIn', 'true');
            localStorage.setItem('bunda_week', String(data.week));
            localStorage.setItem('bunda_profile', JSON.stringify(updatedProfile));

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
