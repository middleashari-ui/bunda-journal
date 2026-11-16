import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { Creative, DailyMetric } from '../types';
import { formatDate, formatIdrCompact, formatNumber, formatPercent } from '../lib/format';

const SAGE = 'var(--ads-chart-sage)';
const TERRA = 'var(--ads-chart-terra)';
const AMBER = 'var(--ads-chart-amber)';
const SLATE = 'var(--ads-chart-slate)';

function TooltipBox({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ads-tooltip">
      {label ? <strong>{String(label)}</strong> : null}
      {payload.map((item: any) => (
        <div key={item.dataKey ?? item.name} className="ads-tooltip-row">
          <span style={{ color: item.color }}>{item.name}</span>
          <span>
            {typeof item.value === 'number'
              ? item.name?.toString().toLowerCase().includes('order')
                ? formatNumber(item.value)
                : formatIdrCompact(item.value)
              : String(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PerformanceChart({ data }: { data: DailyMetric[] }) {
  return (
    <div className="ads-chart" data-testid="performance-chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="var(--ads-chart-grid)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatDate(String(value))}
            tick={{ fill: 'var(--ads-chart-tick)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={22}
          />
          <YAxis
            tickFormatter={(value) => formatIdrCompact(Number(value))}
            tick={{ fill: 'var(--ads-chart-tick)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip content={<TooltipBox />} />
          <Line type="monotone" dataKey="revenue" name="Revenue bank" stroke={SAGE} strokeWidth={2.2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          <Line type="monotone" dataKey="spend" name="Spend" stroke={TERRA} strokeWidth={1.8} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="profit" name="Profit" stroke={AMBER} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CreativeQuadrant({ creatives }: { creatives: Creative[] }) {
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] ?? 0;
  };
  const medianCtr = median(creatives.map((item) => (item.impressions > 0 ? item.clicks / item.impressions : 0)));
  const medianCvr = median(creatives.map((item) => (item.lpv > 0 ? item.orders / item.lpv : 0)));
  const data = creatives.map((item) => ({
    name: item.name,
    x: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
    y: item.lpv > 0 ? (item.orders / item.lpv) * 100 : 0,
    z: Math.max(80, item.spend / 1000),
    spend: item.spend,
    tone: item.orders === 0 ? TERRA : item.frequency > 3 ? AMBER : SAGE,
  }));
  const xMax = Math.max(1, ...data.map((item) => item.x)) * 1.15;
  const yMax = Math.max(1, ...data.map((item) => item.y)) * 1.2;
  return (
    <div className="ads-chart ads-chart-scatter" data-testid="creative-quadrant">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 18, left: -12, bottom: 8 }}>
          <CartesianGrid stroke="var(--ads-chart-grid)" strokeDasharray="2 4" />
          <XAxis
            type="number"
            dataKey="x"
            name="CTR"
            tickFormatter={(value) => `${Number(value).toFixed(1)}%`}
            tick={{ fill: 'var(--ads-chart-tick)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[0, xMax]}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="CVR LPV"
            tickFormatter={(value) => `${Number(value).toFixed(1)}%`}
            tick={{ fill: 'var(--ads-chart-tick)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[0, yMax]}
          />
          <ZAxis type="number" dataKey="z" range={[80, 520]} />
          <ReferenceLine x={medianCtr * 100} stroke="var(--ads-chart-axis)" strokeDasharray="4 4" />
          <ReferenceLine y={medianCvr * 100} stroke="var(--ads-chart-axis)" strokeDasharray="4 4" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload;
              return (
                <div className="ads-tooltip">
                  <strong>{point?.name}</strong>
                  <div className="ads-tooltip-row"><span>CTR</span><span>{formatPercent(point?.x / 100)}</span></div>
                  <div className="ads-tooltip-row"><span>CVR LPV</span><span>{formatPercent(point?.y / 100)}</span></div>
                  <div className="ads-tooltip-row"><span>Spend</span><span>{formatIdrCompact(point?.spend)}</span></div>
                </div>
              );
            }}
          />
          <Scatter data={data} name="Kreatif" isAnimationActive={false}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.tone} fillOpacity={0.82} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BreakdownBars({
  rows,
  valueKey = 'spend',
}: {
  rows: { value: string; spend: number; orders: number; revenue: number; impressions: number }[];
  valueKey?: 'spend' | 'orders' | 'revenue';
}) {
  return (
    <div className="ads-chart ads-chart-bars">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 18, left: 8, bottom: 4 }}>
          <CartesianGrid stroke="var(--ads-chart-grid)" strokeDasharray="2 4" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(value) =>
              valueKey === 'orders' ? formatNumber(Number(value)) : formatIdrCompact(Number(value))
            }
            tick={{ fill: 'var(--ads-chart-tick)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="value"
            width={132}
            tick={{ fill: 'var(--ads-chart-tick)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null;
              const row = payload[0]?.payload;
              return (
                <div className="ads-tooltip">
                  <strong>{row?.value}</strong>
                  <div className="ads-tooltip-row"><span>Spend</span><span>{formatIdrCompact(row?.spend)}</span></div>
                  <div className="ads-tooltip-row"><span>Order</span><span>{formatNumber(row?.orders)}</span></div>
                  <div className="ads-tooltip-row"><span>Revenue</span><span>{formatIdrCompact(row?.revenue)}</span></div>
                </div>
              );
            }}
          />
          <Bar dataKey={valueKey} radius={[0, 5, 5, 0]} barSize={16} isAnimationActive={false}>
            {rows.map((row, index) => (
              <Cell key={row.value} fill={index === 0 ? SAGE : index === 1 ? SLATE : index === 2 ? AMBER : TERRA} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
