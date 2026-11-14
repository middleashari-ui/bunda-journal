import { storageGet, storageSet } from '../lib/storage/appStorage';
import { getTodayPosition, getWeekDatesMonday, fmtDayMonth, isSameDay } from '../lib/pregnancyDate';
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  readDayHabits,
  writeWater,
  writeSupplements,
  writeActivity,
  subscribeHabits,
  getWeekHabits,
} from '../lib/habitStore';

export interface SupplementItem {
  id: string;
  name: string;
  taken: boolean;
}

export interface ActivityGoals {
  walkMinutes: number;
  workoutMinutes: number;
  sleepHours: number;
}

export interface DayLog {
  dayName: string; // 'Sen', 'Sel', 'Rab', etc.
  dateStr: string;
  waterLiters: number;
  supplementsTaken: number;
  totalSupplements: number;
  walkMinutes: number;
  workoutMinutes: number;
  sleepHours: number;
}

interface HealthDataContextType {
  // Water
  waterLiters: number;
  waterTarget: number;
  setWaterLiters: React.Dispatch<React.SetStateAction<number>>;
  changeWater: (delta: number) => void;

  // Supplements
  supplements: SupplementItem[];
  setSupplements: React.Dispatch<React.SetStateAction<SupplementItem[]>>;
  toggleSupplement: (id: string) => void;
  addSupplement: (name: string) => void;
  deleteSupplement: (id: string) => void;

  // Activity
  activityGoals: ActivityGoals;
  setActivityGoals: React.Dispatch<React.SetStateAction<ActivityGoals>>;
  updateActivityGoal: (key: keyof ActivityGoals, value: number) => void;

  // 7-Day History for Weekly/Monthly view
  weeklyHistory: DayLog[];
}

const DEFAULT_SUPPLEMENTS: SupplementItem[] = [
  { id: 'folat', name: 'Asam Folat', taken: false },
  { id: 'vitd', name: 'Vitamin D', taken: false },
  { id: 'dha', name: 'DHA Omega-3', taken: false },
  { id: 'kalsium', name: 'Kalsium', taken: false },
  { id: 'besi', name: 'Zat Besi', taken: false },
];

const DEFAULT_ACTIVITY: ActivityGoals = {
  walkMinutes: 0,
  workoutMinutes: 0,
  sleepHours: 0,
};

const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined);

export const HealthDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Active Day Tracking for per-day sync: bunda_{week}_{dayIndex}_...
  const [activeDayKey, setActiveDayKey] = useState<{ week: number; dayIndex: number }>(() => {
    const pos = getTodayPosition();
    try {
      const w = Number(storageGet('bunda_week')) || pos.week;
      return { week: w, dayIndex: pos.dayIndex };
    } catch {
      return pos;
    }
  });

  // Water State
  const [waterLiters, setWaterLiters] = useState<number>(() => {
    try {
      const w = Number(storageGet('bunda_week')) || 32;
      const savedPerDay = storageGet(`bunda_${w}_3_hidrasi`);
      if (savedPerDay) {
        const parsed = JSON.parse(savedPerDay);
        if (parsed?.current !== undefined) return parsed.current / 1000;
      }
      const saved = storageGet('bunda_water_liters');
      if (saved !== null) return Number(saved);
    } catch {}
    return 0;
  });

  const waterTarget = 2.0;

  const savePerDayHidrasi = (liters: number, w: number, dIdx: number) => {
    // Satu pintu: Habit Store (otomatis mengirim event ke Beranda & Jurnal)
    writeWater(w, dIdx, Math.round(liters * 1000));
  };

  const changeWater = (delta: number) => {
    setWaterLiters(prev => {
      const next = Math.max(0, Math.min(4.0, Number((prev + delta).toFixed(2))));
      try {
        storageSet('bunda_water_liters', next.toString());
        savePerDayHidrasi(next, activeDayKey.week, activeDayKey.dayIndex);
      } catch {}
      return next;
    });
  };

  // Supplements State
  const [supplements, setSupplements] = useState<SupplementItem[]>(() => {
    try {
      const w = Number(storageGet('bunda_week')) || 32;
      const savedPerDay = storageGet(`bunda_${w}_3_suplemen`);
      if (savedPerDay) {
        const parsed = JSON.parse(savedPerDay);
        return DEFAULT_SUPPLEMENTS.map(item => {
          const keyMap: Record<string, string> = {
            folat: 'asamFolat',
            vitd: 'vitaminD',
            dha: 'dha',
            kalsium: 'kalsium',
            besi: 'zatBesi',
          };
          const mappedKey = keyMap[item.id] || item.id;
          return {
            ...item,
            taken: parsed[mappedKey] !== undefined ? !!parsed[mappedKey] : item.taken,
          };
        });
      }
      const saved = storageGet('bunda_supplements_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SUPPLEMENTS;
  });

  const savePerDaySuplemen = (items: SupplementItem[], w: number, dIdx: number) => {
    try {
      const keyMap: Record<string, string> = {
        folat: 'asamFolat',
        vitd: 'vitaminD',
        dha: 'dha',
        kalsium: 'kalsium',
        besi: 'zatBesi',
      };
      const res: Record<string, any> = {};
      let count = 0;
      items.forEach(item => {
        const k = keyMap[item.id] || item.id;
        res[k] = !!item.taken;
        if (item.taken) count++;
      });
      res.count = count;
      writeSupplements(w, dIdx, res);
    } catch {}
  };

  const toggleSupplement = (id: string) => {
    setSupplements(prev => {
      const updated = prev.map(item => (item.id === id ? { ...item, taken: !item.taken } : item));
      try {
        storageSet('bunda_supplements_list', JSON.stringify(updated));
        savePerDaySuplemen(updated, activeDayKey.week, activeDayKey.dayIndex);
      } catch {}
      return updated;
    });
  };

  const addSupplement = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newItem: SupplementItem = {
      id: `supp_${Date.now()}`,
      name: trimmed,
      taken: false,
    };
    setSupplements(prev => {
      const updated = [...prev, newItem];
      try {
        storageSet('bunda_supplements_list', JSON.stringify(updated));
        savePerDaySuplemen(updated, activeDayKey.week, activeDayKey.dayIndex);
      } catch {}
      return updated;
    });
  };

  const deleteSupplement = (id: string) => {
    if (supplements.length <= 1) return;
    setSupplements(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        storageSet('bunda_supplements_list', JSON.stringify(updated));
        savePerDaySuplemen(updated, activeDayKey.week, activeDayKey.dayIndex);
      } catch {}
      return updated;
    });
  };

  // Activity Goals State
  const [activityGoals, setActivityGoals] = useState<ActivityGoals>(() => {
    try {
      const w = Number(storageGet('bunda_week')) || 32;
      const savedPerDay = storageGet(`bunda_${w}_3_jasmani`);
      if (savedPerDay) {
        const parsed = JSON.parse(savedPerDay);
        return {
          walkMinutes: parsed.jalan ?? 0,
          workoutMinutes: parsed.senam ?? 0,
          sleepHours: parsed.tidur ?? 0,
        };
      }
      const saved = storageGet('bunda_activity_goals');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ACTIVITY;
  });

  const savePerDayJasmani = (goals: ActivityGoals, w: number, dIdx: number) => {
    try {
      const percent = Math.min(100, Math.round(((goals.walkMinutes / 30 + goals.workoutMinutes / 20 + goals.sleepHours / 8) / 3) * 100));
      writeActivity(w, dIdx, {
        jalan: goals.walkMinutes,
        senam: goals.workoutMinutes,
        tidur: goals.sleepHours,
        percent,
      });
    } catch {}
  };

  const updateActivityGoal = (key: keyof ActivityGoals, value: number) => {
    setActivityGoals(prev => {
      const updated = {
        ...prev,
        [key]: Math.max(0, value),
      };
      try {
        storageSet('bunda_activity_goals', JSON.stringify(updated));
        savePerDayJasmani(updated, activeDayKey.week, activeDayKey.dayIndex);
      } catch {}
      return updated;
    });
  };

  // Listen to Day Selection in DayStrip to load per-day data
  useEffect(() => {
    const handleDayChange = (e: any) => {
      const { week: targetWeek, dayIndex: targetDayIndex } = e.detail || {};
      if (targetWeek === undefined || targetDayIndex === undefined) return;
      setActiveDayKey({ week: targetWeek, dayIndex: targetDayIndex });

      // Load suplemen for target day — fallback: pertahankan nilai Beranda bila hari tsb belum ada data (anti-flicker ke 0)
      try {
        const savedSupp = storageGet(`bunda_${targetWeek}_${targetDayIndex}_suplemen`);
        if (savedSupp) {
          const parsed = JSON.parse(savedSupp);
          const keyMap: Record<string, string> = {
            folat: 'asamFolat',
            vitd: 'vitaminD',
            dha: 'dha',
            kalsium: 'kalsium',
            besi: 'zatBesi',
          };
          setSupplements(prev =>
            prev.map(item => {
              const k = keyMap[item.id] || item.id;
              return {
                ...item,
                taken: parsed[k] !== undefined ? !!parsed[k] : item.taken,
              };
            })
          );
        }
        // tanpa data hari itu: jangan reset — biarkan state Beranda stay (anti-flicker 86% -> 0%)
      } catch {}

      // Load hidrasi for target day — fallback: pertahankan nilai bila belum ada data
      try {
        const savedWater = storageGet(`bunda_${targetWeek}_${targetDayIndex}_hidrasi`);
        if (savedWater) {
          const parsed = JSON.parse(savedWater);
          if (parsed?.current !== undefined) setWaterLiters(parsed.current / 1000);
        }
        // tanpa data: stay (anti-flicker 1.3/2.0L -> 0.0/2.0L)
      } catch {}

      // Load jasmani for target day — fallback: pertahankan nilai bila belum ada data
      try {
        const savedJasmani = storageGet(`bunda_${targetWeek}_${targetDayIndex}_jasmani`);
        if (savedJasmani) {
          const parsed = JSON.parse(savedJasmani);
          setActivityGoals((prev) => ({
            walkMinutes: parsed.jalan ?? prev.walkMinutes,
            workoutMinutes: parsed.senam ?? prev.workoutMinutes,
            sleepHours: parsed.tidur ?? prev.sleepHours,
          }));
        }
        // tanpa data: stay (anti-flicker 28mnt -> 0)
      } catch {}
    };

    window.addEventListener('bunda_day_selected', handleDayChange);
    return () => window.removeEventListener('bunda_day_selected', handleDayChange);
  }, []);

  // Ikut perubahan dari halaman lain (Jurnal / fitur baru yang memakai Habit Store).
  useEffect(() => {
    const sync = () => {
      const h = readDayHabits(activeDayKey.week, activeDayKey.dayIndex);
      setWaterLiters(h.water.current / 1000);
      setActivityGoals({
        walkMinutes: h.activity.jalan,
        workoutMinutes: h.activity.senam,
        sleepHours: h.activity.tidur,
      });
      const keyMap: Record<string, string> = {
        folat: 'asamFolat',
        vitd: 'vitaminD',
        dha: 'dha',
        kalsium: 'kalsium',
        besi: 'zatBesi',
      };
      setSupplements((prev) =>
        prev.map((item) => {
          const k = keyMap[item.id] || item.id;
          const value = h.supplements[k];
          return typeof value === 'boolean' ? { ...item, taken: value } : item;
        })
      );
    };
    return subscribeHabits(sync);
  }, [activeDayKey.week, activeDayKey.dayIndex]);

  // Weekly History: 7 hari, dari Habit Store (bunda_{w}_{d}_*).
  // Tanggal diambil dari minggu kehamilan yang sedang dibuka — bukan hardcode.
  const daysName = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const todayTaken = supplements.filter((s) => s.taken).length;

  const weekDates = getWeekDatesMonday(activeDayKey.week);
  const todayIdx = weekDates.findIndex((d) => isSameDay(d, new Date()));
  const weekStore = getWeekHabits(activeDayKey.week);

  const weeklyHistory: DayLog[] = daysName.map((dayName, i) => {
    const base = weekStore[i];
    const isToday = i === todayIdx;
    return {
      dayName,
      dateStr: weekDates[i] ? fmtDayMonth(weekDates[i]) : '',
      waterLiters: isToday ? waterLiters : base.waterMl / 1000,
      supplementsTaken: isToday ? Math.max(todayTaken, base.supplementsTaken) : base.supplementsTaken,
      totalSupplements: supplements.length,
      walkMinutes: isToday ? activityGoals.walkMinutes : base.walkMinutes,
      workoutMinutes: isToday ? activityGoals.workoutMinutes : base.workoutMinutes,
      sleepHours: isToday ? activityGoals.sleepHours : base.sleepHours,
    };
  });

  return (
    <HealthDataContext.Provider
      value={{
        waterLiters,
        waterTarget,
        setWaterLiters,
        changeWater,
        supplements,
        setSupplements,
        toggleSupplement,
        addSupplement,
        deleteSupplement,
        activityGoals,
        setActivityGoals,
        updateActivityGoal,
        weeklyHistory,
      }}
    >
      {children}
    </HealthDataContext.Provider>
  );
};

export const useHealthData = (): HealthDataContextType => {
  const context = useContext(HealthDataContext);
  if (!context) {
    throw new Error('useHealthData must be used within a HealthDataProvider');
  }
  return context;
};
