import { storageGet, storageSet } from '../../../lib/storage/appStorage';
import React, { useRef, useState, useEffect } from 'react';
import { getWeekData } from '../../../data/pregnancyWeeks';
import { getWeekDatesMonday, fmtDayMonth, fmtWeekRange } from '../../../lib/pregnancyDate';
import { BookThemeConfig } from '../../../types/bookPrint';
import { PhotoMemory, JournalEntry } from '../../../types';
import { Camera, Check, Edit2 } from 'lucide-react';
import { readDayHabits, isHabitDone, toggleHabitDone, getWeekHabits, getWeekHabitScore, setSupplementTaken, writeActivity } from '../../../lib/habitStore';
import { getWeeklyJasmani, subscribeJasmaniSummary, JASMANI_TARGETS } from '../../../lib/jasmaniStore';
import { DAILY_NOTE_MAX_CHARS, DAILY_NOTE_LINE_CHARS, clampDailyNote } from '../../../config/journal';

// Batas catatan harian diambil dari satu sumber: src/config/journal.ts

const MONTHS_SHORT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Suplemen yang dipakai Beranda (id = key di bunda_{week}_{day}_suplemen)
const SUPPLEMENT_ROWS: Array<{ id: string; label: string }> = [
  { id: 'asamFolat', label: 'Asam folat' },
  { id: 'vitaminD', label: 'Vit D' },
  { id: 'dha', label: 'DHA' },
  { id: 'kalsium', label: 'Kalsium' },
  { id: 'zatBesi', label: 'Zat besi' },
];

/** "2026-11-06" -> "6 Nov 2026" (format yang dipakai benchmark). */
function formatDisplayDate(raw: string): string {
  const value = String(raw || '').trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!iso) return value;
  const day = Number(iso[3]);
  const month = Number(iso[2]) - 1;
  const year = Number(iso[1]);
  if (month < 0 || month > 11) return value;
  return `${day} ${MONTHS_SHORT_ID[month]} ${year}`;
}

interface WeeklyJournalSpreadProps {
  week: number;
  theme: BookThemeConfig;
  leftPageNum: number;
  rightPageNum: number;
  journalEntry?: JournalEntry;
  photo?: PhotoMemory;
  isFillMode?: boolean;
  onUpdatePhoto?: (week: number, photo: PhotoMemory) => void;
}

export const WeeklyJournalSpread: React.FC<WeeklyJournalSpreadProps> = ({
  week,
  theme,
  leftPageNum,
  rightPageNum,
  journalEntry,
  photo,
  isFillMode = true,
  onUpdatePhoto,
}) => {
  const weekData = getWeekData(week);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User-editable state with direct two-way sync with TabJurnal & LocalStorage
  // Tanggal minggu: pakai tanggal ASLI minggu itu (Sen–Min), BUKAN tanggal hari ini.
  // Kalau tidak bisa dihitung -> '-', jangan tampilkan tanggal dummy.
  const [dateText, setDateText] = useState<string>(() => {
    if (journalEntry?.date) return formatDisplayDate(journalEntry.date);
    const range = fmtWeekRange(week);
    return range || '-';
  });

  const weekDates = getWeekDatesMonday(week);

  const [dailyTexts, setDailyTexts] = useState<Record<string, string>>(() => {
    try {
      const saved = storageGet(`bunda_daily_w${week}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    const senText = journalEntry?.text ? journalEntry.text.slice(0, 80) : '';
    return {
      Sen: senText,
      Sel: '',
      Rab: '',
      Kam: '',
      Jum: '',
      Sab: '',
      Min: '',
    };
  });

  const [momWeight, setMomWeight] = useState<string>(() => {
    try {
      const saved = storageGet(`bunda_momstats_w${week}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.weight) return parsed.weight;
      }
    } catch {}
    return '54.5';
  });

  const [momWaist, setMomWaist] = useState<string>(() => {
    try {
      const saved = storageGet(`bunda_momstats_w${week}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.waist) return parsed.waist;
      }
    } catch {}
    return '82';
  });

  const [momBp, setMomBp] = useState<string>(() => {
    try {
      const saved = storageGet(`bunda_momstats_w${week}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.bloodPressure) return parsed.bloodPressure;
      }
    } catch {}
    return '118/76';
  });

  const [doctorNote, setDoctorNote] = useState<string>(() => {
    try {
      const saved = storageGet(`bunda_momstats_w${week}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.doctorNote) return parsed.doctorNote;
      }
    } catch {}
    return `• Panjang janin ~${weekData.lengthCm}, berat ~${weekData.weightGrams}.\n• Detak jantung terpantau normal ${weekData.heartbeatBpm}.\n• Teruskan vitamin asam folat & asupan air 2 liter.`;
  });

  // Re-sync states whenever week, external journalEntry, or bunda_journal_updated event changes
  useEffect(() => {
    const handleSync = () => {
      try {
        const savedDaily = storageGet(`bunda_daily_w${week}`);
        if (savedDaily) {
          setDailyTexts(JSON.parse(savedDaily));
        } else {
          const senText = journalEntry?.text ? journalEntry.text.slice(0, 80) : '';
          setDailyTexts({
            Sen: senText,
            Sel: '',
            Rab: '',
            Kam: '',
            Jum: '',
            Sab: '',
            Min: '',
          });
        }

        const savedStats = storageGet(`bunda_momstats_w${week}`);
        if (savedStats) {
          const parsed = JSON.parse(savedStats);
          if (parsed.weight) setMomWeight(parsed.weight);
          if (parsed.waist) setMomWaist(parsed.waist);
          if (parsed.bloodPressure) setMomBp(parsed.bloodPressure);
          if (parsed.doctorNote) setDoctorNote(parsed.doctorNote);
          if (typeof parsed.sleepHourIndex === 'number') {
            const idx = parsed.sleepHourIndex;
            setSleepHours([idx, idx, idx, idx, idx, idx, idx]);
          } else {
            setSleepHours([null, null, null, null, null, null, null]);
          }
        } else {
          setSleepHours([null, null, null, null, null, null, null]);
        }

        const savedMoods = storageGet(`bunda_daily_moods_w${week}`);
        if (savedMoods) {
          try {
            setDailyMoods(JSON.parse(savedMoods));
          } catch {}
        } else {
          setDailyMoods([null, null, null, null, null, null, null]);
        }

        // Ceklis kesehatan: dibaca dari Habit Store (sumber tunggal yang sama
        // dengan Beranda), per hari — bukan lagi dari nilai global semua hari.
        const newChecks: Record<string, boolean> = {};
        for (let d = 0; d < 7; d += 1) {
          const dayHabits = readDayHabits(week, d);
          SUPPLEMENT_ROWS.forEach((sup) => {
            newChecks[`${sup.id}-${d}`] = dayHabits.supplements[sup.id] === true;
          });
          newChecks[`water-${d}`] = isHabitDone(dayHabits, 'water');
          newChecks[`walk-${d}`] = isHabitDone(dayHabits, 'activity');
        }
        setCheckedItems(newChecks);
      } catch {}
    };

    handleSync();
    window.addEventListener('bunda_journal_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('bunda_journal_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [week, journalEntry]);

  // Dedicated direct change handlers
  const handleDailyTextChange = (dayKey: string, val: string) => {
    // Batasi 150 karakter, tapi jangan memotong di tengah kata.
    const trimmed = clampDailyNote(val);
    setDailyTexts(prev => {
      const next = { ...prev, [dayKey]: trimmed };
      try {
        storageSet(`bunda_daily_w${week}`, JSON.stringify(next));
        window.dispatchEvent(new Event('bunda_journal_updated'));
      } catch {}
      return next;
    });
  };

  const handleMomStatChange = (key: 'weight' | 'waist' | 'bloodPressure' | 'doctorNote', val: string) => {
    if (key === 'weight') setMomWeight(val);
    if (key === 'waist') setMomWaist(val);
    if (key === 'bloodPressure') setMomBp(val);
    if (key === 'doctorNote') setDoctorNote(val);

    try {
      const saved = storageGet(`bunda_momstats_w${week}`);
      const parsed = saved ? JSON.parse(saved) : {};
      const updated = {
        ...parsed,
        weight: key === 'weight' ? val : momWeight,
        waist: key === 'waist' ? val : momWaist,
        bloodPressure: key === 'bloodPressure' ? val : momBp,
        doctorNote: key === 'doctorNote' ? val : doctorNote,
        sleepHourIndex: 1
      };
      storageSet(`bunda_momstats_w${week}`, JSON.stringify(updated));
      window.dispatchEvent(new Event('bunda_journal_updated'));
    } catch {}
  };

  // Health checklist interactive state (rows: vitamin, water, walk; cols: 7 days)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Daily sleep hours state (0 to 3 index: 0=9+, 1=7-8, 2=5-6, 3=<5)
  const [sleepHours, setSleepHours] = useState<(number | null)[]>([null, null, null, null, null, null, null]);

  // Daily mood state (0 to 3 index: 0=🥰, 1=😊, 2=🥺, 3=😫)
  const [dailyMoods, setDailyMoods] = useState<(number | null)[]>([null, null, null, null, null, null, null]);

  // Simpan kesimpulan jasmani harian/mingguan/bulanan (dan perbarui saat data berubah).
  useEffect(() => subscribeJasmaniSummary(week), [week]);

  const toggleCheck = (id: string) => {
    // id: `asamFolat-3`, `water-3`, `walk-3` — ditulis ke Habit Store.
    const lastDash = id.lastIndexOf('-');
    const row = id.slice(0, lastDash);
    const dayIndex = Number(id.slice(lastDash + 1));
    if (!Number.isFinite(dayIndex)) return;

    const current = readDayHabits(week, dayIndex);

    const supplement = SUPPLEMENT_ROWS.find((s) => s.id === row);
    if (supplement) {
      const nextDone = current.supplements[supplement.id] !== true;
      setSupplementTaken(week, dayIndex, supplement.id, nextDone);
      setCheckedItems((prev) => ({ ...prev, [id]: nextDone }));
      return;
    }

    const kind = row === 'water' ? 'water' : 'activity';
    const nextDone = !isHabitDone(current, kind);
    toggleHabitDone(week, dayIndex, kind, nextDone);
    setCheckedItems((prev) => ({ ...prev, [id]: nextDone }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdatePhoto) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdatePhoto(week, {
            id: Date.now().toString(),
            caption: `Foto USG / Perut W${week}`,
            date: 'Baru saja',
            src: event.target.result as string,
            week: week,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const daysLabel = [
    { key: 'Sen', label: 'Sen' },
    { key: 'Sel', label: 'Sel' },
    { key: 'Rab', label: 'Rab' },
    { key: 'Kam', label: 'Kam' },
    { key: 'Jum', label: 'Jum' },
    { key: 'Sab', label: 'Sab' },
    { key: 'Min', label: 'Min', isSunday: true },
  ];

  // Helper cek apakah grafik ada isinya (jika belum diisi, grafik disembunyikan)
  // Tidur per hari diambil dari data jasmani (sumber yang sama dengan Beranda).
  const weekSleepHours = getWeekHabits(week).map((h) => h.sleepHours);
  const hoursToLevel = (hours: number): number | null => {
    if (!hours || hours <= 0) return null;
    if (hours >= 8.5) return 0;
    if (hours >= 6.5) return 1;
    if (hours >= 5) return 2;
    return 3;
  };
  const levelToHours = (level: number): number => [9, 7.5, 5.5, 4.5][level] ?? 7.5;
  const weekSleepLevels = weekSleepHours.map(hoursToLevel);

  const hasSleepData = weekSleepHours.some((h) => h > 0);
  const hasMoodData = dailyMoods.some(val => val !== null && val !== undefined);
  const hasChecklistData = Object.values(checkedItems).some(val => val === true);

  return (
    <div className="flex flex-row items-center justify-center gap-0 w-full print:gap-0 print:block">
      <input 
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ============================================================== */}
      {/* HALAMAN KIRI: TRACKER & JURNAL HARIAN                          */}
      {/* ============================================================== */}
      <div 
        className="b5-page b5-page-left relative overflow-hidden box-border p-[16mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none"
        style={{
          backgroundColor: theme.pageBg,
          color: theme.textColor,
          borderColor: theme.borderColor,
        }}
      >
        <div className="flex flex-col h-full justify-start">
          <div>
            {/* Header */}
            <div 
              className="flex justify-between items-end pb-1.5 mb-1.5 border-b-2"
              style={{ borderColor: theme.textColor }}
            >
              <div>
                <span className="text-[8.5px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">
                  Bab 2: Jurnal Kehamilan
                </span>
                <h1 className="font-serif text-3xl text-4xl text-5xl font-normal leading-none" style={{ color: theme.textColor }}>
                  Week {week}
                </h1>
              </div>

              {/* Editable Date Box */}
              <div 
                className="border bg-white px-2 py-1 text-[10px] flex items-center min-w-[130px] min-w-[150px] rounded-sm"
                style={{ borderColor: theme.borderColor }}
              >
                <span className="text-stone-400 mr-1.5 shrink-0">Tanggal:</span>
                <input 
                  type="text"
                  placeholder="Isi tanggal..."
                  value={dateText}
                  onChange={(e) => setDateText(e.target.value)}
                  className="w-full text-[10px] font-serif text-stone-700 bg-transparent focus:outline-hidden"
                />
                <span className="ml-1 text-[9px] font-semibold shrink-0" style={{ color: theme.primaryColor }}>
                  T{weekData.trimester}
                </span>
              </div>
            </div>

            {/* Cerita Harian (Senin - Minggu) */}
            <div className="mb-1.5">
              <div 
                className="border py-0.5 text-center text-[10.5px] font-semibold uppercase tracking-widest mb-1 rounded-xs"
                style={{ 
                  backgroundColor: theme.headerBg, 
                  borderColor: theme.borderColor, 
                  color: theme.textColor 
                }}
              >
                Catatan Harian Bunda
              </div>

              <div className="space-y-0.5">
                {daysLabel.map((dayObj, idx) => {
                  const rawNote = dailyTexts[dayObj.key] || '';
                  const noteText = Array.from(rawNote).length > DAILY_NOTE_MAX_CHARS
                    ? `${Array.from(rawNote).slice(0, DAILY_NOTE_MAX_CHARS).join("").trimEnd()}…`
                    : rawNote;
                  const noteLines = Array.from(noteText).length > DAILY_NOTE_LINE_CHARS ? 2 : 1;

                  return (
                    <div key={idx} className="flex items-start gap-1">
                      <span
                        className="w-6 w-[9mm] text-[8px] font-bold uppercase shrink-0 pt-0.5 flex flex-col leading-tight"
                        style={{ color: dayObj.isSunday ? theme.secondaryColor : theme.mutedText }}
                      >
                        <span>{dayObj.label}</span>
                        <span className="font-normal normal-case text-[6.5px] text-stone-400">
                          {fmtDayMonth(weekDates[idx] || null)}
                        </span>
                      </span>
                      <textarea
                        rows={noteLines}
                        maxLength={DAILY_NOTE_MAX_CHARS}
                        placeholder={`Catatan hari ${dayObj.label}...`}
                        value={noteText}
                        onChange={(e) => handleDailyTextChange(dayObj.key, e.target.value)}
                        className="flex-1 text-[8.5px] text-[9px] font-serif italic text-stone-700 bg-transparent border-b border-stone-300 px-1 pr-2 py-0.5 focus:bg-amber-50/40 focus:outline-hidden leading-[1.2] resize-none overflow-hidden"
                        style={{
                          borderColor: theme.borderColor,
                          height: noteLines === 1 ? '15px' : '27px',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

                                    {/* Kesimpulan minggu ini */}
            {(() => {
              const habits = getWeekHabits(week);
              const score = getWeekHabitScore(week);
              const prevScore = week > 1 ? getWeekHabitScore(week - 1) : null;
              const delta = prevScore ? score.overallPct - prevScore.overallPct : 0;

              const noteChars = Object.values(dailyTexts).reduce(
                (acc, t) => acc + String(t || '').trim().length,
                0
              );

              let streak = 0;
              let run = 0;
              habits.forEach((h) => {
                if (h.hasData) {
                  run += 1;
                  streak = Math.max(streak, run);
                } else {
                  run = 0;
                }
              });

              const totalActivity = habits.reduce((a, h) => a + h.activityMinutes, 0);
              const avgWater = habits.reduce((a, h) => a + h.waterMl, 0) / 7 / 1000;
              const sleepVals = habits.map((h) => h.sleepHours).filter((v) => v > 0);
              const avgSleep = sleepVals.length ? sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length : 0;

              const moodCounts: Record<number, number> = {};
              dailyMoods.forEach((m) => { if (typeof m === 'number') moodCounts[m] = (moodCounts[m] || 0) + 1; });
              const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
              const moodEmoji = topMood ? (['🥰', '😊', '🥺', '😫'][Number(topMood[0])] || '😊') : '—';
              const moodLabel = topMood ? (['Bahagia', 'Tenang', 'Cemas', 'Lelah'][Number(topMood[0])] || 'Tenang') : 'belum diisi';

              const highlight = Object.entries(dailyTexts)
                .map(([day, text]) => ({ day, text: String(text || '').trim() }))
                .filter((entry) => entry.text.length > 0)
                .sort((a, b) => b.text.length - a.text.length)[0];

              const narrative =
                score.daysLogged === 7
                  ? '7 hari sudah tercatat. Tidak harus sempurna — yang penting Bunda hadir.'
                  : score.daysLogged >= 4
                  ? `${score.daysLogged} hari sudah tercatat. Ada hari yang terlewat, tapi Bunda tetap hadir.`
                  : score.daysLogged > 0
                  ? `${score.daysLogged} hari tercatat. Pelan-pelan saja, yang penting tetap menulis.`
                  : 'Belum ada catatan minggu ini. Mulai dari satu kalimat saja.';

              const stats: Array<{ label: string; value: string }> = [
                { label: 'Hari tercatat', value: `${score.daysLogged}/7` },
                { label: 'Streak', value: `${streak} hari` },
                { label: 'Tulisan', value: `${noteChars} karakter` },
                { label: 'Air rata-rata', value: `${avgWater.toFixed(1)} L` },
                { label: 'Gerak total', value: `${totalActivity} mnt` },
                { label: 'Tidur rata-rata', value: avgSleep ? `${avgSleep.toFixed(1)} jam` : '—' },
                { label: 'Mood terbanyak', value: `${moodEmoji} ${moodLabel}` },
                { label: 'Vs minggu lalu', value: prevScore ? `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}%` : '—' },
              ];

              return (
                <div
                  className="mb-1.5 border rounded-xs overflow-hidden"
                  style={{ borderColor: theme.borderColor }}
                >
                  <div
                    className="flex items-center justify-between px-2 py-1 border-b"
                    style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-widest">
                      Kesimpulan minggu ini
                    </span>
                    <span className="text-[8px] font-sans" style={{ color: theme.mutedText }}>
                      Ritme {score.overallPct}% · {score.daysLogged}/7 hari · streak {streak}
                    </span>
                  </div>

                  <div className="px-2 pt-1.5 pb-1.5">
                    <div className="text-[12px] font-serif italic leading-snug" style={{ color: theme.textColor }}>
                      {narrative}
                    </div>

                    {highlight && (
                      <div className="text-[8.5px] italic leading-snug mt-1" style={{ color: theme.mutedText }}>
                        Momen minggu ini — {highlight.day}: “{highlight.text.slice(0, 120)}…”
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-x-2 gap-y-1 mt-2">
                      {stats.map((s) => (
                        <div key={s.label}>
                          <div className="text-[8.5px] uppercase tracking-wide leading-tight" style={{ color: theme.mutedText }}>
                            {s.label}
                          </div>
                          <div className="text-[13.5px] font-bold leading-tight" style={{ color: theme.textColor }}>
                            {s.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Baris: Pemantauan (kiri) + Ceklis (kanan) */}
            <div className="flex gap-2 mb-2 items-stretch">

            {/* Pemantauan minggu ini — ring jasmani: jalan / senam / tidur */}
            {(() => {
              const habits = getWeekHabits(week);
              const jasmani = getWeeklyJasmani(week);

              const rings: Array<{ label: string; value: string; pct: number; color: string; r: number }> = [
                { label: 'Jalan', value: `${jasmani.jalanMin} mnt`, pct: jasmani.pct.jalan, color: theme.secondaryColor, r: 33 },
                { label: 'Senam', value: `${jasmani.senamMin} mnt`, pct: jasmani.pct.senam, color: theme.primaryColor, r: 24 },
                {
                  label: 'Tidur',
                  value: `${jasmani.tidurAvg ? jasmani.tidurAvg.toFixed(1) : '—'} jam`,
                  pct: jasmani.pct.tidur,
                  color: '#7FA6BC',
                  r: 15,
                },
              ];

              return (
                <div
                  className="flex-1 min-w-0 border rounded-xs overflow-hidden"
                  style={{ borderColor: theme.borderColor }}
                >
                  <div
                    className="flex items-center justify-between px-2 py-1 border-b"
                    style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-widest">
                      Pemantauan minggu ini
                    </span>
                  </div>

                  <div className="flex items-center gap-3 px-2 pt-1.5">
                    <svg width="158" height="158" viewBox="0 0 80 80" aria-label="Ring jasmani mingguan">
                      {rings.map((ring) => {
                        const circ = 2 * Math.PI * ring.r;
                        const filled = (Math.max(0, Math.min(100, ring.pct)) / 100) * circ;
                        return (
                          <g key={ring.r}>
                            <circle cx="40" cy="40" r={ring.r} fill="none" stroke={theme.borderColor} strokeWidth="5" />
                            <circle
                              cx="40"
                              cy="40"
                              r={ring.r}
                              fill="none"
                              stroke={ring.color}
                              strokeWidth="5"
                              strokeLinecap="round"
                              strokeDasharray={`${filled.toFixed(1)} ${circ.toFixed(1)}`}
                              transform="rotate(-90 40 40)"
                            />
                          </g>
                        );
                      })}
                    </svg>

                    <div className="flex-1 min-w-0 flex flex-col gap-1.5 pr-1">
                      {rings.map((ring) => (
                        <div key={ring.label} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[10px] font-sans" style={{ color: theme.mutedText }}>
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ring.color }} />
                            {ring.label}
                          </span>
                          <span className="text-[10px] font-semibold tabular-nums" style={{ color: theme.textColor }}>
                            {ring.value}{' '}
                            <span className="text-[8px] font-normal" style={{ color: theme.mutedText }}>
                              ({ring.pct}%)
                            </span>
                          </span>
                        </div>
                      ))}

                      <div className="mt-1 pt-1 border-t space-y-0.5" style={{ borderColor: theme.borderColor }}>
                        <div className="flex flex-col gap-0.5 text-[8px] font-sans" style={{ color: theme.mutedText }}>
                          <span>🟠 Jalan</span>
                          <span>🟢 Senam</span>
                          <span>🔵 Tidur</span>
                        </div>
                        <div className="text-[7px] leading-snug" style={{ color: theme.mutedText }}>
                          Target jalan {JASMANI_TARGETS.jalanDailyMin} mnt/hari · senam {JASMANI_TARGETS.senamDailyMin} mnt/hari · tidur{' '}
                          {JASMANI_TARGETS.sleepHours} jam.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strip 7 hari seperti Beranda */}
                  <div className="flex items-start justify-between gap-1 px-2 pt-1.5 pb-1">
                    {habits.map((h, i) => (
                      <div key={h.dayIndex} className="flex-1 flex flex-col items-center gap-0.5">
                        <span className="text-[10.5px] font-semibold uppercase" style={{ color: theme.mutedText }}>
                          {h.dayName.slice(0, 3)}
                        </span>
                        <span className="text-[10px] leading-none font-semibold" style={{ color: theme.textColor }}>
                          {weekDates[i] ? weekDates[i]!.getDate() : '—'}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.secondaryColor, opacity: h.walkMinutes >= JASMANI_TARGETS.jalanDailyMin ? 1 : 0.18 }} />
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor, opacity: h.workoutMinutes >= JASMANI_TARGETS.senamDailyMin ? 1 : 0.18 }} />
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#7FA6BC', opacity: h.sleepHours >= JASMANI_TARGETS.sleepHours ? 1 : 0.18 }} />
                        </div>
                        <span className="text-[8px] leading-none" style={{ color: theme.mutedText }}>
                          {h.walkMinutes} mnt
                        </span>
                        <span className="text-[8px] leading-none" style={{ color: theme.mutedText }}>
                          {h.sleepHours ? `${h.sleepHours} j` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })()}

{/* Ceklis kesehatan mingguan */}
            <div className="flex-1 min-w-0 flex flex-col">
                {/* Ceklis Rutinitas — selalu tampil (seperti benchmark), kosong = lingkaran */}
                <div className="flex flex-col h-full">
                    <div 
                      className="border py-0.5 text-center text-[10.5px] font-semibold uppercase tracking-widest mb-1 rounded-xs"
                      style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor, color: theme.textColor }}
                    >
                      Ceklis Kesehatan
                    </div>
                    <div 
                      className="border bg-white flex-1 rounded-xs"
                      style={{ borderColor: theme.borderColor }}
                    >
                      <table className="w-full text-center table-fixed border-collapse">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200 text-[8.5px]">
                            <th className="w-[34%] border-r border-stone-200 py-0.5 text-left px-1 font-medium">Item</th>
                            <th className="font-normal py-0.5">S</th>
                            <th className="font-normal py-0.5">S</th>
                            <th className="font-normal py-0.5">R</th>
                            <th className="font-normal py-0.5">K</th>
                            <th className="font-normal py-0.5">J</th>
                            <th className="font-normal py-0.5">S</th>
                            <th className="font-normal py-0.5 font-bold" style={{ color: theme.secondaryColor }}>M</th>
                          </tr>
                        </thead>
                        <tbody className="text-[8.5px]">
                          {[
                            ...SUPPLEMENT_ROWS.map((s) => ({ key: s.id, label: s.label })),
                            { key: 'water', label: 'Air 2L' },
                            { key: 'walk', label: 'Aktivitas' },
                          ].map((row) => (
                            <tr key={row.key} className="border-b border-stone-200 last:border-b-0">
                              <td className="border-r border-stone-200 text-[8px] font-medium py-1 text-left px-1">{row.label}</td>
                              {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                                const checkKey = `${row.key}-${dayIdx}`;
                                const isDone = !!checkedItems[checkKey];
                                return (
                                  <td key={dayIdx} className="p-0">
                                    <button
                                      type="button"
                                      onClick={() => toggleCheck(checkKey)}
                                      className="w-full h-5 flex items-center justify-center cursor-pointer"
                                    >
                                      <div className={`w-3 h-3 rounded-full border flex items-center justify-center transition-colors ${
                                        isDone ? 'bg-[#556B2F] border-[#556B2F] text-white' : 'border-stone-300'
                                      }`}>
                                        {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                      </div>
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-1 text-center text-[8px] font-sans" style={{ color: theme.mutedText }}>
                      {Object.values(checkedItems).filter(Boolean).length}/{7 * (SUPPLEMENT_ROWS.length + 2)} kebiasaan tercentang minggu ini
                    </div>
                  </div>
              </div>
            </div>

          </div>

          {/* Footer Page Number */}
          <div className="mt-auto pt-2 text-left text-[10px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
            <span>{leftPageNum}</span>
            <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">
              Bunda Journal • Week {week}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* HALAMAN KANAN: GALERI USG, STATS & CATATAN DOKTER              */}
      {/* ============================================================== */}
      <div 
        className="b5-page b5-page-right relative overflow-hidden box-border p-[16mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none"
        style={{
          backgroundColor: theme.pageBg,
          color: theme.textColor,
          borderColor: theme.borderColor,
        }}
      >
        <div className="flex flex-col h-full justify-start">
          <div>
            {/* Weekly Fact / Milestone */}
            <div 
              className="border p-2 rounded-xs mb-2.5 text-center"
              style={{
                backgroundColor: `${theme.primaryColor}14`,
                borderColor: `${theme.primaryColor}33`,
              }}
            >
              <p 
                className="text-[9px] font-bold uppercase tracking-wider mb-0.5"
                style={{ color: theme.primaryColor }}
              >
                Milestone Minggu ke-{week} • {weekData.fruitName}
              </p>
              <p className="text-[9.5px] text-[10px] text-stone-700 font-serif italic leading-snug">
                "{weekData.quote}"
              </p>
            </div>

            {/* Photo Placeholder (Polaroid Style with Washi Tape) */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full max-w-[280px] max-w-[310px] mx-auto bg-white p-2 shadow-xs border border-stone-200 mb-2.5 group cursor-pointer hover:border-[#556B2F] transition-all rounded-xs"
              title="Ketuk untuk unggah / ganti foto minggu ini"
            >
              {/* Washi Tape */}
              <div 
                className="washi-tape"
                style={{
                  position: 'absolute',
                  width: '30mm',
                  height: '7mm',
                  backgroundColor: theme.washiBg,
                  transform: 'rotate(-3deg)',
                  top: '-3.5mm',
                  left: '50%',
                  marginLeft: '-15mm',
                  zIndex: 10,
                }}
              />

              <div 
                className="bingkai-usg w-full aspect-[4/3] bg-stone-50 border-2 border-dashed border-stone-300 flex flex-col items-center justify-center relative overflow-hidden"
              >
                {photo?.src ? (
                  <>
                    <img 
                      src={photo.src} 
                      alt={photo.caption} 
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9.5px] gap-1 font-medium">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Ganti Foto HP / USG</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-stone-400 mb-1" />
                    <span className="text-[9px] font-medium text-stone-500 uppercase tracking-wider text-center px-2">
                      Tambah Foto USG / Perut W{week}
                    </span>
                  </>
                )}
              </div>

              {/* Caption Line */}
              <div className="mt-1.5 text-center border-b border-stone-300 mx-2 pb-0.5 text-[9px] font-serif italic text-stone-600 truncate">
                {photo?.caption || `Momen Minggu ke-${week}`}
              </div>
            </div>

            {/* Baby & Mom Stats: Editable Inputs */}
            <div className="flex gap-2 mb-2.5">
              <div className="flex-1">
                <div 
                  className="border py-0.5 text-center text-[8px] font-semibold uppercase tracking-widest rounded-t-xs"
                  style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor, color: theme.textColor }}
                >
                  Berat Bunda
                </div>
                <div 
                  className="bg-white border-b border-l border-r h-6 relative flex items-center px-1.5 rounded-b-xs"
                  style={{ borderColor: theme.borderColor }}
                >
                  <input 
                    type="text"
                    value={momWeight}
                    onChange={(e) => handleMomStatChange('weight', e.target.value)}
                    className="w-full text-[9px] font-serif font-bold text-stone-800 bg-transparent pr-4 focus:outline-hidden"
                  />
                  <span className="absolute right-1 text-[8px] text-stone-400 pointer-events-none">kg</span>
                </div>
              </div>

              <div className="flex-1">
                <div 
                  className="border py-0.5 text-center text-[8px] font-semibold uppercase tracking-widest rounded-t-xs"
                  style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor, color: theme.textColor }}
                >
                  Lingkar Perut
                </div>
                <div 
                  className="bg-white border-b border-l border-r h-6 relative flex items-center px-1.5 rounded-b-xs"
                  style={{ borderColor: theme.borderColor }}
                >
                  <input 
                    type="text"
                    value={momWaist}
                    onChange={(e) => handleMomStatChange('waist', e.target.value)}
                    className="w-full text-[9px] font-serif font-bold text-stone-800 bg-transparent pr-4 focus:outline-hidden"
                  />
                  <span className="absolute right-1 text-[8px] text-stone-400 pointer-events-none">cm</span>
                </div>
              </div>

              <div className="flex-1">
                <div 
                  className="border py-0.5 text-center text-[8px] font-semibold uppercase tracking-widest rounded-t-xs"
                  style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor, color: theme.textColor }}
                >
                  Tekanan Darah
                </div>
                <div 
                  className="bg-white border-b border-l border-r h-6 relative flex items-center px-1.5 rounded-b-xs"
                  style={{ borderColor: theme.borderColor }}
                >
                  <input 
                    type="text"
                    value={momBp}
                    onChange={(e) => handleMomStatChange('bloodPressure', e.target.value)}
                    className="w-full text-[8.5px] font-serif font-bold text-stone-800 bg-transparent pr-6 focus:outline-hidden"
                  />
                  <span className="absolute right-1 text-[7.5px] text-stone-400 pointer-events-none">mmHg</span>
                </div>
              </div>
            </div>

            {/* Catatan Dokter: Editable Textarea */}
            <div>
              <div 
                className="border py-0.5 text-center text-[10.5px] font-semibold uppercase tracking-widest mb-1 rounded-xs flex items-center justify-center gap-1"
                style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor, color: theme.textColor }}
              >
                <span>Catatan Dokter / Pertanyaan Konsul</span>
                <Edit2 className="w-2.5 h-2.5 text-stone-400" />
              </div>
              <textarea 
                rows={3}
                value={doctorNote}
                onChange={(e) => handleMomStatChange('doctorNote', e.target.value)}
                placeholder="Tulis hasil konsultasi dokter obgyn..."
                className="w-full text-[9.5px] font-serif italic text-stone-700 bg-white border p-1.5 rounded-xs resize-none leading-relaxed focus:outline-hidden"
                style={{ borderColor: theme.borderColor }}
              />
            </div>
          </div>

          {/* Footer Page Number */}
          <div className="mt-auto pt-2 text-right text-[10px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
            <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">
              Dokumentasi Foto & Medis
            </span>
            <span>{rightPageNum}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
