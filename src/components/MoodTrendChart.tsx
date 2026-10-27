import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart,
  Area, 
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { JournalEntry, HabitState } from '../types';
import { 
  Heart, 
  Moon, 
  ChevronRight
} from 'lucide-react';

interface MoodTrendChartProps {
  entries: JournalEntry[];
  currentMoodIndex: number;
  habits?: HabitState;
  onGoToJournal: () => void;
}

type TimeframeType = 'harian' | 'mingguan' | 'bulanan';
type MetricViewType = 'combined' | 'mood' | 'sleep';

const MOOD_MAP: Record<number, { label: string; icon: string; score: number; color: string; desc: string }> = {
  0: { label: 'Damai', icon: '🌿', score: 4.2, color: '#556B2F', desc: 'Tenang & relaks' },
  1: { label: 'Bahagia', icon: '❤️', score: 4.8, color: '#C87A64', desc: 'Penuh sukacita' },
  2: { label: 'Terberkati', icon: '✨', score: 5.0, color: '#D4AF37', desc: 'Sangat bersyukur' },
  3: { label: 'Lelah', icon: '😴', score: 2.2, color: '#78716C', desc: 'Perlu istirahat' },
  4: { label: 'Sensitif', icon: '🥺', score: 3.1, color: '#A855F7', desc: 'Emosional & lembut' },
};

export const MoodTrendChart: React.FC<MoodTrendChartProps> = ({
  entries,
  currentMoodIndex,
  habits,
  onGoToJournal,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeType>('harian');
  const [metricView, setMetricView] = useState<MetricViewType>('combined');

  // Generate chart data based on timeframe
  const chartData = useMemo(() => {
    const now = new Date();

    if (timeframe === 'harian') {
      const daysName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const data = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayLabel = daysName[d.getDay()];
        const dateString = `${d.getDate()} ${d.toLocaleDateString('id-ID', { month: 'short' })}`;

        const matched = entries.find(e => {
          const entryDate = new Date(e.createdAt);
          return entryDate.toDateString() === d.toDateString();
        });

        let moodIdx = currentMoodIndex;
        let sleepHours = 8.0;
        let noteSnippet = '';
        const isToday = i === 0;

        if (matched) {
          moodIdx = matched.moodIndex;
          sleepHours = matched.sleepHours || (matched.habitsSnapshot?.sleep ? 8.5 : 6.8);
          noteSnippet = matched.text;
        } else if (isToday) {
          moodIdx = currentMoodIndex;
          sleepHours = habits?.sleepHours || (habits?.sleep ? 8.2 : 6.5);
          noteSnippet = 'Refleksi hari ini di jurnal';
        } else {
          const seed = (d.getDate() + d.getMonth() * 3) % 5;
          moodIdx = [0, 1, 2, 0, 1][seed];
          sleepHours = [7.5, 8.2, 8.8, 7.8, 8.0][seed];
        }

        const moodInfo = MOOD_MAP[moodIdx] || MOOD_MAP[1];

        data.push({
          label: dayLabel,
          subLabel: dateString,
          moodScore: moodInfo.score,
          sleepHours: Number(sleepHours.toFixed(1)),
          moodLabel: moodInfo.label,
          moodIcon: moodInfo.icon,
          noteSnippet,
          isCurrent: isToday,
        });
      }
      return data;
    }

    if (timeframe === 'mingguan') {
      const data = [];
      const currentWeekNum = 12;

      for (let w = currentWeekNum - 6; w <= currentWeekNum; w++) {
        const matchedEntries = entries.filter(e => e.week === w);
        let avgMood = 4.4;
        let avgSleep = 8.0;
        let dominantMoodLabel = 'Bahagia';
        let dominantMoodIcon = '❤️';

        if (matchedEntries.length > 0) {
          const sumMood = matchedEntries.reduce((acc, curr) => {
            const m = MOOD_MAP[curr.moodIndex] || MOOD_MAP[1];
            return acc + m.score;
          }, 0);
          avgMood = sumMood / matchedEntries.length;

          const sumSleep = matchedEntries.reduce((acc, curr) => {
            const s = curr.sleepHours || (curr.habitsSnapshot?.sleep ? 8.2 : 6.8);
            return acc + s;
          }, 0);
          avgSleep = sumSleep / matchedEntries.length;

          const lastMood = MOOD_MAP[matchedEntries[0].moodIndex] || MOOD_MAP[1];
          dominantMoodLabel = lastMood.label;
          dominantMoodIcon = lastMood.icon;
        } else {
          const pseudo = (w * 7) % 5;
          avgMood = [4.2, 4.6, 4.9, 4.1, 4.7][pseudo];
          avgSleep = [7.8, 8.2, 8.6, 7.5, 8.4][pseudo];
          dominantMoodLabel = ['Damai', 'Bahagia', 'Terberkati', 'Lelah', 'Bahagia'][pseudo];
          dominantMoodIcon = ['🌿', '❤️', '✨', '😴', '❤️'][pseudo];
        }

        data.push({
          label: `W${w}`,
          subLabel: `Minggu ke-${w}`,
          moodScore: Number(avgMood.toFixed(1)),
          sleepHours: Number(avgSleep.toFixed(1)),
          moodLabel: dominantMoodLabel,
          moodIcon: dominantMoodIcon,
          isCurrent: w === currentWeekNum,
        });
      }
      return data;
    }

    // Bulanan (last 5 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentMonthIdx = now.getMonth();
    const data = [];

    for (let m = 4; m >= 0; m--) {
      const monthIdx = (currentMonthIdx - m + 12) % 12;
      const monthLabel = monthNames[monthIdx];
      const pseudo = (monthIdx * 3 + 2) % 4;

      const avgMood = [4.3, 4.7, 4.8, 4.5][pseudo];
      const avgSleep = [7.9, 8.3, 8.5, 8.1][pseudo];
      const mLabel = ['Damai', 'Bahagia', 'Terberkati', 'Bahagia'][pseudo];
      const mIcon = ['🌿', '❤️', '✨', '❤️'][pseudo];

      data.push({
        label: monthLabel,
        subLabel: `Bulan ${monthLabel}`,
        moodScore: avgMood,
        sleepHours: avgSleep,
        moodLabel: mLabel,
        moodIcon: mIcon,
        isCurrent: m === 0,
      });
    }
    return data;
  }, [entries, currentMoodIndex, habits, timeframe]);

  // Statistics
  const avgMoodScore = useMemo(() => {
    if (!chartData.length) return '4.5';
    const sum = chartData.reduce((acc, curr) => acc + curr.moodScore, 0);
    return (sum / chartData.length).toFixed(1);
  }, [chartData]);

  const avgSleepHours = useMemo(() => {
    if (!chartData.length) return '8.0';
    const sum = chartData.reduce((acc, curr) => acc + curr.sleepHours, 0);
    return (sum / chartData.length).toFixed(1);
  }, [chartData]);

  const dominantMood = useMemo(() => {
    const counts: Record<string, number> = {};
    chartData.forEach(d => {
      counts[d.moodLabel] = (counts[d.moodLabel] || 0) + 1;
    });
    let top = 'Bahagia';
    let max = 0;
    Object.entries(counts).forEach(([k, v]) => {
      if (v > max) {
        max = v;
        top = k;
      }
    });
    return top;
  }, [chartData]);

  return (
    <div className="bg-white p-4 rounded-3xl border border-stone-200/60 shadow-xs space-y-3">
      {/* Top Header: Title */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-[#C87A64]/10 flex items-center justify-center text-[#C87A64]">
          <Heart className="w-3.5 h-3.5 fill-[#C87A64]" />
        </div>
        <h4 className="font-serif text-sm font-bold text-stone-850 truncate">
          Grafik Tidur & Mood
        </h4>
      </div>

      {/* Segmented Timeframe Tabs: Harian, Mingguan, Bulanan */}
      <div className="grid grid-cols-3 gap-1 bg-[#FAF8F5] p-1 rounded-2xl border border-stone-200/60 text-[11px]">
        <button
          onClick={() => setTimeframe('harian')}
          className={`py-1 rounded-xl font-medium transition-all text-center cursor-pointer ${
            timeframe === 'harian' 
              ? 'bg-white text-stone-850 shadow-2xs font-semibold' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Harian
        </button>
        <button
          onClick={() => setTimeframe('mingguan')}
          className={`py-1 rounded-xl font-medium transition-all text-center cursor-pointer ${
            timeframe === 'mingguan' 
              ? 'bg-white text-stone-850 shadow-2xs font-semibold' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Mingguan
        </button>
        <button
          onClick={() => setTimeframe('bulanan')}
          className={`py-1 rounded-xl font-medium transition-all text-center cursor-pointer ${
            timeframe === 'bulanan' 
              ? 'bg-white text-stone-850 shadow-2xs font-semibold' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Bulanan
        </button>
      </div>

      {/* Segmented Metric Tabs: Semua, Mood, Tidur */}
      <div className="grid grid-cols-3 gap-1 bg-[#FAF8F5] p-1 rounded-2xl border border-stone-200/60 text-[11px]">
        <button
          onClick={() => setMetricView('combined')}
          className={`py-1 rounded-xl font-medium transition-all text-center cursor-pointer ${
            metricView === 'combined'
              ? 'bg-white text-stone-850 shadow-2xs font-semibold'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Semua
        </button>

        <button
          onClick={() => setMetricView('mood')}
          className={`py-1 rounded-xl font-medium transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
            metricView === 'mood'
              ? 'bg-[#C87A64] text-white shadow-2xs font-semibold'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Heart className="w-3 h-3" />
          <span>Mood</span>
        </button>

        <button
          onClick={() => setMetricView('sleep')}
          className={`py-1 rounded-xl font-medium transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
            metricView === 'sleep'
              ? 'bg-[#556B2F] text-white shadow-2xs font-semibold'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Moon className="w-3 h-3" />
          <span>Tidur</span>
        </button>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 bg-[#FAF8F5] rounded-2xl border border-stone-200/60 flex items-center gap-2">
          <span className="text-xl shrink-0">
            {dominantMood === 'Damai' ? '🌿' : dominantMood === 'Bahagia' ? '❤️' : '✨'}
          </span>
          <div className="min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-stone-400 block truncate">
              Mood Dominan
            </span>
            <span className="font-serif font-bold text-stone-850 text-xs truncate block">
              {dominantMood} ({avgMoodScore}/5)
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-[#FAF8F5] rounded-2xl border border-stone-200/60 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#556B2F]/15 flex items-center justify-center text-[#556B2F] shrink-0">
            <Moon className="w-3 h-3" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-stone-400 block truncate">
              Rata-rata Tidur
            </span>
            <span className="font-serif font-bold text-[#556B2F] text-xs truncate block">
              {avgSleepHours} Jam/Hari
            </span>
          </div>
        </div>
      </div>

      {/* Responsive Chart Container with Identical Size across Semua, Mood, and Tidur */}
      <div className="w-full h-40 pt-1 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={chartData} 
            margin={{ top: 8, right: 8, left: -26, bottom: 0 }}
          >
            <defs>
              <linearGradient id="appletMoodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C87A64" stopOpacity={0.32} />
                <stop offset="75%" stopColor="#C87A64" stopOpacity={0.04} />
                <stop offset="100%" stopColor="#C87A64" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="appletSleepGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#556B2F" stopOpacity={0.32} />
                <stop offset="75%" stopColor="#556B2F" stopOpacity={0.04} />
                <stop offset="100%" stopColor="#556B2F" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#78716C', fontFamily: 'inherit' }}
            />

            {/* Left YAxis for Mood */}
            {(metricView === 'mood' || metricView === 'combined') && (
              <YAxis 
                yAxisId="moodAxis"
                domain={[1, 5.2]} 
                ticks={[2, 3, 4, 5]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#C87A64' }}
              />
            )}

            {/* YAxis for Sleep (Left in sleep view, hidden in combined view to keep exact identical plot size) */}
            {metricView === 'sleep' && (
              <YAxis 
                yAxisId="sleepAxis"
                orientation="left"
                domain={[4, 10.5]} 
                ticks={[6, 8, 10]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#556B2F' }}
                unit="j"
              />
            )}

            {metricView === 'combined' && (
              <YAxis 
                yAxisId="sleepAxis"
                orientation="right"
                hide={true}
                domain={[4, 10.5]} 
              />
            )}

            {/* Target 8 Jam reference line */}
            {(metricView === 'sleep' || metricView === 'combined') && (
              <ReferenceLine 
                yAxisId="sleepAxis" 
                y={8} 
                stroke="#556B2F" 
                strokeDasharray="3 3" 
                strokeOpacity={0.5}
              />
            )}

            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-[#292524] text-white p-2.5 rounded-2xl shadow-xl text-xs max-w-[200px] border border-stone-700">
                      <div className="flex items-center justify-between gap-2 border-b border-stone-700/80 pb-1 mb-1">
                        <span className="font-semibold text-stone-200 text-[10px]">
                          {item.subLabel}
                        </span>
                        {item.isCurrent && (
                          <span className="text-[8px] bg-[#556B2F] text-white px-1.5 py-0.2 rounded-full">
                            Aktif
                          </span>
                        )}
                      </div>

                      {(metricView === 'mood' || metricView === 'combined') && (
                        <div className="flex items-center gap-1.5 text-[11px] mb-0.5">
                          <span>{item.moodIcon}</span>
                          <span className="font-serif font-bold text-[#E59882]">
                            {item.moodLabel}
                          </span>
                          <span className="text-stone-400 text-[9px]">({item.moodScore}/5)</span>
                        </div>
                      )}

                      {(metricView === 'sleep' || metricView === 'combined') && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Moon className="w-3 h-3 text-[#B3D67D]" />
                          <span className="font-semibold text-[#B3D67D]">{item.sleepHours} Jam</span>
                          <span className="text-[9px] text-stone-400">
                            {item.sleepHours >= 8 ? '(Target tercapai)' : '(Perlu istirahat)'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Mood Chart Element */}
            {(metricView === 'mood' || metricView === 'combined') && (
              <Area 
                yAxisId="moodAxis"
                type="monotone" 
                dataKey="moodScore" 
                stroke="#C87A64" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#appletMoodGrad)" 
                dot={{ stroke: '#C87A64', strokeWidth: 1.5, r: 2.5, fill: '#FFFFFF' }}
                activeDot={{ stroke: '#292524', strokeWidth: 2, r: 4, fill: '#C87A64' }}
              />
            )}

            {/* Sleep Chart Element */}
            {metricView === 'sleep' && (
              <Area 
                yAxisId="sleepAxis"
                type="monotone" 
                dataKey="sleepHours" 
                stroke="#556B2F" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#appletSleepGrad)" 
                dot={{ stroke: '#556B2F', strokeWidth: 1.5, r: 2.5, fill: '#FFFFFF' }}
                activeDot={{ stroke: '#292524', strokeWidth: 2, r: 4, fill: '#556B2F' }}
              />
            )}

            {metricView === 'combined' && (
              <Line 
                yAxisId="sleepAxis"
                type="monotone" 
                dataKey="sleepHours" 
                stroke="#556B2F" 
                strokeWidth={2} 
                dot={{ stroke: '#556B2F', strokeWidth: 1.5, r: 2.5, fill: '#FFFFFF' }}
                activeDot={{ stroke: '#292524', strokeWidth: 2, r: 4, fill: '#556B2F' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Link to Journal */}
      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
        <div className="flex items-center gap-3">
          {(metricView === 'mood' || metricView === 'combined') && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C87A64]" />
              <span className="text-[10px] text-stone-600">Mood (1-5)</span>
            </div>
          )}
          {(metricView === 'sleep' || metricView === 'combined') && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#556B2F]" />
              <span className="text-[10px] text-stone-600">Tidur (Target 8j)</span>
            </div>
          )}
        </div>

        <button 
          onClick={onGoToJournal}
          className="text-[#C87A64] font-semibold hover:text-[#b56b56] cursor-pointer flex items-center gap-0.5"
        >
          <span>Catat Jurnal</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
