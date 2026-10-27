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
  // Water State
  const [waterLiters, setWaterLiters] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bunda_water_liters');
      if (saved !== null) return Number(saved);
    } catch {}
    return 1.5;
  });

  const waterTarget = 2.0;

  useEffect(() => {
    try {
      localStorage.setItem('bunda_water_liters', waterLiters.toString());
    } catch {}
  }, [waterLiters]);

  const changeWater = (delta: number) => {
    setWaterLiters(prev => Math.max(0, Math.min(4.0, Number((prev + delta).toFixed(2)))));
  };

  // Supplements State
  const [supplements, setSupplements] = useState<SupplementItem[]>(() => {
    try {
      const saved = localStorage.getItem('bunda_supplements_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SUPPLEMENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('bunda_supplements_list', JSON.stringify(supplements));
    } catch {}
  }, [supplements]);

  const toggleSupplement = (id: string) => {
    setSupplements(prev =>
      prev.map(item => (item.id === id ? { ...item, taken: !item.taken } : item))
    );
  };

  const addSupplement = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newItem: SupplementItem = {
      id: `supp_${Date.now()}`,
      name: trimmed,
      taken: false,
    };
    setSupplements(prev => [...prev, newItem]);
  };

  const deleteSupplement = (id: string) => {
    if (supplements.length <= 1) return;
    setSupplements(prev => prev.filter(item => item.id !== id));
  };

  // Activity Goals State
  const [activityGoals, setActivityGoals] = useState<ActivityGoals>(() => {
    try {
      const saved = localStorage.getItem('bunda_activity_goals');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ACTIVITY;
  });

  useEffect(() => {
    try {
      localStorage.setItem('bunda_activity_goals', JSON.stringify(activityGoals));
    } catch {}
  }, [activityGoals]);

  const updateActivityGoal = (key: keyof ActivityGoals, value: number) => {
    setActivityGoals(prev => ({
      ...prev,
      [key]: Math.max(0, value),
    }));
  };

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
