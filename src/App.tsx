import React, { useState, useEffect } from 'react';
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
import { PrintBookStudio } from './components/bookPrint/PrintBookStudio';
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

const INITIAL_PHOTOS: PhotoMemory[] = [
  { 
    id: 1, 
    caption: 'USG Trimester 1 (12W)', 
    date: '12 Okt 2024', 
    src: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80',
    week: 12 
  },
  { 
    id: 2, 
    caption: 'Baby Bump Pertama', 
    date: '08 Okt 2024', 
    src: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=400&q=80',
    week: 11 
  }
];

const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-1',
    week: 12,
    date: '12 Okt 2024',
    text: 'Hari ini detak jantungmu terdengar begitu jelas saat kontrol dokter. Bahagia dan haru sekali, nak...',
    moodIndex: 2,
    habitsSnapshot: { water: true, vitamins: true, walk: true, sleep: true },
    sleepHours: 8.5,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'entry-2',
    week: 11,
    date: '05 Okt 2024',
    text: 'Bunda mulai merasakan mual berkurang. Ayah membawakan buah pir manis kesukaanmu pagi ini.',
    moodIndex: 1,
    habitsSnapshot: { water: true, vitamins: true, walk: false, sleep: true },
    sleepHours: 8.0,
    createdAt: Date.now() - 86400000 * 9,
  },
  {
    id: 'entry-3',
    week: 10,
    date: '28 Sep 2024',
    text: 'Tidur nyenyak semalam setelah prenatal yoga ringan. Nafsu makan mulai membaik.',
    moodIndex: 0,
    habitsSnapshot: { water: true, vitamins: true, walk: true, sleep: true },
    sleepHours: 8.2,
    createdAt: Date.now() - 86400000 * 16,
  },
  {
    id: 'entry-4',
    week: 9,
    date: '21 Sep 2024',
    text: 'Sedikit lelah di sore hari, tapi senyum ayah selalu menyemangati bunda.',
    moodIndex: 3,
    habitsSnapshot: { water: true, vitamins: true, walk: false, sleep: false },
    sleepHours: 6.8,
    createdAt: Date.now() - 86400000 * 23,
  },
  {
    id: 'entry-5',
    week: 8,
    date: '14 Sep 2024',
    text: 'Mendengarkan alunan lembut bersama si kecil di perut. Hati terasa begitu tenang.',
    moodIndex: 0,
    habitsSnapshot: { water: true, vitamins: true, walk: true, sleep: true },
    sleepHours: 8.0,
    createdAt: Date.now() - 86400000 * 30,
  }
];

export default function App() {
  // App navigation & layout state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('bunda_isLoggedIn') !== 'false';
  });
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);

  // Core Pregnancy Data State
  const [week, setWeek] = useState<number>(() => {
    const saved = localStorage.getItem('bunda_week');
    return saved ? parseInt(saved, 10) : 12;
  });

  const [journalText, setJournalText] = useState<string>(() => {
    return localStorage.getItem('bunda_journal_text') || 
      'Hari ini detak jantungmu terdengar begitu jelas saat kontrol dokter. Bahagia dan haru sekali, nak...';
  });
  const [journalSaved, setJournalSaved] = useState<boolean>(true);

  const [habits, setHabits] = useState<HabitState>(() => {
    const saved = localStorage.getItem('bunda_habits');
    return saved ? JSON.parse(saved) : {
      water: true,
      vitamins: true,
      walk: false,
      sleep: true,
      yoga: false,
    };
  });

  const [selectedMood, setSelectedMood] = useState<number>(() => {
    const saved = localStorage.getItem('bunda_mood');
    return saved ? parseInt(saved, 10) : 2;
  });

  const [photos, setPhotos] = useState<PhotoMemory[]>(() => {
    const saved = localStorage.getItem('bunda_photos');
    return saved ? JSON.parse(saved) : INITIAL_PHOTOS;
  });

  const [pastEntries, setPastEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('bunda_entries');
    return saved ? JSON.parse(saved) : INITIAL_ENTRIES;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('bunda_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Bunda Jessica Anindya',
      babyNickname: 'Si Kecil',
      hplDate: '18 Mei 2025',
      doctorName: 'dr. Anita, Sp.OG',
      hospitalName: 'RSIA Bunda Menteng',
      bloodType: 'O+'
    };
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
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

  // Apply saved color theme on startup
  useEffect(() => {
    applyAppColorTheme(getSavedAppColorTheme());
  }, []);

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
            onClick={() => setIsBookPreviewOpen(true)}
            className="px-2 py-0.5 rounded-lg font-semibold transition-colors cursor-pointer text-[10px] bg-[#C87A64]/15 hover:bg-[#C87A64]/25 text-[#C87A64] border border-[#C87A64]/30 flex items-center gap-1"
            title="Format Utama Cetak 100 Halaman B5"
          >
            <BookOpen className="w-3 h-3" />
            <span>Format B5 (100 Hal)</span>
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
          isPhoneFrame 
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
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* CONDITION 1: Landing Page (Exact Match to screenshot Image_1) */}
        {!isLoggedIn ? (
          <LandingPage onEnterApp={() => {
            setIsLoggedIn(true);
            setActiveTab('home');
            localStorage.setItem('bunda_isLoggedIn', 'true');
          }} />
        ) : (
          /* CONDITION 2: Authenticated App with 4 Tabs */
          <div className="flex flex-col h-full min-h-screen bg-[#F5F2EB] text-[#292524] relative pb-[calc(5rem+env(safe-area-inset-bottom,0px))] select-none">
            {/* App Sticky Header */}
            <header className="px-5 pt-3 pb-2.5 flex items-center justify-between border-b border-stone-200/50 bg-[#F5F2EB]/95 backdrop-blur-md sticky top-0 z-30">
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold tracking-tight text-[#292524]">bunda.</span>
              </div>
              <div className="text-[11px] font-sans font-medium text-stone-600 bg-stone-200/50 px-2.5 py-0.5 rounded-full">
                W{week} • Trimester {week <= 13 ? 1 : week <= 27 ? 2 : 3}
              </div>
            </header>

            {/* Main Scrollable Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar">
              {activeTab === 'home' && (
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
              )}

              {activeTab === 'jurnal' && (
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
              )}

              {(activeTab === 'studio' || activeTab === 'katalog') && (
                <TabKatalog 
                  userProfile={userProfile}
                  photos={photos}
                  journalText={journalText}
                  onOpenBookPreview={() => setIsBookPreviewOpen(true)}
                  onPlaceOrder={handlePlaceOrder}
                />
              )}

              {activeTab === 'profil' && (
                <TabProfil 
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  notificationsEnabled={notificationsEnabled}
                  setNotificationsEnabled={setNotificationsEnabled}
                  reminderSettings={reminderSettings}
                  setReminderSettings={setReminderSettings}
                  onShowToast={showToast}
                  isSyncing={isSyncing}
                  syncSuccess={syncSuccess}
                  onSync={triggerGoogleDriveSync}
                  onLogout={() => setIsLoggedIn(false)}
                  journalEntries={pastEntries}
                  photos={photos}
                  habits={habits}
                />
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
                  onClick={() => setActiveTab('home')} 
                  className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'home' ? 'text-[#556B2F] font-semibold' : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-1.5'}`} />
                  <span className="text-[11px] mt-0.5 tracking-tight font-sans">Beranda</span>
                </button>

                <button 
                  id="nav-tab-jurnal"
                  onClick={() => setActiveTab('jurnal')} 
                  className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'jurnal' ? 'text-[#556B2F] font-semibold' : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <BookMarked className={`w-5 h-5 ${activeTab === 'jurnal' ? 'stroke-[2.5]' : 'stroke-1.5'}`} />
                  <span className="text-[11px] mt-0.5 tracking-tight font-sans">Jurnal</span>
                </button>

                <button 
                  id="nav-tab-studio"
                  onClick={() => {
                    setActiveTab('studio');
                    setIsBookPreviewOpen(true);
                  }} 
                  className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'studio' || isBookPreviewOpen ? 'text-[#556B2F] font-semibold' : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <BookOpen className={`w-5 h-5 ${activeTab === 'studio' || isBookPreviewOpen ? 'stroke-[2.5]' : 'stroke-1.5'}`} />
                  <span className="text-[11px] mt-0.5 tracking-tight font-sans">Studio</span>
                </button>

                <button 
                  id="nav-tab-profil"
                  onClick={() => setActiveTab('profil')} 
                  className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'profil' ? 'text-[#556B2F] font-semibold' : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <User className={`w-5 h-5 ${activeTab === 'profil' ? 'stroke-[2.5]' : 'stroke-1.5'}`} />
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
            onClose={() => setIsBookPreviewOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
