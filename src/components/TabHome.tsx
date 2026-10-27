import React, { useRef, useState, useEffect } from 'react';
import { HabitState, UserProfile, JournalEntry, ReminderSettings } from '../types';
import { getWeekData, AVAILABLE_WEEKS } from '../data/pregnancyWeeks';
import { MoodTrendChart } from './MoodTrendChart';
import { FetalGrowthChart } from './FetalGrowthChart';
import { DashboardOverview } from './dashboard/DashboardOverview';
import { Check, BookOpen, ChevronLeft, ChevronRight, ArrowRight, PenLine, Sparkles, Scale, Heart } from 'lucide-react';

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
        const savedDaily = localStorage.getItem(`bunda_daily_w${week}`);
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
        const savedStats = localStorage.getItem(`bunda_momstats_w${week}`);
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
          Halo {userProfile.name.split(' ')[0] || 'Bunda'}, selamat datang di Minggu ke-{week}!
        </h2>
        <p className="text-xs text-stone-500 mt-1 font-light leading-relaxed">
          Tubuh Bunda sedang bekerja luar biasa merajut organ-organ kecil buah hati tersayang.
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

      {/* RINGKASAN DASHBOARD READ-ONLY (Toggle Harian / Mingguan / Bulanan) */}
      <DashboardOverview />

      {/* KARTU KESIMPULAN JURNAL MINGGU INI (Tersambung Langsung ke Jurnal & Studio Buku) */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/70 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#556B2F]/10 flex items-center justify-center text-[#556B2F]">
              <PenLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-stone-850">
                Kesimpulan Jurnal Minggu ke-{week}
              </h3>
              <p className="text-[10px] text-stone-400">
                Terintegrasi otomatis ke Halaman Buku Cetak B5
              </p>
            </div>
          </div>

          <button
            onClick={onGoToJournal}
            className="text-[10.5px] font-semibold text-[#556B2F] hover:text-[#465926] bg-[#556B2F]/10 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Tulis / Edit</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* 3 Metrik Utama Mingguan */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-stone-50/80 p-2.5 rounded-2xl border border-stone-100 text-center">
            <span className="text-[9.5px] text-stone-400 font-medium block">Catatan Terisi</span>
            <span className="font-serif font-bold text-stone-800 text-xs sm:text-sm">
              {journalSummary.daysCount}/7 Hari
            </span>
          </div>

          <div className="bg-stone-50/80 p-2.5 rounded-2xl border border-stone-100 text-center">
            <span className="text-[9.5px] text-stone-400 font-medium block">Berat Badan</span>
            <span className="font-serif font-bold text-stone-800 text-xs sm:text-sm">
              {journalSummary.weight ? `${journalSummary.weight} kg` : '-'}
            </span>
          </div>

          <div className="bg-stone-50/80 p-2.5 rounded-2xl border border-stone-100 text-center">
            <span className="text-[9.5px] text-stone-400 font-medium block">Tekanan Darah</span>
            <span className="font-serif font-bold text-[#556B2F] text-xs sm:text-sm">
              {journalSummary.bloodPressure || '-'}
            </span>
          </div>
        </div>

        {/* Cuplikan Catatan Terbaru Bunda */}
        <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-amber-900/10 text-xs">
          <div className="flex items-center gap-1.5 text-stone-500 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#C87A64]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-600">
              Kutipan Catatan Minggu Ini
            </span>
          </div>
          <p className="font-serif italic text-stone-700 leading-relaxed text-[11.5px] line-clamp-2">
            {journalSummary.latestNotePreview 
              ? `"${journalSummary.latestNotePreview}"`
              : 'Belum ada catatan harian yang ditulis untuk minggu ini. Ketuk tombol untuk mulai menulis kenangan.'}
          </p>
        </div>
      </div>

      {/* Growth Card */}
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

      {/* KURVA PERTUMBUHAN JANIN (WHO & Hadlock Standards) */}
      <FetalGrowthChart
        currentWeek={week}
        onSelectWeek={setWeek}
      />

      {/* VISUAL MOOD & SLEEP TREND CHART (Recharts) */}
      <MoodTrendChart 
        entries={pastEntries}
        currentMoodIndex={selectedMood}
        habits={habits}
        onGoToJournal={onGoToJournal}
      />


      {/* Quick Access Card */}
      <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
        <div>
          <p className="font-serif text-sm font-bold text-stone-850">Ingin menulis catatan?</p>
          <p className="text-xs text-stone-600 font-light">Abadikan momen dan perkembangan minggu ini.</p>
        </div>
        <button 
          onClick={onGoToJournal}
          className="px-3.5 py-2 bg-[#C87A64] text-white rounded-xl text-xs font-medium hover:bg-[#b56b56] transition-colors shadow-xs shrink-0 cursor-pointer flex items-center gap-1"
        >
          <span>Buka Jurnal</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

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
            <p className="text-xs font-bold text-stone-800">Studio Buku Kenangan B5</p>
            <p className="text-[10px] text-stone-500 font-light">Personalisasi 100 halaman & sampul kain linen</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-stone-400" />
      </div>
    </div>
  );
};
