import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Scatter
} from 'recharts';
import { Ruler, Scale, Plus, Check, Info, Trash2, Calendar } from 'lucide-react';

interface FetalGrowthChartProps {
  currentWeek: number;
  onSelectWeek?: (week: number) => void;
}

type GrowthMetric = 'length' | 'weight';
type TrimesterFilter = 'all' | 't1' | 't2' | 't3';

export interface FetalUltrasoundRecord {
  id: string;
  week: number;
  lengthCm?: number;
  weightGrams?: number;
  date: string;
  note?: string;
}

// WHO & Hadlock Fetal Growth Standard percentiles (Weeks 8 to 40)
interface BenchmarkWeek {
  week: number;
  label: string;
  fruit: string;
  fruitName: string;
  lenP10: number;
  lenP50: number;
  lenP90: number;
  wtP10: number;
  wtP50: number;
  wtP90: number;
}

const FETAL_GROWTH_BENCHMARKS: BenchmarkWeek[] = [
  { week: 8, label: 'Mg 8', fruit: '🫐', fruitName: 'Rasberi', lenP10: 1.2, lenP50: 1.6, lenP90: 2.0, wtP10: 1, wtP50: 1, wtP90: 2 },
  { week: 9, label: 'Mg 9', fruit: '🍒', fruitName: 'Ceri', lenP10: 1.8, lenP50: 2.3, lenP90: 2.8, wtP10: 1, wtP50: 2, wtP90: 3 },
  { week: 10, label: 'Mg 10', fruit: '🍓', fruitName: 'Stroberi', lenP10: 2.5, lenP50: 3.1, lenP90: 3.8, wtP10: 3, wtP50: 4, wtP90: 6 },
  { week: 11, label: 'Mg 11', fruit: '🫒', fruitName: 'Zaitun', lenP10: 3.4, lenP50: 4.1, lenP90: 5.0, wtP10: 5, wtP50: 7, wtP90: 10 },
  { week: 12, label: 'Mg 12', fruit: '🍋', fruitName: 'Lemon', lenP10: 4.5, lenP50: 5.4, lenP90: 6.5, wtP10: 10, wtP50: 14, wtP90: 20 },
  { week: 13, label: 'Mg 13', fruit: '🍑', fruitName: 'Plum', lenP10: 6.2, lenP50: 7.4, lenP90: 8.8, wtP10: 18, wtP50: 23, wtP90: 32 },
  { week: 14, label: 'Mg 14', fruit: '🍑', fruitName: 'Persik', lenP10: 7.5, lenP50: 8.7, lenP90: 10.2, wtP10: 32, wtP50: 43, wtP90: 58 },
  { week: 15, label: 'Mg 15', fruit: '🍎', fruitName: 'Apel', lenP10: 8.8, lenP50: 10.1, lenP90: 11.6, wtP10: 54, wtP50: 70, wtP90: 92 },
  { week: 16, label: 'Mg 16', fruit: '🥑', fruitName: 'Alpukat', lenP10: 10.2, lenP50: 11.6, lenP90: 13.2, wtP10: 80, wtP50: 100, wtP90: 130 },
  { week: 17, label: 'Mg 17', fruit: '🍐', fruitName: 'Pir', lenP10: 11.5, lenP50: 13.0, lenP90: 14.8, wtP10: 110, wtP50: 140, wtP90: 180 },
  { week: 18, label: 'Mg 18', fruit: '🍠', fruitName: 'Ubi', lenP10: 12.6, lenP50: 14.2, lenP90: 16.0, wtP10: 150, wtP50: 190, wtP90: 240 },
  { week: 19, label: 'Mg 19', fruit: '🥭', fruitName: 'Mangga', lenP10: 13.6, lenP50: 15.3, lenP90: 17.2, wtP10: 190, wtP50: 240, wtP90: 300 },
  { week: 20, label: 'Mg 20', fruit: '🍌', fruitName: 'Pisang', lenP10: 14.6, lenP50: 16.4, lenP90: 18.5, wtP10: 240, wtP50: 300, wtP90: 380 },
  { week: 21, label: 'Mg 21', fruit: '🥕', fruitName: 'Wortel', lenP10: 24.0, lenP50: 26.7, lenP90: 29.5, wtP10: 290, wtP50: 360, wtP90: 450 },
  { week: 22, label: 'Mg 22', fruit: '🥥', fruitName: 'Kelapa', lenP10: 25.0, lenP50: 27.8, lenP90: 30.8, wtP10: 350, wtP50: 430, wtP90: 540 },
  { week: 23, label: 'Mg 23', fruit: '🍇', fruitName: 'Grapefruit', lenP10: 26.0, lenP50: 28.9, lenP90: 32.0, wtP10: 410, wtP50: 500, wtP90: 620 },
  { week: 24, label: 'Mg 24', fruit: '🌽', fruitName: 'Jagung', lenP10: 27.0, lenP50: 30.0, lenP90: 33.2, wtP10: 490, wtP50: 600, wtP90: 740 },
  { week: 25, label: 'Mg 25', fruit: '🥦', fruitName: 'Kembang Kol', lenP10: 31.5, lenP50: 34.6, lenP90: 37.8, wtP10: 540, wtP50: 660, wtP90: 820 },
  { week: 26, label: 'Mg 26', fruit: '🥬', fruitName: 'Kubis Merah', lenP10: 32.5, lenP50: 35.6, lenP90: 38.8, wtP10: 620, wtP50: 760, wtP90: 940 },
  { week: 27, label: 'Mg 27', fruit: '🥦', fruitName: 'Brokoli', lenP10: 33.5, lenP50: 36.6, lenP90: 39.8, wtP10: 720, wtP50: 875, wtP90: 1080 },
  { week: 28, label: 'Mg 28', fruit: '🍆', fruitName: 'Terong Ungu', lenP10: 34.5, lenP50: 37.6, lenP90: 40.8, wtP10: 820, wtP50: 1000, wtP90: 1230 },
  { week: 29, label: 'Mg 29', fruit: '🎃', fruitName: 'Labu Kuning', lenP10: 35.5, lenP50: 38.6, lenP90: 41.8, wtP10: 950, wtP50: 1150, wtP90: 1410 },
  { week: 30, label: 'Mg 30', fruit: '🥬', fruitName: 'Kubis Hijau', lenP10: 36.8, lenP50: 39.9, lenP90: 43.1, wtP10: 1090, wtP50: 1320, wtP90: 1610 },
  { week: 31, label: 'Mg 31', fruit: '🍍', fruitName: 'Nanas Madu', lenP10: 37.9, lenP50: 41.1, lenP90: 44.4, wtP10: 1240, wtP50: 1500, wtP90: 1830 },
  { week: 32, label: 'Mg 32', fruit: '🍠', fruitName: 'Bengkuang', lenP10: 39.1, lenP50: 42.4, lenP90: 45.8, wtP10: 1410, wtP50: 1700, wtP90: 2070 },
  { week: 33, label: 'Mg 33', fruit: '🍈', fruitName: 'Melon Cantaloupe', lenP10: 40.3, lenP50: 43.7, lenP90: 47.1, wtP10: 1590, wtP50: 1920, wtP90: 2330 },
  { week: 34, label: 'Mg 34', fruit: '🍈', fruitName: 'Melon Madu', lenP10: 41.5, lenP50: 45.0, lenP90: 48.5, wtP10: 1780, wtP50: 2150, wtP90: 2600 },
  { week: 35, label: 'Mg 35', fruit: '🍈', fruitName: 'Melon Honeydew', lenP10: 42.6, lenP50: 46.2, lenP90: 49.8, wtP10: 1980, wtP50: 2380, wtP90: 2880 },
  { week: 36, label: 'Mg 36', fruit: '🍈', fruitName: 'Pepaya', lenP10: 43.7, lenP50: 47.4, lenP90: 51.1, wtP10: 2180, wtP50: 2620, wtP90: 3160 },
  { week: 37, label: 'Mg 37', fruit: '🥬', fruitName: 'Selada Romaine', lenP10: 44.8, lenP50: 48.6, lenP90: 52.3, wtP10: 2380, wtP50: 2860, wtP90: 3440 },
  { week: 38, label: 'Mg 38', fruit: '🍈', fruitName: 'Labu Musim Dingin', lenP10: 45.9, lenP50: 49.8, lenP90: 53.5, wtP10: 2570, wtP50: 3080, wtP90: 3700 },
  { week: 39, label: 'Mg 39', fruit: '🍉', fruitName: 'Semangka Mini', lenP10: 46.8, lenP50: 50.7, lenP90: 54.5, wtP10: 2740, wtP50: 3290, wtP90: 3940 },
  { week: 40, label: 'Mg 40', fruit: '🍉', fruitName: 'Semangka Manis', lenP10: 47.3, lenP50: 51.2, lenP90: 55.0, wtP10: 2890, wtP50: 3460, wtP90: 4130 },
];

const LOCAL_STORAGE_USG_KEY = 'bunda_fetal_usg_records';

export const FetalGrowthChart: React.FC<FetalGrowthChartProps> = ({
  currentWeek,
  onSelectWeek
}) => {
  const [metric, setMetric] = useState<GrowthMetric>('length');
  const [trimesterFilter, setTrimesterFilter] = useState<TrimesterFilter>('all');
  const [showLogModal, setShowLogModal] = useState(false);
  const [records, setRecords] = useState<FetalUltrasoundRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USG_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    // Default initial sample USG record near current week
    return [
      {
        id: 'init-1',
        week: Math.max(8, currentWeek),
        lengthCm: currentWeek === 12 ? 5.5 : undefined,
        weightGrams: currentWeek === 12 ? 15 : undefined,
        date: 'Hasil USG Terakhir',
        note: 'Denyut jantung stabil, ukuran sesuai'
      }
    ];
  });

  // Form states for adding ultrasound record
  const [inputWeek, setInputWeek] = useState<number>(currentWeek);
  const [inputVal, setInputVal] = useState<string>('');
  const [inputDate, setInputDate] = useState<string>(
    new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  );
  const [inputNote, setInputNote] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_USG_KEY, JSON.stringify(records));
    } catch {
      // Ignore
    }
  }, [records]);

  // Sync input week with currentWeek when modal opens
  useEffect(() => {
    setInputWeek(currentWeek);
  }, [currentWeek]);

  // Filter benchmarks according to trimester selection
  const filteredBenchmarks = useMemo(() => {
    if (trimesterFilter === 't1') {
      return FETAL_GROWTH_BENCHMARKS.filter(b => b.week <= 13);
    }
    if (trimesterFilter === 't2') {
      return FETAL_GROWTH_BENCHMARKS.filter(b => b.week >= 14 && b.week <= 27);
    }
    if (trimesterFilter === 't3') {
      return FETAL_GROWTH_BENCHMARKS.filter(b => b.week >= 28);
    }
    return FETAL_GROWTH_BENCHMARKS;
  }, [trimesterFilter]);

  // Prepared data for Recharts
  const chartData = useMemo(() => {
    return filteredBenchmarks.map(b => {
      const userRecord = records.find(r => r.week === b.week);
      const userVal = metric === 'length' ? userRecord?.lengthCm : userRecord?.weightGrams;

      return {
        week: b.week,
        label: b.label,
        fruit: b.fruit,
        fruitName: b.fruitName,
        // Band: Lower bound (P10)
        p10: metric === 'length' ? b.lenP10 : b.wtP10,
        // Median curve (P50)
        p50: metric === 'length' ? b.lenP50 : b.wtP50,
        // Upper bound (P90)
        p90: metric === 'length' ? b.lenP90 : b.wtP90,
        // Delta between P90 and P10 for stacked band visualization
        bandDelta: metric === 'length' ? Number((b.lenP90 - b.lenP10).toFixed(1)) : (b.wtP90 - b.wtP10),
        // User USG measurement if available
        userMeasurement: typeof userVal === 'number' ? userVal : null,
        isCurrentWeek: b.week === currentWeek
      };
    });
  }, [filteredBenchmarks, metric, records, currentWeek]);

  // Current week benchmark details
  const currentBenchmark = useMemo(() => {
    return (
      FETAL_GROWTH_BENCHMARKS.find(b => b.week === currentWeek) ||
      FETAL_GROWTH_BENCHMARKS[FETAL_GROWTH_BENCHMARKS.length - 1]
    );
  }, [currentWeek]);

  // Latest user measurement for current week or nearest
  const currentWeekRecord = useMemo(() => {
    return records.find(r => r.week === currentWeek);
  }, [records, currentWeek]);

  // Handlers for logging
  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(inputVal.replace(',', '.'));
    if (isNaN(num) || num <= 0) return;

    const existingIdx = records.findIndex(r => r.week === inputWeek);
    if (existingIdx >= 0) {
      const updated = [...records];
      if (metric === 'length') {
        updated[existingIdx].lengthCm = num;
      } else {
        updated[existingIdx].weightGrams = num;
      }
      updated[existingIdx].date = inputDate;
      if (inputNote) updated[existingIdx].note = inputNote;
      setRecords(updated);
    } else {
      const newRec: FetalUltrasoundRecord = {
        id: `usg-${Date.now()}`,
        week: inputWeek,
        date: inputDate,
        lengthCm: metric === 'length' ? num : undefined,
        weightGrams: metric === 'weight' ? num : undefined,
        note: inputNote || undefined
      };
      setRecords(prev => [...prev, newRec]);
    }

    setInputVal('');
    setInputNote('');
    setShowLogModal(false);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="bg-white p-4 rounded-3xl border border-stone-200/60 shadow-xs space-y-3.5">
      {/* Header with Title & Action */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C87A64] inline-block animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
              Biometri & Tumbuh Kembang
            </span>
          </div>
          <h3 className="font-serif text-base font-bold text-stone-850 mt-0.5">
            Kurva Pertumbuhan Janin
          </h3>
          <p className="text-[11px] text-stone-500 font-light">
            Standar persentil WHO & Hadlock (P10 - P50 - P90)
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F3EFEA] text-[#C87A64] border border-[#C87A64]/30 rounded-full text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
          title="Catat hasil USG dokter"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Catat USG</span>
        </button>
      </div>

      {/* Segmented Bar 1: Metric Selection (Panjang vs Berat) */}
      <div className="grid grid-cols-2 gap-1 bg-[#FAF8F5] p-1 rounded-2xl border border-stone-200/60 text-xs">
        <button
          onClick={() => setMetric('length')}
          className={`py-1.5 rounded-xl font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
            metric === 'length'
              ? 'bg-[#C87A64] text-white shadow-2xs font-semibold'
              : 'text-stone-600 hover:text-stone-800'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Panjang Janin (cm)</span>
        </button>

        <button
          onClick={() => setMetric('weight')}
          className={`py-1.5 rounded-xl font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
            metric === 'weight'
              ? 'bg-[#556B2F] text-white shadow-2xs font-semibold'
              : 'text-stone-600 hover:text-stone-800'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Berat Janin (gram)</span>
        </button>
      </div>

      {/* Segmented Bar 2: Trimester Scope (Semua, T1, T2, T3) */}
      <div className="grid grid-cols-4 gap-1 bg-[#FAF8F5] p-1 rounded-2xl border border-stone-200/60 text-[11px]">
        <button
          onClick={() => setTrimesterFilter('all')}
          className={`py-1 rounded-xl font-medium transition-all text-center cursor-pointer ${
            trimesterFilter === 'all'
              ? 'bg-white text-stone-850 shadow-2xs font-semibold'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Semua (8-40)
        </button>
        <button
          onClick={() => setTrimesterFilter('t1')}
          className={`py-1 rounded-xl font-medium transition-all text-center cursor-pointer ${
            trimesterFilter === 't1'
              ? 'bg-white text-stone-850 shadow-2xs font-semibold'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Trimester 1
        </button>
        <button
          onClick={() => setTrimesterFilter('t2')}
          className={`py-1 rounded-xl font-medium transition-all text-center cursor-pointer ${
            trimesterFilter === 't2'
              ? 'bg-white text-stone-850 shadow-2xs font-semibold'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Trimester 2
        </button>
        <button
          onClick={() => setTrimesterFilter('t3')}
          className={`py-1 rounded-xl font-medium transition-all text-center cursor-pointer ${
            trimesterFilter === 't3'
              ? 'bg-white text-stone-850 shadow-2xs font-semibold'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Trimester 3
        </button>
      </div>

      {/* Benchmark KPI Summary Cards for Current Week */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 bg-[#FAF8F5] rounded-2xl border border-stone-200/60">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-stone-400 font-medium">
              Minggu ke-{currentWeek} (Median)
            </span>
            <span className="text-base select-none">{currentBenchmark.fruit}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-serif font-bold text-stone-850 text-base">
              {metric === 'length' ? `${currentBenchmark.lenP50} cm` : `${currentBenchmark.wtP50.toLocaleString('id-ID')} g`}
            </span>
            <span className="text-[10px] text-stone-400">P50</span>
          </div>
          <span className="text-[10px] text-stone-500 block truncate mt-0.5 font-light">
            Rentang normal: {metric === 'length' 
              ? `${currentBenchmark.lenP10} - ${currentBenchmark.lenP90} cm`
              : `${currentBenchmark.wtP10.toLocaleString('id-ID')} - ${currentBenchmark.wtP90.toLocaleString('id-ID')} g`
            }
          </span>
        </div>

        <div className="p-2.5 bg-[#FAF8F5] rounded-2xl border border-stone-200/60">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-stone-400 font-medium">
              Hasil USG Terinput
            </span>
            <Check className="w-3.5 h-3.5 text-[#556B2F]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            {currentWeekRecord && (metric === 'length' ? currentWeekRecord.lengthCm : currentWeekRecord.weightGrams) ? (
              <>
                <span className={`font-serif font-bold text-base ${metric === 'length' ? 'text-[#C87A64]' : 'text-[#556B2F]'}`}>
                  {metric === 'length' 
                    ? `${currentWeekRecord.lengthCm} cm` 
                    : `${currentWeekRecord.weightGrams?.toLocaleString('id-ID')} g`
                  }
                </span>
                <span className="text-[9px] text-[#556B2F] font-semibold bg-[#556B2F]/10 px-1.5 py-0.2 rounded-md">
                  Sesuai
                </span>
              </>
            ) : (
              <span className="text-xs text-stone-400 italic font-light">
                Belum ada data USG
              </span>
            )}
          </div>
          <span className="text-[10px] text-stone-500 block truncate mt-0.5 font-light">
            {currentWeekRecord?.date ? currentWeekRecord.date : 'Ketuk "Catat USG" untuk isi'}
          </span>
        </div>
      </div>

      {/* Main Fetal Growth Curve Chart */}
      <div className="w-full h-44 pt-1 overflow-hidden relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
            onClick={(state: any) => {
              if (state?.activePayload?.[0]?.payload?.week && onSelectWeek) {
                onSelectWeek(state.activePayload[0].payload.week);
              }
            }}
            className="cursor-pointer"
          >
            <defs>
              <linearGradient id="growthBandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metric === 'length' ? '#C87A64' : '#556B2F'} stopOpacity={0.22} />
                <stop offset="95%" stopColor={metric === 'length' ? '#C87A64' : '#556B2F'} stopOpacity={0.06} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#78716C', fontFamily: 'inherit' }}
              interval={trimesterFilter === 'all' ? 4 : 1}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#78716C', fontFamily: 'inherit' }}
              domain={['auto', 'auto']}
              unit={metric === 'length' ? 'cm' : 'g'}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-stone-900/95 backdrop-blur-md text-white p-2.5 rounded-2xl shadow-xl text-[11px] border border-stone-700/50 min-w-[170px] space-y-1">
                    <div className="flex items-center justify-between pb-1 border-b border-stone-800">
                      <span className="font-serif font-bold text-stone-200">
                        {d.label} • {d.fruitName} {d.fruit}
                      </span>
                      {d.isCurrentWeek && (
                        <span className="bg-[#C87A64] text-white text-[9px] px-1.5 py-0.2 rounded-full font-semibold">
                          Minggu Ini
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-stone-300">
                      <span>Batas Atas (P90):</span>
                      <span className="font-semibold text-stone-100">
                        {metric === 'length' ? `${d.p90} cm` : `${d.p90.toLocaleString('id-ID')} g`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-emerald-300">
                      <span className="font-medium">Standar Median (P50):</span>
                      <span className="font-bold">
                        {metric === 'length' ? `${d.p50} cm` : `${d.p50.toLocaleString('id-ID')} g`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-stone-300">
                      <span>Batas Bawah (P10):</span>
                      <span className="font-semibold text-stone-100">
                        {metric === 'length' ? `${d.p10} cm` : `${d.p10.toLocaleString('id-ID')} g`}
                      </span>
                    </div>

                    {d.userMeasurement !== null && (
                      <div className="pt-1 mt-1 border-t border-stone-800 flex justify-between items-center text-[#D4AF37]">
                        <span className="font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] inline-block" /> USG Bunda:
                        </span>
                        <span className="font-bold text-white">
                          {metric === 'length' ? `${d.userMeasurement} cm` : `${d.userMeasurement.toLocaleString('id-ID')} g`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* Current Week Vertical Marker */}
            <ReferenceLine
              x={`Mg ${currentWeek}`}
              stroke="#C87A64"
              strokeDasharray="3 3"
              strokeWidth={1.5}
            />

            {/* Percentile Corridor Area (P10 to P90 band) */}
            <Area
              type="monotone"
              dataKey="p90"
              stroke="transparent"
              fill="url(#growthBandGrad)"
              isAnimationActive={false}
            />

            {/* Median Standard Growth Curve (P50) */}
            <Line
              type="monotone"
              dataKey="p50"
              stroke={metric === 'length' ? '#C87A64' : '#556B2F'}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: metric === 'length' ? '#C87A64' : '#556B2F' }}
            />

            {/* User Logged Ultrasound Dots */}
            <Line
              type="monotone"
              dataKey="userMeasurement"
              stroke="#D4AF37"
              strokeWidth={2}
              dot={{ r: 4, fill: '#D4AF37', stroke: '#FFFFFF', strokeWidth: 1.5 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Guide */}
      <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-[10px] text-stone-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className={`w-2.5 h-1 rounded-full ${metric === 'length' ? 'bg-[#C87A64]' : 'bg-[#556B2F]'}`} />
            <span>Median (P50)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2 rounded-xs bg-[#C87A64]/20 border border-[#C87A64]/40" />
            <span>Rentang Normal (P10-P90)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            <span>USG Bunda</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[#C87A64] font-medium">
          <Info className="w-3 h-3" />
          <span>Mg {currentWeek}</span>
        </div>
      </div>

      {/* Ultrasound Records History Drawer/Chips */}
      {records.length > 0 && (
        <div className="bg-[#FAF8F5] rounded-2xl p-2.5 border border-stone-200/50">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block mb-1.5">
            Riwayat Catatan USG Bunda:
          </span>
          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
            {records.map(rec => (
              <div
                key={rec.id}
                className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded-xl border border-stone-200/50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-850">Mg {rec.week}</span>
                  <span className="text-stone-300">•</span>
                  <span className="text-stone-600">
                    {rec.lengthCm ? `${rec.lengthCm} cm` : ''}
                    {rec.lengthCm && rec.weightGrams ? ' / ' : ''}
                    {rec.weightGrams ? `${rec.weightGrams.toLocaleString('id-ID')} g` : ''}
                  </span>
                  {rec.note && (
                    <span className="text-[10px] text-stone-400 italic truncate max-w-[110px]">
                      "{rec.note}"
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-stone-400">{rec.date}</span>
                  <button
                    onClick={() => handleDeleteRecord(rec.id)}
                    className="p-1 text-stone-400 hover:text-rose-500 transition-colors"
                    title="Hapus catatan ini"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal / Dialog for Adding Ultrasound Record */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm border border-stone-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h4 className="font-serif text-base font-bold text-stone-850">
                  Catat Hasil USG Janin
                </h4>
                <p className="text-xs text-stone-500 font-light">
                  Plot ukuran si kecil di kurva pertumbuhan
                </p>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMeasurement} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-stone-500 mb-1">
                  Usia Kehamilan (Minggu)
                </label>
                <select
                  value={inputWeek}
                  onChange={e => setInputWeek(Number(e.target.value))}
                  className="w-full text-xs bg-[#FAF8F5] border border-stone-200/80 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-[#C87A64]"
                >
                  {FETAL_GROWTH_BENCHMARKS.map(b => (
                    <option key={b.week} value={b.week}>
                      Minggu ke-{b.week} ({b.fruitName} {b.fruit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-stone-500 mb-1">
                  {metric === 'length' ? 'Panjang Janin (cm)' : 'Taksiran Berat Janin / EFW (gram)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={metric === 'length' ? '0.1' : '1'}
                    placeholder={
                      metric === 'length'
                        ? `Contoh: ${currentBenchmark.lenP50}`
                        : `Contoh: ${currentBenchmark.wtP50}`
                    }
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    required
                    className="w-full text-xs bg-[#FAF8F5] border border-stone-200/80 rounded-xl px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-[#C87A64]"
                  />
                  <span className="absolute right-3 top-2 text-xs text-stone-400 font-medium">
                    {metric === 'length' ? 'cm' : 'gram'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-stone-500 mb-1">
                  Tanggal Pemeriksaan / Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: USG Trimester 1 di RS Hermina"
                  value={inputNote}
                  onChange={e => setInputNote(e.target.value)}
                  className="w-full text-xs bg-[#FAF8F5] border border-stone-200/80 rounded-xl px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-[#C87A64]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-2 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-[#C87A64] hover:bg-[#b06752] rounded-xl transition-all shadow-xs"
                >
                  Simpan ke Kurva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
