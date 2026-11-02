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
  { id: 'folat', name: 'Asam Folat', taken: true },
  { id: 'vitd', name: 'Vitamin D', taken: true },
  { id: 'dha', name: 'DHA Omega-3', taken: false },
  { id: 'kalsium', name: 'Kalsium', taken: false },
  { id: 'besi', name: 'Zat Besi', taken: false },
];

const DEFAULT_ACTIVITY: ActivityGoals = {
  walkMinutes: 20,
  workoutMinutes: 15,
  sleepHours: 7.5,
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
    return 1.5;
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
          walkMinutes: parsed.jalan ?? 20,
          workoutMinutes: parsed.senam ?? 15,
          sleepHours: parsed.tidur ?? 7.5,
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

      // Load suplemen for target day
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
                taken: parsed[k] !== undefined ? !!parsed[k] : false,
              };
            })
          );
        } else {
          // If no entry yet, uncheck or keep default
          setSupplements(prev => prev.map(item => ({ ...item, taken: false })));
        }
      } catch {}

      // Load hidrasi for target day
      try {
        const savedWater = localStorage.getItem(`bunda_${targetWeek}_${targetDayIndex}_hidrasi`);
        if (savedWater) {
          const parsed = JSON.parse(savedWater);
          if (parsed?.current !== undefined) setWaterLiters(parsed.current / 1000);
        } else {
          setWaterLiters(0);
        }
      } catch {}

      // Load jasmani for target day
      try {
        const savedJasmani = localStorage.getItem(`bunda_${targetWeek}_${targetDayIndex}_jasmani`);
        if (savedJasmani) {
          const parsed = JSON.parse(savedJasmani);
          setActivityGoals({
            walkMinutes: parsed.jalan ?? 0,
            workoutMinutes: parsed.senam ?? 0,
            sleepHours: parsed.tidur ?? 0,
          });
        } else {
          setActivityGoals({
            walkMinutes: 0,
            workoutMinutes: 0,
            sleepHours: 0,
          });
        }
      } catch {}
    };

    window.addEventListener('bunda_day_selected', handleDayChange);
    return () => window.removeEventListener('bunda_day_selected', handleDayChange);
  }, []);

  // Weekly History: 7 Days (6 past days + today reflecting live state)
  const daysName = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const todayTaken = supplements.filter(s => s.taken).length;

  const weeklyHistory: DayLog[] = [
    { dayName: 'Sen', dateStr: '19 Okt', waterLiters: 1.75, supplementsTaken: 4, totalSupplements: 5, walkMinutes: 30, workoutMinutes: 20, sleepHours: 8.0 },
    { dayName: 'Sel', dateStr: '20 Okt', waterLiters: 2.0, supplementsTaken: 5, totalSupplements: 5, walkMinutes: 25, workoutMinutes: 15, sleepHours: 7.5 },
    { dayName: 'Rab', dateStr: '21 Okt', waterLiters: 1.5, supplementsTaken: 4, totalSupplements: 5, walkMinutes: 35, workoutMinutes: 20, sleepHours: 8.5 },
    { dayName: 'Kam', dateStr: '22 Okt', waterLiters: 2.25, supplementsTaken: 5, totalSupplements: 5, walkMinutes: 20, workoutMinutes: 10, sleepHours: 7.0 },
    { dayName: 'Jum', dateStr: '23 Okt', waterLiters: 1.75, supplementsTaken: 3, totalSupplements: 5, walkMinutes: 30, workoutMinutes: 25, sleepHours: 8.0 },
    { dayName: 'Sab', dateStr: '24 Okt', waterLiters: 2.0, supplementsTaken: 5, totalSupplements: 5, walkMinutes: 40, workoutMinutes: 20, sleepHours: 9.0 },
    { 
      dayName: 'Min', 
      dateStr: '25 Okt', 
      waterLiters: waterLiters, 
      supplementsTaken: todayTaken, 
      totalSupplements: supplements.length, 
      walkMinutes: activityGoals.walkMinutes, 
      workoutMinutes: activityGoals.workoutMinutes, 
      sleepHours: activityGoals.sleepHours 
    },
  ];

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
