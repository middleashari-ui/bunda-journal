import React from 'react';
import { Footprints, Moon, Activity, Plus, Minus } from 'lucide-react';
import { useHealthData, ActivityGoals } from '../../context/HealthDataContext';

export type { ActivityGoals };

const TARGETS = {
  walk: 30,     // 30 menit
  workout: 20,  // 20 menit
  sleep: 8,     // 8 jam
};

export const ActivityRingsCard: React.FC = () => {
  const { activityGoals: goals, updateActivityGoal: updateGoal } = useHealthData();

  // Ring 1 (Outer): Jalan Santai (Terracotta #C87A64)
  const r1 = 52;
  const c1 = 2 * Math.PI * r1;
  const ratio1 = Math.min(goals.walkMinutes / TARGETS.walk, 1);
  const offset1 = c1 * (1 - ratio1);

  // Ring 2 (Middle): Senam / Yoga (Sage Green #556B2F)
  const r2 = 40;
  const c2 = 2 * Math.PI * r2;
  const ratio2 = Math.min(goals.workoutMinutes / TARGETS.workout, 1);
  const offset2 = c2 * (1 - ratio2);

  // Ring 3 (Inner): Tidur Cukup (Dusty Slate Blue #4A6B82)
  const r3 = 28;
  const c3 = 2 * Math.PI * r3;
  const ratio3 = Math.min(goals.sleepHours / TARGETS.sleep, 1);
  const offset3 = c3 * (1 - ratio3);

  const avgProgress = Math.round(((ratio1 + ratio2 + ratio3) / 3) * 100);

  return (
    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/70 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#C87A64]/10 flex items-center justify-center text-[#C87A64]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-bold text-stone-850">Kebutuhan Jasmani</h4>
            <p className="text-[10px] text-stone-400 font-sans">
              3 Cincin Aktivitas Sehari-hari
            </p>
          </div>
        </div>

        <span className="text-[10px] font-semibold text-[#556B2F] bg-[#556B2F]/10 px-2 py-0.5 rounded-full font-sans">
          {avgProgress}% Target
        </span>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Kolom Kiri: 3 Concentric Activity Rings */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center py-1">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
              {/* Outer Ring: Jalan Background & Progress */}
              <circle
                cx="65"
                cy="65"
                r={r1}
                fill="none"
                stroke="#C87A64"
                strokeOpacity="0.15"
                strokeWidth="8.5"
              />
              <circle
                cx="65"
                cy="65"
                r={r1}
                fill="none"
                stroke="#C87A64"
                strokeWidth="8.5"
                strokeLinecap="round"
                strokeDasharray={c1}
                strokeDashoffset={offset1}
                className="transition-all duration-500 ease-out"
              />

              {/* Middle Ring: Senam Background & Progress */}
              <circle
                cx="65"
                cy="65"
                r={r2}
                fill="none"
                stroke="#556B2F"
                strokeOpacity="0.15"
                strokeWidth="8.5"
              />
              <circle
                cx="65"
                cy="65"
                r={r2}
                fill="none"
                stroke="#556B2F"
                strokeWidth="8.5"
                strokeLinecap="round"
                strokeDasharray={c2}
                strokeDashoffset={offset2}
                className="transition-all duration-500 ease-out"
              />

              {/* Inner Ring: Tidur Background & Progress */}
              <circle
                cx="65"
                cy="65"
                r={r3}
                fill="none"
                stroke="#4A6B82"
                strokeOpacity="0.15"
                strokeWidth="8.5"
              />
              <circle
                cx="65"
                cy="65"
                r={r3}
                fill="none"
                stroke="#4A6B82"
                strokeWidth="8.5"
                strokeLinecap="round"
                strokeDasharray={c3}
                strokeDashoffset={offset3}
                className="transition-all duration-500 ease-out"
              />
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="font-serif font-bold text-stone-850 text-base leading-none">
                {avgProgress}%
              </span>
              <span className="text-[8.5px] text-stone-400 font-sans mt-0.5 uppercase tracking-wider">
                Hari Ini
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 mt-1 text-[9px] text-stone-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#C87A64]" /> Jalan
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#556B2F]" /> Senam
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#4A6B82]" /> Tidur
            </span>
          </div>
        </div>

        {/* Kolom Kanan: Form Isian Progres Target */}
        <div className="sm:col-span-7 space-y-2.5">
          {/* Row 1: Jalan Santai */}
          <div className="bg-stone-50/70 p-2.5 rounded-2xl border border-stone-200/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-[#C87A64]/15 text-[#C87A64] flex items-center justify-center shrink-0">
                <Footprints className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-stone-800 truncate">Jalan Santai</p>
                <p className="text-[9.5px] text-stone-400">Target: {TARGETS.walk} menit</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => updateGoal('walkMinutes', goals.walkMinutes - 5)}
                className="w-6 h-6 rounded-md bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <Minus className="w-3 h-3" />
              </button>
              <div className="flex items-center gap-0.5 bg-white border border-stone-200 rounded-md px-1.5 py-0.5 w-14 justify-center">
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={goals.walkMinutes}
                  onChange={(e) => updateGoal('walkMinutes', Number(e.target.value))}
                  className="w-8 text-center text-xs font-bold text-stone-850 bg-transparent outline-none"
                />
                <span className="text-[9px] text-stone-400">m</span>
              </div>
              <button
                type="button"
                onClick={() => updateGoal('walkMinutes', goals.walkMinutes + 5)}
                className="w-6 h-6 rounded-md bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Row 2: Senam Hamil */}
          <div className="bg-stone-50/70 p-2.5 rounded-2xl border border-stone-200/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-[#556B2F]/15 text-[#556B2F] flex items-center justify-center shrink-0">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-stone-800 truncate">Senam & Yoga</p>
                <p className="text-[9.5px] text-stone-400">Target: {TARGETS.workout} menit</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => updateGoal('workoutMinutes', goals.workoutMinutes - 5)}
                className="w-6 h-6 rounded-md bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <Minus className="w-3 h-3" />
              </button>
              <div className="flex items-center gap-0.5 bg-white border border-stone-200 rounded-md px-1.5 py-0.5 w-14 justify-center">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={goals.workoutMinutes}
                  onChange={(e) => updateGoal('workoutMinutes', Number(e.target.value))}
                  className="w-8 text-center text-xs font-bold text-stone-850 bg-transparent outline-none"
                />
                <span className="text-[9px] text-stone-400">m</span>
              </div>
              <button
                type="button"
                onClick={() => updateGoal('workoutMinutes', goals.workoutMinutes + 5)}
                className="w-6 h-6 rounded-md bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Row 3: Tidur Cukup */}
          <div className="bg-stone-50/70 p-2.5 rounded-2xl border border-stone-200/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-[#4A6B82]/15 text-[#4A6B82] flex items-center justify-center shrink-0">
                <Moon className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-stone-800 truncate">Tidur Nyenyak</p>
                <p className="text-[9.5px] text-stone-400">Target: {TARGETS.sleep} jam</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => updateGoal('sleepHours', Math.max(0, goals.sleepHours - 0.5))}
                className="w-6 h-6 rounded-md bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <Minus className="w-3 h-3" />
              </button>
              <div className="flex items-center gap-0.5 bg-white border border-stone-200 rounded-md px-1.5 py-0.5 w-14 justify-center">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="16"
                  value={goals.sleepHours}
                  onChange={(e) => updateGoal('sleepHours', Number(e.target.value))}
                  className="w-8 text-center text-xs font-bold text-stone-850 bg-transparent outline-none"
                />
                <span className="text-[9px] text-stone-400">j</span>
              </div>
              <button
                type="button"
                onClick={() => updateGoal('sleepHours', Math.min(16, goals.sleepHours + 0.5))}
                className="w-6 h-6 rounded-md bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
