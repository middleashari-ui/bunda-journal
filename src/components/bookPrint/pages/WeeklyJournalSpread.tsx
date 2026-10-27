import React, { useRef, useState, useEffect } from 'react';
import { getWeekData } from '../../../data/pregnancyWeeks';
import { BookThemeConfig } from '../../../types/bookPrint';
import { PhotoMemory, JournalEntry } from '../../../types';
import { Camera, Check, Edit2 } from 'lucide-react';

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
  const [dateText, setDateText] = useState<string>(() => {
    return journalEntry?.date || new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
  });

  const [dailyTexts, setDailyTexts] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`bunda_daily_w${week}`);
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
      const saved = localStorage.getItem(`bunda_momstats_w${week}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.weight) return parsed.weight;
      }
    } catch {}
    return '54.5';
  });

  const [momWaist, setMomWaist] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`bunda_momstats_w${week}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.waist) return parsed.waist;
      }
    } catch {}
    return '82';
  });

  const [momBp, setMomBp] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`bunda_momstats_w${week}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.bloodPressure) return parsed.bloodPressure;
      }
    } catch {}
    return '118/76';
  });

  const [doctorNote, setDoctorNote] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`bunda_momstats_w${week}`);
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
        const savedDaily = localStorage.getItem(`bunda_daily_w${week}`);
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

        const savedStats = localStorage.getItem(`bunda_momstats_w${week}`);
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

        // Sinkronisasi otomatis kebiasaan sehat dari Health Data Context
        const savedWater = localStorage.getItem('bunda_water_liters');
        const isWaterTargetMet = savedWater ? parseFloat(savedWater) >= 1.5 : false;

        const savedGoals = localStorage.getItem('bunda_activity_goals');
        let isWalkTargetMet = false;
        if (savedGoals) {
          const parsedG = JSON.parse(savedGoals);
          if (typeof parsedG.walkMinutes === 'number') {
            isWalkTargetMet = parsedG.walkMinutes >= 15;
          }
        }

        const savedMoods = localStorage.getItem(`bunda_daily_moods_w${week}`);
        if (savedMoods) {
          try {
            setDailyMoods(JSON.parse(savedMoods));
          } catch {}
        } else {
          setDailyMoods([null, null, null, null, null, null, null]);
        }

        const newChecks: Record<string, boolean> = {};
        if (savedWater) {
          for (let d = 0; d < 7; d++) newChecks[`water-${d}`] = isWaterTargetMet;
        }
        if (savedGoals) {
          for (let d = 0; d < 7; d++) newChecks[`walk-${d}`] = isWalkTargetMet;
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
    const trimmed = val.slice(0, 100);
    setDailyTexts(prev => {
      const next = { ...prev, [dayKey]: trimmed };
      try {
        localStorage.setItem(`bunda_daily_w${week}`, JSON.stringify(next));
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
      const saved = localStorage.getItem(`bunda_momstats_w${week}`);
      const parsed = saved ? JSON.parse(saved) : {};
      const updated = {
        ...parsed,
        weight: key === 'weight' ? val : momWeight,
        waist: key === 'waist' ? val : momWaist,
        bloodPressure: key === 'bloodPressure' ? val : momBp,
        doctorNote: key === 'doctorNote' ? val : doctorNote,
        sleepHourIndex: 1
      };
      localStorage.setItem(`bunda_momstats_w${week}`, JSON.stringify(updated));
      window.dispatchEvent(new Event('bunda_journal_updated'));
    } catch {}
  };

  // Health checklist interactive state (rows: vitamin, water, walk; cols: 7 days)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Daily sleep hours state (0 to 3 index: 0=9+, 1=7-8, 2=5-6, 3=<5)
  const [sleepHours, setSleepHours] = useState<(number | null)[]>([null, null, null, null, null, null, null]);

  // Daily mood state (0 to 3 index: 0=🥰, 1=😊, 2=🥺, 3=😫)
  const [dailyMoods, setDailyMoods] = useState<(number | null)[]>([null, null, null, null, null, null, null]);

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
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
  const hasSleepData = sleepHours.some(val => val !== null && val !== undefined);
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
        className="b5-page b5-page-left relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none"
        style={{
          backgroundColor: theme.pageBg,
          color: theme.textColor,
          borderColor: theme.borderColor,
        }}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Header */}
            <div 
              className="flex justify-between items-end pb-2 mb-2 border-b-2"
              style={{ borderColor: theme.textColor }}
            >
              <div>
                <span className="text-[8.5px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">
                  Bab 2: Jurnal Kehamilan
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal leading-none" style={{ color: theme.textColor }}>
                  Week {week}
                </h1>
              </div>

              {/* Editable Date Box */}
              <div 
                className="border bg-white px-2 py-1 text-[10px] flex items-center min-w-[130px] sm:min-w-[150px] rounded-sm"
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
            <div className={`mb-2 ${!hasSleepData && !hasChecklistData && !hasMoodData ? 'flex-1' : ''}`}>
              <div 
                className="border py-0.5 text-center text-[8.5px] font-semibold uppercase tracking-widest mb-1 rounded-xs"
                style={{ 
                  backgroundColor: theme.headerBg, 
                  borderColor: theme.borderColor, 
                  color: theme.textColor 
                }}
              >
                Catatan Harian Bunda
              </div>

              <div className="space-y-1">
                {daysLabel.map((dayObj, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span 
                      className="w-6 sm:w-[9mm] text-[8px] font-bold uppercase shrink-0 pt-0.5"
                      style={{ color: dayObj.isSunday ? theme.secondaryColor : theme.mutedText }}
                    >
                      {dayObj.label}
                    </span>
                    <textarea 
                      rows={2}
                      maxLength={100}
                      placeholder={`Catatan hari ${dayObj.label}...`}
                      value={dailyTexts[dayObj.key] || ''}
                      onChange={(e) => handleDailyTextChange(dayObj.key, e.target.value)}
                      className={`flex-1 text-[8.5px] sm:text-[9px] font-serif italic text-stone-700 bg-transparent border-b border-stone-300 px-1 py-0.5 focus:bg-amber-50/40 focus:outline-hidden leading-[1.2] resize-none overflow-hidden ${
                        !hasSleepData && !hasChecklistData && !hasMoodData ? 'h-[48px]' : 'h-[25px]'
                      }`}
                      style={{ borderColor: theme.borderColor }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Tracker Kombinasi (Sleep Graph & Ceklis Kesehatan) */}
            {(hasSleepData || hasChecklistData) && (
              <div className="flex gap-2 mb-2">
                {/* Sleep Graph with Clickable Points */}
                {hasSleepData && (
                  <div className={`${hasChecklistData ? 'w-1/2' : 'w-full'} flex flex-col`}>
                    <div 
                      className="border py-0.5 text-center text-[8.5px] font-semibold uppercase tracking-widest mb-1 rounded-xs"
                      style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor, color: theme.textColor }}
                    >
                      Grafik Tidur (Jam)
                    </div>
                    <div 
                      className="h-[24mm] border bg-white p-1 flex rounded-xs"
                      style={{ borderColor: theme.borderColor }}
                    >
                      {/* Sumbu Y (Jam) */}
                      <div className="flex flex-col justify-between text-[7.5px] font-medium text-stone-500 pr-1 border-r border-stone-200">
                        <span>9+</span>
                        <span>7-8</span>
                        <span>5-6</span>
                        <span>&lt;5</span>
                      </div>
                      {/* Sumbu X & Interactive Sleep Matrix */}
                      <div className="flex-1 flex flex-col relative">
                        <div className="flex-1 grid grid-cols-7 gap-0">
                          {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
                            <div key={dayIdx} className="flex flex-col justify-between items-center py-0.5 border-r border-stone-100 last:border-r-0">
                              {[0, 1, 2, 3].map((lvlIdx) => {
                                const isSelected = sleepHours[dayIdx] === lvlIdx;
                                return (
                                  <button
                                    key={lvlIdx}
                                    type="button"
                                    onClick={() => {
                                      setSleepHours(prev => {
                                        const next = [...prev];
                                        next[dayIdx] = lvlIdx;
                                        return next;
                                      });
                                    }}
                                    className="w-3.5 h-3 flex items-center justify-center cursor-pointer"
                                    title={`Pilih tidur hari ke-${dayIdx + 1}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full transition-transform ${
                                      isSelected ? 'scale-125' : 'bg-stone-200 hover:bg-stone-300'
                                    }`} 
                                    style={{ backgroundColor: isSelected ? theme.primaryColor : undefined }}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>

                        <div className="flex text-center text-[7px] text-stone-500 font-bold border-t border-stone-200 pt-0.5">
                          <div className="flex-1">S</div>
                          <div className="flex-1">S</div>
                          <div className="flex-1">R</div>
                          <div className="flex-1">K</div>
                          <div className="flex-1">J</div>
                          <div className="flex-1">S</div>
                          <div className="flex-1 font-bold" style={{ color: theme.secondaryColor }}>M</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[6px] text-stone-400 text-center mt-0.5 italic">Pola jam tidur harian</p>
                  </div>
                )}

                {/* Ceklis Rutinitas with Interactive Tap */}
                {hasChecklistData && (
                  <div className={`${hasSleepData ? 'w-1/2' : 'w-full'} flex flex-col`}>
                    <div 
                      className="border py-0.5 text-center text-[8.5px] font-semibold uppercase tracking-widest mb-1 rounded-xs"
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
                          <tr className="bg-stone-50 border-b border-stone-200 text-[7.5px]">
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
                            { key: 'vit', label: 'Vitamin' },
                            { key: 'water', label: 'Air 2L' },
                            { key: 'walk', label: 'Aktivitas' },
                          ].map((row) => (
                            <tr key={row.key} className="border-b border-stone-200 last:border-b-0">
                              <td className="border-r border-stone-200 text-[7px] font-medium py-0.5 text-left px-1">{row.label}</td>
                              {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                                const checkKey = `${row.key}-${dayIdx}`;
                                const isDone = !!checkedItems[checkKey];
                                return (
                                  <td key={dayIdx} className="p-0">
                                    <button
                                      type="button"
                                      onClick={() => toggleCheck(checkKey)}
                                      className="w-full h-4 flex items-center justify-center cursor-pointer"
                                    >
                                      <div className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center transition-colors ${
                                        isDone ? 'bg-[#556B2F] border-[#556B2F] text-white' : 'border-stone-300'
                                      }`}>
                                        {isDone && <Check className="w-2 h-2 stroke-[3]" />}
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
                  </div>
                )}
              </div>
            )}

            {/* Mood Graph with Interactive Tap for each day */}
            {hasMoodData && (
              <div className="w-full flex flex-col mt-0.5">
                <div 
                  className="border py-0.5 text-center text-[8.5px] font-semibold uppercase tracking-widest mb-1 rounded-xs"
                  style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor, color: theme.textColor }}
                >
                  Suasana Hati
                </div>
                <div 
                  className="h-[22mm] border bg-white p-1 flex rounded-xs"
                  style={{ borderColor: theme.borderColor }}
                >
                  {/* Sumbu Y (Emoji) */}
                  <div className="flex flex-col justify-between text-[9px] pr-1.5 border-r border-stone-200 select-none">
                    <span>🥰</span>
                    <span>😊</span>
                    <span>🥺</span>
                    <span>😫</span>
                  </div>
                  {/* Sumbu X & Mood Matrix */}
                  <div className="flex-1 flex flex-col relative">
                    <div className="flex-1 grid grid-cols-7 gap-0">
                      {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
                        <div key={dayIdx} className="flex flex-col justify-between items-center py-0.5 border-r border-stone-100 last:border-r-0">
                          {[0, 1, 2, 3].map((moodLvl) => {
                            const isSelected = dailyMoods[dayIdx] === moodLvl;
                            return (
                              <button
                                key={moodLvl}
                                type="button"
                                onClick={() => {
                                  setDailyMoods(prev => {
                                    const next = [...prev];
                                    next[dayIdx] = moodLvl;
                                    return next;
                                  });
                                }}
                                className="w-3.5 h-3 flex items-center justify-center cursor-pointer"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full transition-transform ${
                                  isSelected ? 'scale-125' : 'bg-stone-200 hover:bg-stone-300'
                                }`} 
                                style={{ backgroundColor: isSelected ? theme.secondaryColor : undefined }}
                                />
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    <div className="flex text-center text-[7px] text-stone-500 font-bold border-t border-stone-200 pt-0.5">
                      <div className="flex-1">Sen</div>
                      <div className="flex-1">Sel</div>
                      <div className="flex-1">Rab</div>
                      <div className="flex-1">Kam</div>
                      <div className="flex-1">Jum</div>
                      <div className="flex-1">Sab</div>
                      <div className="flex-1 font-bold" style={{ color: theme.secondaryColor }}>Min</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Page Number */}
          <div className="pt-2 text-left text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
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
        className="b5-page b5-page-right relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none"
        style={{
          backgroundColor: theme.pageBg,
          color: theme.textColor,
          borderColor: theme.borderColor,
        }}
      >
        <div className="flex flex-col h-full justify-between">
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
              <p className="text-[9.5px] sm:text-[10px] text-stone-700 font-serif italic leading-snug">
                "{weekData.quote}"
              </p>
            </div>

            {/* Photo Placeholder (Polaroid Style with Washi Tape) */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full max-w-[280px] sm:max-w-[310px] mx-auto bg-white p-2 shadow-xs border border-stone-200 mb-2.5 group cursor-pointer hover:border-[#556B2F] transition-all rounded-xs"
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
                className="border py-0.5 text-center text-[8.5px] font-semibold uppercase tracking-widest mb-1 rounded-xs flex items-center justify-center gap-1"
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
          <div className="pt-2 text-right text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
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
