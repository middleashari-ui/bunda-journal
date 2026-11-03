import React, { createContext, useContext, useState, useEffect } from 'react';

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
    try {
      const w = Number(localStorage.getItem('bunda_week')) || 32;
      return { week: w, dayIndex: 3 };
    } catch {
      return { week: 32, dayIndex: 3 };
    }
  });

  // Water State
  const [waterLiters, setWaterLiters] = useState<number>(() => {
    try {
      const w = Number(localStorage.getItem('bunda_week')) || 32;
      const savedPerDay = localStorage.getItem(`bunda_${w}_3_hidrasi`);
      if (savedPerDay) {
        const parsed = JSON.parse(savedPerDay);
        if (parsed?.current !== undefined) return parsed.current / 1000;
      }
      const saved = localStorage.getItem('bunda_water_liters');
      if (saved !== null) return Number(saved);
    } catch {}
    return 0;
  });

  const waterTarget = 2.0;

  const savePerDayHidrasi = (liters: number, w: number, dIdx: number) => {
    try {
      const currentMl = Math.round(liters * 1000);
      localStorage.setItem(`bunda_${w}_${dIdx}_hidrasi`, JSON.stringify({ current: currentMl, target: 2000 }));
    } catch {}
  };

  const changeWater = (delta: number) => {
    setWaterLiters(prev => {
      const next = Math.max(0, Math.min(4.0, Number((prev + delta).toFixed(2))));
      try {
        localStorage.setItem('bunda_water_liters', next.toString());
        savePerDayHidrasi(next, activeDayKey.week, activeDayKey.dayIndex);
      } catch {}
      return next;
    });
  };

  // Supplements State
  const [supplements, setSupplements] = useState<SupplementItem[]>(() => {
    try {
      const w = Number(localStorage.getItem('bunda_week')) || 32;
      const savedPerDay = localStorage.getItem(`bunda_${w}_3_suplemen`);
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
      const saved = localStorage.getItem('bunda_supplements_list');
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
      localStorage.setItem(`bunda_${w}_${dIdx}_suplemen`, JSON.stringify(res));
    } catch {}
  };

  const toggleSupplement = (id: string) => {
    setSupplements(prev => {
      const updated = prev.map(item => (item.id === id ? { ...item, taken: !item.taken } : item));
      try {
        localStorage.setItem('bunda_supplements_list', JSON.stringify(updated));
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
        localStorage.setItem('bunda_supplements_list', JSON.stringify(updated));
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
        localStorage.setItem('bunda_supplements_list', JSON.stringify(updated));
        savePerDaySuplemen(updated, activeDayKey.week, activeDayKey.dayIndex);
      } catch {}
      return updated;
    });
  };

  // Activity Goals State
  const [activityGoals, setActivityGoals] = useState<ActivityGoals>(() => {
    try {
      const w = Number(localStorage.getItem('bunda_week')) || 32;
      const savedPerDay = localStorage.getItem(`bunda_${w}_3_jasmani`);
      if (savedPerDay) {
        const parsed = JSON.parse(savedPerDay);
        return {
          walkMinutes: parsed.jalan ?? 0,
          workoutMinutes: parsed.senam ?? 0,
          sleepHours: parsed.tidur ?? 0,
        };
      }
      const saved = localStorage.getItem('bunda_activity_goals');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ACTIVITY;
  });

  const savePerDayJasmani = (goals: ActivityGoals, w: number, dIdx: number) => {
    try {
      const percent = Math.min(100, Math.round(((goals.walkMinutes / 30 + goals.workoutMinutes / 20 + goals.sleepHours / 8) / 3) * 100));
      localStorage.setItem(`bunda_${w}_${dIdx}_jasmani`, JSON.stringify({
        jalan: goals.walkMinutes,
        senam: goals.workoutMinutes,
        tidur: goals.sleepHours,
        percent,
      }));
    } catch {}
  };

  const updateActivityGoal = (key: keyof ActivityGoals, value: number) => {
    setActivityGoals(prev => {
      const updated = {
        ...prev,
        [key]: Math.max(0, value),
      };
      try {
        localStorage.setItem('bunda_activity_goals', JSON.stringify(updated));
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
        const savedSupp = localStorage.getItem(`bunda_${targetWeek}_${targetDayIndex}_suplemen`);
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
        const savedWater = localStorage.getItem(`bunda_${targetWeek}_${targetDayIndex}_hidrasi`);
        if (savedWater) {
          const parsed = JSON.parse(savedWater);
          if (parsed?.current !== undefined) setWaterLiters(parsed.current / 1000);
        }
        // tanpa data: stay (anti-flicker 1.3/2.0L -> 0.0/2.0L)
      } catch {}

      // Load jasmani for target day — fallback: pertahankan nilai bila belum ada data
      try {
        const savedJasmani = localStorage.getItem(`bunda_${targetWeek}_${targetDayIndex}_jasmani`);
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

  // Weekly History: 7 hari dari data per-hari bunda (bunda_{w}_{d}_*).
  // Tanpa data hari itu: 0 — bukan dummy. Hari ini (Min) pantul state live.
  const daysName = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const todayTaken = supplements.filter(s => s.taken).length;

  const readDay = (dIdx: number): Omit<DayLog, 'dayName' | 'dateStr'> | null => {
    try {
      const w = activeDayKey.week;
      const hRaw = localStorage.getItem(`bunda_${w}_${dIdx}_hidrasi`);
      const sRaw = localStorage.getItem(`bunda_${w}_${dIdx}_suplemen`);
      const jRaw = localStorage.getItem(`bunda_${w}_${dIdx}_jasmani`);
      if (!hRaw && !sRaw && !jRaw) return null;
      const h = hRaw ? JSON.parse(hRaw) : {};
      const s = sRaw ? JSON.parse(sRaw) : {};
      const j = jRaw ? JSON.parse(jRaw) : {};
      const suppCount = typeof s.count === 'number'
        ? s.count
        : Object.values(s).filter(v => v === true).length;
      return {
        waterLiters: (h.current ?? 0) / 1000,
        supplementsTaken: suppCount,
        totalSupplements: supplements.length,
        walkMinutes: j.jalan ?? 0,
        workoutMinutes: j.senam ?? 0,
        sleepHours: j.tidur ?? 0,
      };
    } catch {
      return null;
    }
  };

  const zeroDay = (): Omit<DayLog, 'dayName' | 'dateStr'> => ({
    waterLiters: 0,
    supplementsTaken: 0,
    totalSupplements: supplements.length,
    walkMinutes: 0,
    workoutMinutes: 0,
    sleepHours: 0,
  });

  const dateLabels = ['19 Okt', '20 Okt', '21 Okt', '22 Okt', '23 Okt', '24 Okt', '25 Okt'];
  const weeklyHistory: DayLog[] = daysName.map((dayName, i) => {
    if (i === 6) {
      // Hari ini: pantul state live Beranda
      return {
        dayName,
        dateStr: dateLabels[i],
        waterLiters,
        supplementsTaken: todayTaken,
        totalSupplements: supplements.length,
        walkMinutes: activityGoals.walkMinutes,
        workoutMinutes: activityGoals.workoutMinutes,
        sleepHours: activityGoals.sleepHours,
      };
    }
    const stored = readDay(i);
    return { dayName, dateStr: dateLabels[i], ...(stored ?? zeroDay()) };
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
