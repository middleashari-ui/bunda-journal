import { storageGet } from '../../lib/storage/appStorage';
import React, { useState, memo, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Pill,
  Droplets,
  Footprints,
  Moon,
  BookHeart,
  ArrowRight,
  Camera,
  Quote,
  Flame,
} from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';
import { getWeekHabits, getWeekHabitScore, subscribeHabits, DAY_NAMES } from '../../lib/habitStore';
import { getWeekDatesMonday, fmtDayMonth, isSameDay, getTodayPosition } from '../../lib/pregnancyDate';
import { shrinkImageSource } from '../../lib/imageResize';
import { isMediaKey, mediaGet } from '../../lib/mediaStore';
import { getDailyJasmani, getWeeklyJasmani, getMonthlyJasmani } from '../../lib/jasmaniStore';
import { PhotoMemory } from '../../types';

type TimeframeOption = 'harian' | 'mingguan' | 'bulanan';

interface DashboardOverviewProps {
  /** Minggu kehamilan yang sedang dibuka (opsional; fallback ke localStorage). */
  week?: number;
  /** Buka halaman Jurnal dari kartu kenangan. */
  onOpenJournal?: () => void;
  /** Foto minggu ini (sumber sama dengan Jurnal & buku cetak). */
  photos?: PhotoMemory[];
  /** Simpan foto minggu ini; menulis ke bunda_photos lewat parent. */
  onUpdatePhoto?: (week: number, photo: PhotoMemory) => void;
}

const MOOD_EMOJI = ['🥰', '😊', '🥺', '😫'];
const MOOD_LABEL = ['Sangat bahagia', 'Tenang', 'Cemas', 'Lelah'];

function readJson<T>(key: string): T | null {
  try {
    const raw = isMediaKey(key) ? mediaGet(key) : storageGet(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Catatan harian per minggu: { Sen: '...', Sel: '...' } */
function readWeekNotes(week: number): Record<string, string> {
  const raw = readJson<Record<string, string>>(`bunda_daily_w${week}`) || {};
  return raw && typeof raw === 'object' ? raw : {};
}

function readWeekMoods(week: number): Array<number | null> {
  const raw = readJson<Array<number | null>>(`bunda_daily_moods_w${week}`);
  return Array.isArray(raw) ? raw : [];
}

function readPhotoForWeek(week: number): string {
  const list = readJson<any[]>('bunda_photos') || [];
  const found = list.find((p) => p && Number(p.week) === week);
  return found?.src || '';
}

/** Ring skor — dipakai di hero mingguan. */
const ScoreRing: React.FC<{ pct: number; size?: number }> = ({ pct, size = 88 }) => {
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#EDE7DC" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#556B2F"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-xl font-bold text-stone-800 leading-none">{pct}%</span>
        <span className="text-[8px] uppercase tracking-widest text-stone-400 mt-0.5">ritme</span>
      </div>
    </div>
  );
};

const DayDots: React.FC<{ vitamin: boolean; water: boolean; activity: boolean; hasData?: boolean }> = ({
  vitamin,
  water,
  activity,
  hasData = false,
}) => {
  const dot = (done: boolean, color: string) => {
    if (done) return color;
    // ada data tapi belum tuntas: warna samar (bukan abu polos)
    return hasData ? `${color}55` : '#DED8CD';
  };
  return (
    <div className="flex items-center justify-center gap-[3px]">
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot(vitamin, '#556B2F') }} />
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot(water, '#0ea5e9') }} />
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot(activity, '#C87A64') }} />
    </div>
  );
};

function buildNarrative(overallPct: number, daysLogged: number): string {
  if (daysLogged === 0) return 'Minggu ini masih tenang. Satu catatan kecil hari ini sudah cukup untuk memulai cerita.';
  if (overallPct >= 80) return `${daysLogged} hari Bunda jaga ritme dengan rapi. Si kecil tumbuh dalam ritme yang tenang.`;
  if (overallPct >= 50) return `${daysLogged} hari sudah tercatat. Tidak harus sempurna — yang penting Bunda hadir.`;
  return `Minggu ini lebih pelan, dan itu tidak apa-apa. Tubuh Bunda juga sedang bekerja keras.`;
}

const DashboardOverviewInner: React.FC<DashboardOverviewProps> = ({ week, onOpenJournal, photos: photoList, onUpdatePhoto }) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('mingguan');
  const { waterLiters, waterTarget, supplements, activityGoals } = useHealthData();

  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  // Ikut perubahan dari Jurnal / halaman lain tanpa perlu refresh.
  const [, setHabitTick] = useState(0);
  useEffect(() => subscribeHabits(() => setHabitTick((t) => t + 1)), []);

  const weekNum = useMemo(() => {
    if (typeof week === 'number' && week > 0) return week;
    const stored = Number(storageGet('bunda_week'));
    return stored > 0 ? stored : getTodayPosition().week;
  }, [week]);

  const dates = useMemo(() => getWeekDatesMonday(weekNum), [weekNum]);
  const days = useMemo(() => getWeekHabits(weekNum), [weekNum]);
  const score = useMemo(() => getWeekHabitScore(weekNum), [weekNum]);
  const notes = useMemo(() => readWeekNotes(weekNum), [weekNum]);
  const moods = useMemo(() => readWeekMoods(weekNum), [weekNum]);
  const storedPhoto = useMemo(() => {
    if (photoList && photoList.length > 0) {
      const found = photoList.find((p) => p && Number(p.week) === weekNum);
      if (found?.src) return found.src;
    }
    return readPhotoForWeek(weekNum);
  }, [photoList, weekNum]);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdatePhoto) return;
    setIsUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('read-failed'));
        reader.readAsDataURL(file);
      });
      const src = await shrinkImageSource(dataUrl);
      const next: PhotoMemory = {
        week: weekNum,
        src,
        caption: `Momen minggu ${weekNum}`,
      } as PhotoMemory;
      onUpdatePhoto(weekNum, next);
    } catch {
      // diam saja: foto lama tetap tampil
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const todayIdx = useMemo(
    () => dates.findIndex((d) => isSameDay(d, new Date())),
    [dates]
  );

  const [selectedDay, setSelectedDay] = useState<number>(() => (todayIdx >= 0 ? todayIdx : 0));
  useEffect(() => {
    if (todayIdx >= 0) setSelectedDay(todayIdx);
    else setSelectedDay(0);
  }, [weekNum, todayIdx]);

  const liveSupplements = supplements.filter((s) => s.taken).length;

  const dayIsLive = selectedDay === todayIdx;
  const selected = days[selectedDay];

  const selectedNote = notes[DAY_NAMES[selectedDay]] || '';
  const selectedMood = typeof moods[selectedDay] === 'number' ? (moods[selectedDay] as number) : null;

  const liveWater = dayIsLive ? waterLiters : (selected?.waterMl || 0) / 1000;
  const liveWalk = dayIsLive ? activityGoals.walkMinutes : selected?.walkMinutes || 0;
  const liveWorkout = dayIsLive ? activityGoals.workoutMinutes : selected?.workoutMinutes || 0;
  const liveSleep = dayIsLive ? activityGoals.sleepHours : selected?.sleepHours || 0;
  const liveVitamins = dayIsLive
    ? Math.max(liveSupplements, selected?.supplementsTaken || 0)
    : selected?.supplementsTaken || 0;

  const waterPct = Math.min(100, Math.round((liveWater / Math.max(0.1, waterTarget)) * 100));
  const activityPct = Math.min(100, Math.round(((liveWalk + liveWorkout) / 30) * 100));
  const vitaminPct = Math.min(100, Math.round((liveVitamins / Math.max(1, supplements.length)) * 100));

  // Perbandingan dengan minggu lalu — memberi rasa "ada perkembangan"
  const prevWeekScore = useMemo(() => {
    if (weekNum <= 1) return null;
    const prev = getWeekHabitScore(weekNum - 1);
    return prev.daysLogged > 0 ? prev : null;
  }, [weekNum]);
  const scoreDelta = prevWeekScore ? score.overallPct - prevWeekScore.overallPct : null;

  const totalWaterLiters = useMemo(
    () => days.reduce((acc, d) => acc + d.waterMl, 0) / 1000,
    [days]
  );

  // Kata yang ditulis minggu ini — pemicu "memori" saat membaca ulang
  const wordCount = useMemo(
    () =>
      Object.values(notes).reduce((acc, text) => {
        const clean = String(text || '').trim();
        if (!clean) return acc;
        return acc + clean.split(/\s+/).length;
      }, 0),
    [notes]
  );

  // Streak: hari berturut dengan minimal satu kebiasaan selesai.
  // Kalau hari ini belum diisi, hitung sampai kemarin (lebih adil & memotivasi).
  const streak = useMemo(() => {
    let count = 0;
    let start = todayIdx >= 0 ? todayIdx : 6;
    const isDone = (i: number) => {
      const d = days[i];
      return !!d && (d.vitaminDone || d.waterDone || d.activityDone);
    };
    if (!isDone(start)) start -= 1;
    for (let i = start; i >= 0; i -= 1) {
      if (!isDone(i)) break;
      count += 1;
    }
    return count;
  }, [days, todayIdx]);

  const longestNote = useMemo(() => {
    let best = { day: '', text: '' };
    Object.entries(notes).forEach(([day, text]) => {
      if (String(text || '').length > best.text.length) best = { day, text: String(text) };
    });
    return best;
  }, [notes]);

  const hasAnyData = score.daysLogged > 0 || wordCount > 0;

  const weekRangeLabel = useMemo(() => {
    if (!dates[0] || !dates[6]) return '';
    return `${fmtDayMonth(dates[0])} – ${fmtDayMonth(dates[6])}`;
  }, [dates]);

  const handleOpenJournal = useCallback(() => {
    onOpenJournal?.();
  }, [onOpenJournal]);

  const jasmani = useMemo(() => {
    if (timeframe === 'harian') return getDailyJasmani(weekNum, selectedDay);
    if (timeframe === 'mingguan') return getWeeklyJasmani(weekNum);
    const base = dates[0] ?? new Date();
    return getMonthlyJasmani(base.getFullYear(), base.getMonth());
  }, [timeframe, weekNum, selectedDay, dates]);

  const jasmaniLabel =
    timeframe === 'harian'
      ? `${DAY_NAMES[selectedDay]}${dates[selectedDay] ? ` • ${fmtDayMonth(dates[selectedDay])}` : ''}`
      : timeframe === 'mingguan'
      ? 'Minggu ini'
      : (dates[0] ?? new Date()).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  if (!ready) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <div className="h-6 w-40 rounded-full bg-stone-200/60 animate-pulse" />
        <div className="h-40 rounded-[26px] bg-stone-100/70 animate-pulse" />
        <div className="h-24 rounded-[22px] bg-stone-100/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="dashboard-story">
      {/* ===================== HEADER ===================== */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[#8A8178] font-semibold">
            Cerita minggu {weekNum}
          </p>
          <h3 className="font-serif text-[19px] leading-tight text-stone-800 mt-0.5">
            {hasAnyData ? 'Catatan kecil Bunda' : 'Mulai satu cerita'}
          </h3>
          {weekRangeLabel && (
            <p className="text-[10px] text-stone-400 mt-0.5 font-light">{weekRangeLabel}</p>
          )}
        </div>

        <div className="flex bg-[#F1ECE4] p-[3px] rounded-full border border-[#E7DFD3]">
          {(['harian', 'mingguan', 'bulanan'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTimeframe(tab)}
              aria-pressed={timeframe === tab}
              className={`px-2.5 py-1 text-[10px] rounded-full capitalize transition-all cursor-pointer ${
                timeframe === tab
                  ? 'bg-white text-stone-800 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ===================== HERO (Harian & Mingguan) ===================== */}
      {timeframe !== 'bulanan' && (
        <div
          className="relative overflow-hidden rounded-[26px] border border-[#E9E1D4] bg-[#FDFBF7] p-4 animate-in fade-in duration-300"
          style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset, 0 8px 24px -18px rgba(60,50,40,0.35)' }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(200,122,100,0.16), transparent 70%)' }}
          />

          <div className="flex items-center gap-4">
            <ScoreRing pct={timeframe === 'harian' ? Math.round((waterPct + vitaminPct + activityPct) / 3) : score.overallPct} />
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A8178] font-semibold">
                {timeframe === 'harian'
                  ? dayIsLive
                    ? 'Hari ini'
                    : `${DAY_NAMES[selectedDay]}${dates[selectedDay] ? ` • ${fmtDayMonth(dates[selectedDay])}` : ''}`
                  : 'Ritme minggu ini'}
              </p>
              <p className="font-serif text-[15px] leading-snug text-stone-800 mt-1">
                {timeframe === 'harian'
                  ? liveVitamins > 0 || liveWater > 0
                    ? 'Tubuh Bunda sedang dirawat hari ini.'
                    : 'Belum ada catatan hari ini — mulai dari segelas air.'
                  : buildNarrative(score.overallPct, score.daysLogged)}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 text-[9.5px] text-[#556B2F] bg-[#F1F4EA] border border-[#E3E9D6] px-1.5 py-0.5 rounded-full">
                  <Pill className="w-2.5 h-2.5" />
                  {timeframe === 'harian' ? vitaminPct : score.vitaminPct}% vitamin
                </span>
                <span className="inline-flex items-center gap-1 text-[9.5px] text-sky-700 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded-full">
                  <Droplets className="w-2.5 h-2.5" />
                  {timeframe === 'harian' ? waterPct : score.waterPct}% air
                </span>
                <span className="inline-flex items-center gap-1 text-[9.5px] text-[#A25E4B] bg-[#FBEEE9] border border-[#F2DCD4] px-1.5 py-0.5 rounded-full">
                  <Footprints className="w-2.5 h-2.5" />
                  {timeframe === 'harian' ? activityPct : score.activityPct}% gerak
                </span>
              </div>
              {timeframe === 'mingguan' && scoreDelta !== null && (
                <p className={`text-[9.5px] mt-1.5 font-medium ${scoreDelta >= 0 ? 'text-[#556B2F]' : 'text-[#A25E4B]'}`}>
                  {scoreDelta >= 0 ? '▲' : '▼'} {Math.abs(scoreDelta)}% dibanding minggu lalu
                </p>
              )}
            </div>
          </div>

          {/* Strip 7 hari */}
          <div className="mt-4 pt-3 border-t border-[#EFE8DC]">
            <div className="grid grid-cols-7 gap-1">
              {days.map((d, idx) => {
                const isToday = idx === todayIdx;
                const isActive = idx === selectedDay;
                const hasData = d.hasData || (isToday && (liveVitamins > 0 || liveWater > 0));
                return (
                  <button
                    key={d.dayName}
                    type="button"
                    onClick={() => {
                      setSelectedDay(idx);
                      if (timeframe === 'mingguan') setTimeframe('harian');
                    }}
                    className={`group flex flex-col items-center gap-1 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white border-[#D9D2C5] shadow-[0_2px_6px_-4px_rgba(60,50,40,0.45)]'
                        : 'border-transparent hover:bg-white/70'
                    }`}
                    title={`${d.dayName}: ${hasData ? 'ada catatan' : 'belum ada catatan'}`}
                  >
                    <span className={`text-[8.5px] uppercase tracking-wider ${isToday ? 'text-[#C87A64] font-bold' : 'text-stone-400'}`}>
                      {d.dayName}
                    </span>
                    <span className="font-serif text-[12px] leading-none text-stone-700">
                      {dates[idx] ? dates[idx].getDate() : '\u00A0'}
                    </span>
                    <DayDots
                      vitamin={d.vitaminDone}
                      water={d.waterDone}
                      activity={d.activityDone}
                      hasData={d.hasData || (isToday && (liveVitamins > 0 || liveWater > 0))}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-center text-[8.5px] text-stone-400 mt-1.5">
              Ketuk hari untuk membaca catatannya
            </p>
          </div>
        </div>
      )}

      {/* ===================== DETAIL HARI (Harian) ===================== */}
      {timeframe === 'harian' && (
        <div className="rounded-[24px] border border-[#EDE6DA] bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A8178] font-semibold">
                {selectedMood !== null ? MOOD_LABEL[selectedMood] : 'Catatan hari'}
              </p>
              <p className="font-serif text-[15px] text-stone-800 mt-0.5">
                {DAY_NAMES[selectedDay]}, {dates[selectedDay] ? fmtDayMonth(dates[selectedDay]) : '–'}
              </p>
            </div>
            {selectedMood !== null && <span className="text-2xl leading-none">{MOOD_EMOJI[selectedMood]}</span>}
          </div>

          {selectedNote ? (
            <div className="relative mt-3 pl-3">
              <span className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full bg-[#E7DDCD]" />
              <p className="font-serif italic text-[13px] leading-relaxed text-stone-600 line-clamp-4">
                “{selectedNote}”
              </p>
            </div>
          ) : (
            <p className="mt-3 text-[11.5px] text-stone-400 font-light leading-relaxed">
              Belum ada tulisan untuk hari ini. Satu kalimat pendek pun cukup untuk dikenang nanti.
            </p>
          )}

          <div className="grid grid-cols-4 gap-1.5 mt-3.5">
            {[
              { icon: Pill, value: `${liveVitamins}`, label: 'vitamin', color: '#556B2F', bg: '#F1F4EA', pct: vitaminPct },
              { icon: Droplets, value: liveWater.toFixed(1), label: 'liter', color: '#0369a1', bg: '#EFF7FD', pct: waterPct },
              { icon: Footprints, value: `${liveWalk + liveWorkout}`, label: 'menit', color: '#A25E4B', bg: '#FBEEE9', pct: activityPct },
              { icon: Moon, value: `${liveSleep}`, label: 'jam', color: '#4A6B82', bg: '#EFF4F8', pct: Math.min(100, Math.round((liveSleep / 8) * 100)) },
            ].map((s, i) => (
              <div key={i} className="rounded-xl px-1.5 py-2 text-center" style={{ backgroundColor: s.bg }}>
                <s.icon className="w-3 h-3 mx-auto mb-1" style={{ color: s.color }} />
                <p className="font-serif text-[13px] font-bold text-stone-800 leading-none">{s.value}</p>
                <p className="text-[8px] text-stone-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {onOpenJournal && (
            <button
              type="button"
              onClick={handleOpenJournal}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#F5F1E9] hover:bg-[#EFE9DE] text-[11px] font-semibold text-[#556B2F] transition-colors cursor-pointer"
            >
              <BookHeart className="w-3.5 h-3.5" />
              Lanjut menulis di Jurnal
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* ===================== MOMEN MINGGU INI (Mingguan) ===================== */}
      {timeframe === 'mingguan' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[20px] border border-[#EDE6DA] bg-[#F8F4EC] p-3">
              <div className="flex items-center gap-1.5 text-[#A25E4B]">
                <Flame className="w-3 h-3" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Streak</span>
              </div>
              <p className="font-serif text-2xl text-stone-800 mt-1 leading-none">{streak}</p>
              <p className="text-[9.5px] text-stone-500 mt-1 leading-snug">
                {streak > 0 ? 'hari berturut Bunda jaga ritme' : 'mulai satu hari hari ini'}
              </p>
            </div>

            <div className="rounded-[20px] border border-[#EDE6DA] bg-white p-3">
              <div className="flex items-center gap-1.5 text-[#556B2F]">
                <Quote className="w-3 h-3" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">Tulisan</span>
              </div>
              <p className="font-serif text-2xl text-stone-800 mt-1 leading-none">{wordCount}</p>
              <p className="text-[9.5px] text-stone-500 mt-1 leading-snug">
                kata Bunda tulis minggu ini
              </p>
            </div>
          </div>

          {/* Kartu kenangan: catatan terpanjang / foto minggu */}
          <div className="rounded-[24px] border border-[#EDE6DA] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A8178] font-semibold">
                Momen minggu ini
              </p>
              <span aria-hidden className="w-6 h-px bg-[#D9D2C5]" />
            </div>

            {longestNote.text ? (
              <button
                type="button"
                onClick={onOpenJournal}
                className="w-full text-left group cursor-pointer"
              >
                <p className="font-serif italic text-[12.5px] leading-relaxed text-stone-600 line-clamp-3 group-hover:text-stone-800 transition-colors">
                  “{longestNote.text}”
                </p>
                <span className="inline-flex items-center gap-1 mt-2 text-[9.5px] font-semibold text-[#556B2F]">
                  Baca di jurnal <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </button>
            ) : (
              <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                Belum ada tulisan minggu ini. Cerita paling sederhana pun layak disimpan.
              </p>
            )}

            {/* Polaroid kenangan — motif washi tape yang sama dengan buku cetak */}
            <div className="mt-3 pt-3 border-t border-[#F2EDE4]">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={!onUpdatePhoto || isUploading}
                className="group relative mx-auto w-[76%] rotate-[-2deg] block text-left cursor-pointer disabled:cursor-default"
                aria-label={storedPhoto ? 'Ganti foto minggu ini' : 'Tambah foto minggu ini'}
                title={onUpdatePhoto ? 'Ketuk untuk unggah foto minggu ini' : undefined}
              >
                <span
                  aria-hidden
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-16 h-3 rounded-[2px]"
                  style={{ backgroundColor: 'rgba(200,122,100,0.38)' }}
                />
                <div className="bg-white p-1.5 pb-3 border border-[#EFE7DA] shadow-[0_8px_18px_-12px_rgba(60,50,40,0.55)]">
                  <div className="relative aspect-[4/3] bg-[#F5F1E9] overflow-hidden flex items-center justify-center">
                    {storedPhoto ? (
                      <img src={storedPhoto} alt={`Momen minggu ${weekNum}`} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-stone-400" />
                    )}
                    {onUpdatePhoto && (
                      <span className="absolute inset-0 bg-black/35 text-white text-[9.5px] font-medium flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-3 h-3" />
                        {isUploading ? 'Menyimpan…' : storedPhoto ? 'Ganti foto' : 'Tambah foto'}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-center font-serif italic text-[10px] text-stone-500 truncate px-1">
                    {storedPhoto ? `Momen minggu ${weekNum}` : 'Belum ada foto minggu ini'}
                  </p>
                </div>
              </button>
              <p className="text-center text-[9px] text-stone-400 mt-2 leading-snug">
                {storedPhoto
                  ? 'Foto ini akan ikut tercetak di buku kenangan.'
                  : onUpdatePhoto
                    ? 'Ketuk bingkai untuk menambah foto — otomatis masuk ke Jurnal.'
                    : 'Tambahkan dari halaman Jurnal agar ikut tercetak.'}
              </p>
            </div>
          </div>

          {/* Rincian angka, dibuat ringan supaya tidak terasa seperti dashboard */}
          <div className="rounded-[22px] border border-[#EDE6DA] bg-white/70 px-4 py-3">
            <div className="grid grid-cols-3 divide-x divide-[#F0EAE0] text-center">
              <div>
                <p className="text-[8.5px] uppercase tracking-wider text-stone-400">Air</p>
                <p className="font-serif text-[15px] text-stone-800 mt-0.5">
                  {totalWaterLiters > 0 ? totalWaterLiters.toFixed(1) : '0'}{' '}
                  <span className="text-[9px] text-stone-400">L</span>
                </p>
                <p className="text-[8px] text-stone-400">total minggu</p>
              </div>
              <div>
                <p className="text-[8.5px] uppercase tracking-wider text-stone-400">Gerak</p>
                <p className="font-serif text-[15px] text-stone-800 mt-0.5">
                  {days.reduce((a, d) => a + d.activityMinutes, 0)}{' '}
                  <span className="text-[9px] text-stone-400">mnt</span>
                </p>
                <p className="text-[8px] text-stone-400">jalan & senam</p>
              </div>
              <div>
                <p className="text-[8.5px] uppercase tracking-wider text-stone-400">Tidur</p>
                <p className="font-serif text-[15px] text-stone-800 mt-0.5">
                  {days.filter((d) => d.sleepHours > 0).length
                    ? (days.reduce((a, d) => a + d.sleepHours, 0) / days.filter((d) => d.sleepHours > 0).length).toFixed(1)
                    : '0'}{' '}
                  <span className="text-[9px] text-stone-400">jam</span>
                </p>
                <p className="text-[8px] text-stone-400">rerata malam</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===================== BULANAN ===================== */}
      {timeframe === 'bulanan' && (
        <div className="rounded-[26px] border border-[#EDE6DA] bg-[#FDFBF7] p-5 space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
          <div className="flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A8178] font-semibold">
              Rekap minggu ini
            </p>
            <span className="text-[9px] text-[#556B2F] bg-[#F1F4EA] border border-[#E3E9D6] px-2 py-0.5 rounded-full">
              {score.daysLogged} hari tercatat
            </span>
          </div>

          <div>
            <p className="font-serif text-[26px] leading-tight text-stone-800">
              {wordCount} kata tentang si kecil
            </p>
            <p className="text-[11px] text-stone-500 mt-1.5 font-light leading-relaxed">
              Ritme minggu ini: <span className="text-stone-700 font-medium">{score.vitaminPct}% vitamin</span>,{' '}
              <span className="text-stone-700 font-medium">{score.waterPct}% air</span>,{' '}
              <span className="text-stone-700 font-medium">{score.activityPct}% gerak</span>. Angka ini bukan
              penilaian — ini jejak kecil bahwa Bunda hadir untuk si kecil.
            </p>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Vitamin & suplemen', pct: score.vitaminPct, color: '#556B2F' },
              { label: 'Hidrasi', pct: score.waterPct, color: '#0369a1' },
              { label: 'Gerak & aktivitas', pct: score.activityPct, color: '#A25E4B' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-[9.5px] text-stone-500 mb-1">
                  <span>{row.label}</span>
                  <span className="font-semibold text-stone-700">{row.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#F0EAE0] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="font-serif italic text-[11.5px] text-stone-500 leading-relaxed border-t border-[#F0EAE0] pt-3">
            “Suatu hari nanti, halaman ini akan dibaca oleh orang yang paling Bunda cintai — dan ia akan tahu
            betapa ia ditunggu.”
          </p>
        </div>
      )}

      {/* ===================== PEMANTAUAN JASMANI ===================== */}
      <div className="rounded-[22px] border border-[#EDE6DA] bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A8178] font-semibold">
            Gerak &amp; Tidur Bunda
          </p>
          <span className="text-[9.5px] text-stone-400">{jasmaniLabel}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2">
          {[
            { dot: '🟠', label: 'Jalan', value: `${jasmani.jalanMin} mnt`, pct: jasmani.pct.jalan },
            { dot: '🟢', label: 'Senam', value: `${jasmani.senamMin} mnt`, pct: jasmani.pct.senam },
            {
              dot: '🔵',
              label: 'Tidur',
              value: `${jasmani.tidurAvg ? jasmani.tidurAvg.toFixed(1) : '—'} jam`,
              pct: jasmani.pct.tidur,
            },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[9px] text-stone-500">{item.dot} {item.label}</p>
              <p className="font-serif text-[14px] font-semibold text-stone-800 leading-tight mt-0.5">
                {item.value}
              </p>
              <p className="text-[8.5px] text-stone-400">{item.pct}% dari target</p>
            </div>
          ))}
        </div>

        <p className="text-[9px] text-stone-400 mt-2">
          {jasmani.days} hari tercatat · ringkasan {timeframe}
        </p>
      </div>

      {/* ===================== EMPTY STATE ===================== */}
      {!hasAnyData && (
        <div className="rounded-[22px] border border-dashed border-[#DED6C8] bg-white/60 p-4 text-center">
          <BookHeart className="w-5 h-5 text-[#C87A64] mx-auto mb-1.5" />
          <p className="font-serif text-[13px] text-stone-700">Belum ada cerita minggu ini</p>
          <p className="text-[10.5px] text-stone-500 mt-1 font-light leading-relaxed">
            Catat suplemen, air, atau satu kalimat hari ini. Ringkasan akan tumbuh sendiri.
          </p>
        </div>
      )}
    </div>
  );
};

// Render 1x per perubahan data — cegah flicker antar tab Beranda/Jurnal/Studio
export const DashboardOverview = memo(DashboardOverviewInner);
