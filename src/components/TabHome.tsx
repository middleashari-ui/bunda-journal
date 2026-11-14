import { storageGet } from '../lib/storage/appStorage';
import React, { useRef, useState, useEffect, lazy, Suspense } from 'react';
import { HabitState, UserProfile, JournalEntry, ReminderSettings, PhotoMemory } from '../types';
import { getWeekData, AVAILABLE_WEEKS } from '../data/pregnancyWeeks';
import { DashboardOverview } from './dashboard/DashboardOverview';
import { Check, BookOpen, ChevronLeft, ChevronRight, ArrowRight, PenLine, Sparkles, Scale, Heart } from 'lucide-react';

const MoodTrendChart = lazy(() => import('./MoodTrendChart').then(m => ({ default: m.MoodTrendChart })));
const FetalGrowthChart = lazy(() => import('./FetalGrowthChart').then(m => ({ default: m.FetalGrowthChart })));

interface TabHomeProps {
  week: number;
  setWeek: (week: number) => void;
  habits: HabitState;
  toggleHabit: (key: keyof HabitState) => void;
  userProfile: UserProfile;
  pastEntries: JournalEntry[];
  selectedMood: number;
  reminderSettings: ReminderSettings;
  onUpdateReminderSettings: (newSettings: ReminderSettings) => void;
  onShowToast?: (message: string) => void;
  onGoToJournal: () => void;
  onGoToKatalog?: () => void;
  onGoToStudio?: () => void;
  photos: PhotoMemory[];
  onUpdatePhoto: (week: number, photo: PhotoMemory) => void;
}

export const TabHome: React.FC<TabHomeProps> = ({
  week,
  setWeek,
  habits,
  toggleHabit,
  userProfile,
  pastEntries,
  selectedMood,
  reminderSettings,
  onUpdateReminderSettings,
  onShowToast,
  onGoToJournal,
  onGoToKatalog,
  onGoToStudio,
  photos,
  onUpdatePhoto,
}) => {
  const weekData = getWeekData(week);
  const completedHabitsCount = Object.values(habits).filter(Boolean).length;
  const dayOfPregnancy = (week - 1) * 7 + 4; // realistic day approximation

  // Refs and state for draggable pill carousel
  const carouselRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [dragMoved, setDragMoved] = useState(false);

  // Auto-scroll active week into center of carousel
  useEffect(() => {
    if (activeBtnRef.current && carouselRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [week]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setDragMoved(false);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeftState(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      setDragMoved(true);
    }
    carouselRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // State ringkasan jurnal minggu ini
  const [journalSummary, setJournalSummary] = useState<{
    daysCount: number;
    weight: string;
    bloodPressure: string;
    hasDoctorNote: boolean;
    latestNotePreview: string;
  }>({
    daysCount: 0,
    weight: '',
    bloodPressure: '',
    hasDoctorNote: false,
    latestNotePreview: '',
  });

  useEffect(() => {
    const loadSummary = () => {
      try {
        let count = 0;
        let preview = '';
        const savedDaily = storageGet(`bunda_daily_w${week}`);
        if (savedDaily) {
          const parsed = JSON.parse(savedDaily);
          Object.values(parsed).forEach((text: any) => {
            if (typeof text === 'string' && text.trim().length > 0) {
              count++;
              if (!preview) preview = text.trim();
            }
          });
        }

        let w = '';
        let bp = '';
        let doc = false;
        const savedStats = storageGet(`bunda_momstats_w${week}`);
        if (savedStats) {
          const parsedStats = JSON.parse(savedStats);
          if (parsedStats.weight) w = parsedStats.weight;
          if (parsedStats.bloodPressure) bp = parsedStats.bloodPressure;
          if (parsedStats.doctorNote && parsedStats.doctorNote.trim().length > 0) doc = true;
        }

        setJournalSummary({
          daysCount: count,
          weight: w,
          bloodPressure: bp,
          hasDoctorNote: doc,
          latestNotePreview: preview,
        });
      } catch {}
    };

    loadSummary();
    window.addEventListener('bunda_journal_updated', loadSummary);
    window.addEventListener('storage', loadSummary);
    return () => {
      window.removeEventListener('bunda_journal_updated', loadSummary);
      window.removeEventListener('storage', loadSummary);
    };
  }, [week]);

  return (
    <div className="px-5 py-4 space-y-4">
      {/* Greeting Banner */}
      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-3xl border border-stone-200/60 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#556B2F]">
            Trimester {weekData.trimester} • Hari ke-{dayOfPregnancy}
          </span>
          <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
            Bulan ke-{weekData.month}
          </span>
        </div>
        <h2 className="font-serif text-xl font-bold text-stone-850 mt-1.5 leading-snug">
          Minggu ke-{week}, {userProfile.name ? userProfile.name.split(' ')[0] : 'Bunda'}.
        </h2>
        <p className="text-xs text-stone-500 mt-1 font-light leading-relaxed">
          {weekData.fruitName ? `Si kecil sekarang sebesar ${weekData.fruitName.toLowerCase()}. ` : ''}
          Pelan-pelan saja — catatan hari ini akan jadi halaman yang Bunda baca lagi nanti.
        </p>

        {/* Quick Week Switcher with Drag Slider & Draggable Carousel */}
        <div className="mt-3 pt-2.5 border-t border-stone-100 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-stone-500">
            <span className="font-medium">Geser Minggu Kehamilan:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400 text-[10px]">
                {week <= 13 ? 'Trimester 1' : week <= 27 ? 'Trimester 2' : 'Trimester 3'}
              </span>
              <span className="text-[#556B2F] font-bold bg-[#556B2F]/10 px-2 py-0.5 rounded-md text-[10px]">
                Mg {week}
              </span>
            </div>
          </div>

          {/* Interactive Range Slider Track ("Bisa Digeser") */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeek(Math.max(5, week - 1))}
              disabled={week <= 5}
              aria-label="Minggu sebelumnya"
              className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-stone-600 shrink-0 text-xs transition-colors cursor-pointer active:scale-95 shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="relative flex-1 py-1">
              <input
                type="range"
                min="5"
                max="40"
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
                className="w-full accent-[#556B2F] cursor-grab active:cursor-grabbing h-2.5 bg-stone-200/90 rounded-lg transition-all"
                title={`Geser untuk memilih minggu: Minggu ke-${week}`}
              />
              <div className="flex justify-between items-center text-[9px] text-stone-400 mt-0.5 px-0.5">
                <span>Mg 5</span>
                <span>Mg 13 (T1)</span>
                <span>Mg 27 (T2)</span>
                <span>Mg 40 (Lahir)</span>
              </div>
            </div>

            <button
              onClick={() => setWeek(Math.min(40, week + 1))}
              disabled={week >= 40}
              aria-label="Minggu berikutnya"
              className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-stone-600 shrink-0 text-xs transition-colors cursor-pointer active:scale-95 shadow-2xs"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Draggable & Scrollable Week Pills with Mouse Drag and Smooth Scroll */}
          <div
            ref={carouselRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-0.5 select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {AVAILABLE_WEEKS.map((w) => (
              <button
                key={w}
                ref={w === week ? activeBtnRef : null}
                onClick={() => {
                  if (!dragMoved) {
                    setWeek(w);
                  }
                }}
                className={`px-2.5 py-1 text-xs rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
                  week === w
                    ? 'bg-[#556B2F] text-white shadow-xs font-semibold scale-105'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                W{w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Growth Card (Si Kecil seukuran...) */}
      <div className="bg-[#FAF8F5] p-5 rounded-3xl border border-stone-200/70 shadow-sm relative overflow-hidden text-center">
        {/* Soft presentation container */}
        <div className="w-24 h-24 mx-auto rounded-full bg-stone-100 border border-stone-200/80 shadow-2xs flex items-center justify-center relative mb-3">
          <span className="text-4xl select-none">
            {weekData.fruitEmoji}
          </span>
          <span className="absolute bottom-0 right-0 p-1 bg-[#556B2F] text-white rounded-full text-xs shadow-xs">
            <Check className="w-3 h-3 stroke-[3]" />
          </span>
        </div>

        <h3 className="font-serif text-lg font-bold text-stone-850">
          Si Kecil seukuran {weekData.fruitName}
        </h3>
        <p className="text-xs text-stone-600 mt-1 max-w-[280px] mx-auto font-light leading-relaxed italic font-serif">
          "{weekData.quote}"
        </p>

        <div className="mt-4 pt-3 border-t border-stone-200/60 grid grid-cols-4 gap-2 text-center text-stone-600">
          <div className="p-1">
            <span className="block text-[9px] text-stone-400 uppercase tracking-wider">Panjang</span>
            <span className="font-serif font-bold text-stone-800 text-xs sm:text-sm">{weekData.lengthCm}</span>
          </div>
          <div className="p-1 border-l border-stone-200/60">
            <span className="block text-[9px] text-stone-400 uppercase tracking-wider">Berat</span>
            <span className="font-serif font-bold text-stone-800 text-xs sm:text-sm">{weekData.weightGrams}</span>
          </div>
          <div className="p-1 border-l border-stone-200/60">
            <span className="block text-[9px] text-stone-400 uppercase tracking-wider">Jantung</span>
            <span className="font-serif font-bold text-stone-800 text-xs sm:text-sm">{weekData.heartbeatBpm}</span>
          </div>
          <div className="p-1 border-l border-stone-200/60">
            <span className="block text-[9px] text-stone-400 uppercase tracking-wider">Sisa Waktu</span>
            <span className="font-serif font-bold text-[#C87A64] text-xs sm:text-sm">{weekData.daysLeft} Hari</span>
          </div>
        </div>

        {/* Developmental Milestones Bullet points */}
        <div className="mt-4 text-left bg-white/70 rounded-2xl p-3 border border-stone-200/50">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block mb-1.5">
            Perkembangan Minggu Ini:
          </span>
          <ul className="space-y-1.5 text-xs text-stone-600 font-light">
            {weekData.highlights.map((point, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-[#556B2F] font-bold mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RINGKASAN DASHBOARD READ-ONLY (Toggle Harian / Mingguan / Bulanan) */}
      <DashboardOverview week={week} onOpenJournal={onGoToJournal} photos={photos} onUpdatePhoto={onUpdatePhoto} />

      {/* KURVA PERTUMBUHAN JANIN (WHO & Hadlock Standards) - Lazy Loaded */}
      <Suspense fallback={
        <div className="bg-white p-6 rounded-3xl border border-stone-200/70 shadow-xs flex items-center justify-center min-h-[140px] text-stone-400 text-xs">
          <span>Memuat kurva pertumbuhan janin...</span>
        </div>
      }>
        <FetalGrowthChart
          currentWeek={week}
          onSelectWeek={setWeek}
        />
      </Suspense>

      {/* VISUAL MOOD & SLEEP TREND CHART (Recharts) - Lazy Loaded */}
      <Suspense fallback={
        <div className="bg-white p-6 rounded-3xl border border-stone-200/70 shadow-xs flex items-center justify-center min-h-[140px] text-stone-400 text-xs">
          <span>Memuat tren suasana hati...</span>
        </div>
      }>
        <MoodTrendChart 
          entries={pastEntries}
          currentMoodIndex={selectedMood}
          habits={habits}
          onGoToJournal={onGoToJournal}
        />
      </Suspense>


      {/* Upsell Banner to Studio */}
      <div 
        onClick={() => {
          if (onGoToStudio) onGoToStudio();
          else if (onGoToKatalog) onGoToKatalog();
        }}
        className="bg-white p-3.5 rounded-3xl border border-stone-200/60 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#556B2F]/40 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#556B2F]/10 flex items-center justify-center text-[#556B2F]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-800">Studio Buku Kenangan</p>
            <p className="text-[10px] text-stone-500 font-light">Personalisasi 100 halaman & sampul kain linen</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-stone-400" />
      </div>
    </div>
  );
};
