import React, { useState } from 'react';
import { Pill, Droplets, Footprints, Moon, Calendar, TrendingUp } from 'lucide-react';
import { useHealthData } from '../../context/HealthDataContext';

type TimeframeOption = 'harian' | 'mingguan' | 'bulanan';

export const DashboardOverview: React.FC = () => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('harian');
  const { waterLiters, waterTarget, supplements, activityGoals, weeklyHistory } = useHealthData();

  const takenSupplementsCount = supplements.filter(s => s.taken).length;
  const totalSupplementsCount = supplements.length;
  const suppPercentage = Math.round((takenSupplementsCount / Math.max(1, totalSupplementsCount)) * 100);
  const waterPercentage = Math.min(100, Math.round((waterLiters / waterTarget) * 100));

  // Calculations for Weekly Summary
  const avgWaterWeekly = (
    weeklyHistory.reduce((acc, d) => acc + d.waterLiters, 0) / weeklyHistory.length
  ).toFixed(1);

  const avgSuppWeekly = Math.round(
    (weeklyHistory.reduce((acc, d) => acc + d.supplementsTaken, 0) /
      weeklyHistory.reduce((acc, d) => acc + d.totalSupplements, 0)) *
      100
  );

  const avgWalkWeekly = Math.round(
    weeklyHistory.reduce((acc, d) => acc + d.walkMinutes, 0) / weeklyHistory.length
  );

  const avgSleepWeekly = (
    weeklyHistory.reduce((acc, d) => acc + d.sleepHours, 0) / weeklyHistory.length
  ).toFixed(1);

  // Sparkline calculation for Water (7 days)
  const maxWaterVal = Math.max(...weeklyHistory.map(d => d.waterLiters), 2.5);
  const sparklinePoints = weeklyHistory
    .map((d, i) => {
      const x = (i / (weeklyHistory.length - 1)) * 120;
      const y = 34 - (d.waterLiters / maxWaterVal) * 26;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="space-y-3">
      {/* Segmented Toggle UI */}
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-sm font-bold text-stone-850">
          Ringkasan Kesehatan & Nutrisi
        </h3>

        <div className="flex bg-stone-200/60 p-1 rounded-2xl border border-stone-200/80">
          {(['harian', 'mingguan', 'bulanan'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setTimeframe(tab)}
              className={`py-1 px-3 text-xs rounded-xl transition-all capitalize select-none cursor-pointer ${
                timeframe === tab
                  ? 'bg-white text-stone-850 font-semibold shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: HARIAN (Bento Grid 2x2 with Faded Sage Background, Flat, Thin Border) */}
      {timeframe === 'harian' && (
        <div className="grid grid-cols-2 gap-2.5 transition-all duration-300">
          {/* Card 1: Suplemen */}
          <div className="bg-[#556B2F]/[0.05] p-3.5 rounded-2xl border border-[#556B2F]/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#556B2F]">
                  Suplemen
                </span>
                <Pill className="w-3.5 h-3.5 text-[#556B2F]" />
              </div>
              <div className="font-serif text-xl sm:text-2xl font-bold text-stone-850">
                {takenSupplementsCount} <span className="text-xs font-normal text-stone-400">/ {totalSupplementsCount}</span>
              </div>
              <p className="text-[10.5px] text-stone-500 mt-0.5 font-sans">
                {suppPercentage}% terpenuhi
              </p>
            </div>

            {/* Static Segmented Bar (Read-only) */}
            <div className="flex gap-1 mt-3">
              {supplements.map((s, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full ${
                    s.taken ? 'bg-[#556B2F]' : 'bg-stone-200'
                  }`}
                  title={`${s.name}: ${s.taken ? 'Diminum' : 'Belum'}`}
                />
              ))}
            </div>
          </div>

          {/* Card 2: Hidrasi Air */}
          <div className="bg-[#556B2F]/[0.05] p-3.5 rounded-2xl border border-[#556B2F]/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#556B2F]">
                  Hidrasi
                </span>
                <Droplets className="w-3.5 h-3.5 text-sky-600" />
              </div>
              <div className="font-serif text-xl sm:text-2xl font-bold text-stone-850">
                {waterLiters.toFixed(1)} <span className="text-xs font-normal text-stone-400">/ {waterTarget.toFixed(1)} L</span>
              </div>
              <p className="text-[10.5px] text-stone-500 mt-0.5 font-sans">
                {waterPercentage}% target harian
              </p>
            </div>

            {/* Static Progress Bar (Read-only) */}
            <div className="w-full bg-stone-200 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${waterPercentage}%` }}
              />
            </div>
          </div>

          {/* Card 3: Kebugaran Jalan */}
          <div className="bg-[#556B2F]/[0.05] p-3.5 rounded-2xl border border-[#556B2F]/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#556B2F]">
                  Jalan & Senam
                </span>
                <Footprints className="w-3.5 h-3.5 text-[#C87A64]" />
              </div>
              <div className="font-serif text-xl sm:text-2xl font-bold text-stone-850">
                {activityGoals.walkMinutes} <span className="text-xs font-normal text-stone-400">mnt</span>
              </div>
              <p className="text-[10.5px] text-stone-500 mt-0.5 font-sans">
                Senam: {activityGoals.workoutMinutes} mnt
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between text-[9px] text-[#556B2F] font-medium">
              <span>Target 30 mnt</span>
              <span className="bg-[#556B2F]/10 px-1.5 py-0.5 rounded-md">
                {Math.min(100, Math.round((activityGoals.walkMinutes / 30) * 100))}%
              </span>
            </div>
          </div>

          {/* Card 4: Istirahat Tidur */}
          <div className="bg-[#556B2F]/[0.05] p-3.5 rounded-2xl border border-[#556B2F]/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#556B2F]">
                  Tidur
                </span>
                <Moon className="w-3.5 h-3.5 text-[#4A6B82]" />
              </div>
              <div className="font-serif text-xl sm:text-2xl font-bold text-stone-850">
                {activityGoals.sleepHours} <span className="text-xs font-normal text-stone-400">Jam</span>
              </div>
              <p className="text-[10.5px] text-stone-500 mt-0.5 font-sans">
                {activityGoals.sleepHours >= 7.5 ? 'Istirahat cukup' : 'Perlu tambahan tidur'}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between text-[9px] text-stone-500 font-medium">
              <span>Target 8.0 jam</span>
              <span className="bg-stone-200/70 text-stone-600 px-1.5 py-0.5 rounded-md">
                {activityGoals.sleepHours >= 7.5 ? 'Optimal' : 'Kurang'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MINGGUAN (Tren: Rata-rata Suplemen + 7 Kapsul, Rata-rata Air + Sparkline, Rata-rata Langkah + Grafik, Tidur + Rings Statis) */}
      {timeframe === 'mingguan' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 transition-all duration-300">
          {/* Card 1: Rata-rata Suplemen + 7 Mini Capsules */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#556B2F] block">
                  Kepatuhan Suplemen
                </span>
                <div className="font-serif text-xl font-bold text-stone-850 mt-0.5">
                  {avgSuppWeekly}% <span className="text-xs font-normal text-stone-400">rerata 7 hari</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#556B2F]/10 flex items-center justify-center text-[#556B2F]">
                <Pill className="w-4 h-4" />
              </div>
            </div>

            {/* 7 Mini Day Capsules */}
            <div className="pt-1 border-t border-stone-100">
              <div className="grid grid-cols-7 gap-1 text-center">
                {weeklyHistory.map((d, idx) => {
                  const isDone = d.supplementsTaken >= d.totalSupplements * 0.8;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <span className="text-[9px] text-stone-400">{d.dayName}</span>
                      <div
                        className={`w-5 h-8 rounded-full flex flex-col items-center justify-center text-[9px] font-bold ${
                          isDone 
                            ? 'bg-[#556B2F] text-white' 
                            : 'bg-stone-100 text-stone-600'
                        }`}
                        title={`${d.dayName}: ${d.supplementsTaken}/${d.totalSupplements}`}
                      >
                        {d.supplementsTaken}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2: Rata-rata Air + Mini Sparkline Chart */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-sky-600 block">
                  Rata-rata Hidrasi
                </span>
                <div className="font-serif text-xl font-bold text-stone-850 mt-0.5">
                  {avgWaterWeekly} L <span className="text-xs font-normal text-stone-400">/ hari</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
            </div>

            {/* Mini Sparkline Chart */}
            <div className="pt-1 border-t border-stone-100 flex items-center justify-between">
              <svg className="w-32 h-10 overflow-visible" viewBox="0 0 120 36">
                <polyline
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sparklinePoints}
                />
                {weeklyHistory.map((d, i) => {
                  const x = (i / (weeklyHistory.length - 1)) * 120;
                  const y = 34 - (d.waterLiters / maxWaterVal) * 26;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="2.5"
                      fill="#0284c7"
                      className="hover:r-3.5 transition-all"
                    />
                  );
                })}
              </svg>
              <div className="text-right text-[10px] text-stone-400">
                <p className="font-medium text-stone-700">{weeklyHistory[weeklyHistory.length - 1].waterLiters.toFixed(1)} L hari ini</p>
                <p>Target: 2.0 L</p>
              </div>
            </div>
          </div>

          {/* Card 3: Rata-rata Langkah + Mini Trend Bar Chart */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#C87A64] block">
                  Aktivitas Jalan Kaki
                </span>
                <div className="font-serif text-xl font-bold text-stone-850 mt-0.5">
                  {avgWalkWeekly} mnt <span className="text-xs font-normal text-stone-400">rerata harian</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#C87A64]/10 flex items-center justify-center text-[#C87A64]">
                <Footprints className="w-4 h-4" />
              </div>
            </div>

            {/* Mini Bar Chart */}
            <div className="pt-1 border-t border-stone-100">
              <div className="flex items-end justify-between gap-1.5 h-10 px-1">
                {weeklyHistory.map((d, idx) => {
                  const heightPercent = Math.min(100, Math.round((d.walkMinutes / 45) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div
                        className="w-full bg-[#C87A64]/80 rounded-t-sm hover:bg-[#C87A64] transition-all"
                        style={{ height: `${heightPercent}%` }}
                        title={`${d.dayName}: ${d.walkMinutes} menit`}
                      />
                      <span className="text-[8px] text-stone-400 leading-none">{d.dayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 4: Tidur + Static Mini Activity Rings */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#4A6B82] block">
                  Pola Istirahat Tidur
                </span>
                <div className="font-serif text-xl font-bold text-stone-850 mt-0.5">
                  {avgSleepWeekly} Jam <span className="text-xs font-normal text-stone-400">rerata semalam</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#4A6B82]/10 flex items-center justify-center text-[#4A6B82]">
                <Moon className="w-4 h-4" />
              </div>
            </div>

            {/* Static Mini Rings Display */}
            <div className="pt-1 border-t border-stone-100 flex items-center justify-between">
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 70 70">
                  {/* Outer: Jalan */}
                  <circle cx="35" cy="35" r="28" fill="none" stroke="#C87A64" strokeOpacity="0.2" strokeWidth="4" />
                  <circle cx="35" cy="35" r="28" fill="none" stroke="#C87A64" strokeWidth="4" strokeLinecap="round" strokeDasharray={2 * Math.PI * 28} strokeDashoffset={2 * Math.PI * 28 * 0.25} />
                  {/* Middle: Senam */}
                  <circle cx="35" cy="35" r="21" fill="none" stroke="#556B2F" strokeOpacity="0.2" strokeWidth="4" />
                  <circle cx="35" cy="35" r="21" fill="none" stroke="#556B2F" strokeWidth="4" strokeLinecap="round" strokeDasharray={2 * Math.PI * 21} strokeDashoffset={2 * Math.PI * 21 * 0.3} />
                  {/* Inner: Tidur */}
                  <circle cx="35" cy="35" r="14" fill="none" stroke="#4A6B82" strokeOpacity="0.2" strokeWidth="4" />
                  <circle cx="35" cy="35" r="14" fill="none" stroke="#4A6B82" strokeWidth="4" strokeLinecap="round" strokeDasharray={2 * Math.PI * 14} strokeDashoffset={2 * Math.PI * 14 * 0.1} />
                </svg>
              </div>

              <div className="text-[10px] text-stone-500 space-y-0.5 pl-2 text-right">
                <p className="text-stone-800 font-medium">94% Keteraturan</p>
                <p className="text-stone-400">Ritme sirkadian sehat</p>
                <p className="text-[#556B2F] font-semibold">Konsisten minggu ini</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: BULANAN (Teks Tipografi Besar yang Bersih) */}
      {timeframe === 'bulanan' && (
        <div className="bg-white p-5 rounded-3xl border border-stone-200/70 shadow-xs space-y-5 transition-all duration-300">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 font-sans">
              Rekapitulasi 30 Hari Terakhir
            </span>
            <span className="text-[10px] text-[#556B2F] bg-[#556B2F]/10 px-2 py-0.5 rounded-full font-medium">
              Bulan Ini
            </span>
          </div>

          {/* Grand Clean Typography Section */}
          <div className="space-y-4">
            <div>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-stone-850 tracking-tight">
                Total 48 L Air
              </div>
              <p className="text-xs text-stone-500 mt-1 font-light leading-relaxed">
                Asupan cairan optimal untuk menjaga volume air ketuban dan sirkulasi plasenta sang buah hati.
              </p>
            </div>

            <div className="h-px bg-stone-100" />

            <div>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#556B2F] tracking-tight">
                92% Kepatuhan Suplemen
              </div>
              <p className="text-xs text-stone-500 mt-1 font-light leading-relaxed">
                Asam folat, vitamin D3, dan kalsium teratur mendukung perkembangan tabung saraf dan tulang janin.
              </p>
            </div>

            <div className="h-px bg-stone-100" />

            <div>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#C87A64] tracking-tight">
                14.2 Jam Bergerak Aktif
              </div>
              <p className="text-xs text-stone-500 mt-1 font-light leading-relaxed">
                Kombinasi jalan santai pagi dan peregangan prenatal yoga melatih elastisitas panggul bunda.
              </p>
            </div>

            <div className="h-px bg-stone-100" />

            <div>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#4A6B82] tracking-tight">
                236 Jam Istirahat Penuh
              </div>
              <p className="text-xs text-stone-500 mt-1 font-light leading-relaxed">
                Rata-rata 7.8 jam istirahat berkualitas per malam menjaga kestabilan tekanan darah dan suasana hati.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
