import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { subDays, subMonths, subYears, format, eachDayOfInterval, parseISO } from 'date-fns';
import { TrendingUp } from 'lucide-react';

type TimeRange = '1w' | '1m' | '6m' | '1y';

interface DayData {
  entries: { calories: number; protein: number; carbs: number; fat: number }[];
  goal: number;
}

interface HistoryChartProps {
  days: Record<string, DayData>;
  goal: number;
}

const RANGES: { key: TimeRange; label: string }[] = [
  { key: '1w', label: 'Week' },
  { key: '1m', label: 'Month' },
  { key: '6m', label: '6 Months' },
  { key: '1y', label: 'Year' },
];

function getRangeStart(range: TimeRange, today: Date): Date {
  switch (range) {
    case '1w': return subDays(today, 6);
    case '1m': return subMonths(today, 1);
    case '6m': return subMonths(today, 6);
    case '1y': return subYears(today, 1);
  }
}

function formatLabel(dateStr: string, range: TimeRange): string {
  const d = parseISO(dateStr);
  switch (range) {
    case '1w': return format(d, 'EEE');
    case '1m': return format(d, 'd');
    case '6m': return format(d, 'MMM d');
    case '1y': return format(d, 'MMM');
  }
}

interface ChartDataPoint {
  date: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  hasData: boolean;
}

export default function HistoryChart({ days, goal }: HistoryChartProps) {
  const [range, setRange] = useState<TimeRange>('1w');

  const { chartData, avg, daysWithData } = useMemo(() => {
    const today = new Date();
    const start = getRangeStart(range, today);
    const allDays = eachDayOfInterval({ start, end: today });

    // For 6m and 1y, aggregate by week to keep bars readable
    const shouldAggregate = range === '6m' || range === '1y';

    if (shouldAggregate) {
      const weekMap = new Map<string, { calories: number; protein: number; carbs: number; fat: number; count: number; dataCount: number; hasData: boolean }>();

      for (const d of allDays) {
        // Group by week start (Monday)
        const weekKey = range === '1y'
          ? format(d, 'yyyy-MM') // group by month for year view
          : format(subDays(d, d.getDay()), 'yyyy-MM-dd'); // group by week for 6m

        const ds = format(d, 'yyyy-MM-dd');
        const day = days[ds];
        const cals = day ? day.entries.reduce((s, e) => s + e.calories, 0) : 0;
        const p = day ? day.entries.reduce((s, e) => s + e.protein, 0) : 0;
        const c = day ? day.entries.reduce((s, e) => s + e.carbs, 0) : 0;
        const f = day ? day.entries.reduce((s, e) => s + e.fat, 0) : 0;
        const hasEntries = day ? day.entries.length > 0 : false;

        const existing = weekMap.get(weekKey) || { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0, dataCount: 0, hasData: false };
        existing.calories += cals;
        existing.protein += p;
        existing.carbs += c;
        existing.fat += f;
        existing.count += 1;
        if (hasEntries) {
          existing.dataCount += 1;
          existing.hasData = true;
        }
        weekMap.set(weekKey, existing);
      }

      const data: ChartDataPoint[] = [];
      let totalCals = 0;
      let dataCount = 0;

      for (const [key, val] of weekMap) {
        const divisor = val.dataCount || 1;
        const avgCals = Math.round(val.calories / divisor);
        data.push({
          date: key,
          label: range === '1y' ? format(parseISO(key + '-01'), 'MMM') : formatLabel(key, range),
          calories: avgCals,
          protein: Math.round(val.protein / divisor),
          carbs: Math.round(val.carbs / divisor),
          fat: Math.round(val.fat / divisor),
          hasData: val.hasData,
        });
        if (val.hasData) {
          totalCals += avgCals;
          dataCount++;
        }
      }

      return {
        chartData: data,
        avg: dataCount > 0 ? Math.round(totalCals / dataCount) : 0,
        daysWithData: dataCount,
      };
    }

    // Daily view (1w, 1m)
    const data: ChartDataPoint[] = [];
    let totalCals = 0;
    let dataCount = 0;

    for (const d of allDays) {
      const ds = format(d, 'yyyy-MM-dd');
      const day = days[ds];
      const cals = day ? day.entries.reduce((s, e) => s + e.calories, 0) : 0;
      const hasEntries = day ? day.entries.length > 0 : false;

      data.push({
        date: ds,
        label: formatLabel(ds, range),
        calories: cals,
        protein: day ? day.entries.reduce((s, e) => s + e.protein, 0) : 0,
        carbs: day ? day.entries.reduce((s, e) => s + e.carbs, 0) : 0,
        fat: day ? day.entries.reduce((s, e) => s + e.fat, 0) : 0,
        hasData: hasEntries,
      });

      if (hasEntries) {
        totalCals += cals;
        dataCount++;
      }
    }

    return {
      chartData: data,
      avg: dataCount > 0 ? Math.round(totalCals / dataCount) : 0,
      daysWithData: dataCount,
    };
  }, [days, range]);

  const rangeSubtitle = range === '6m' || range === '1y' ? 'daily avg per period' : 'daily';

  return (
    <section className="bg-white rounded-lg p-6 md:p-8 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#7C3AED]" />
          <div
            className="text-[11px] uppercase tracking-[0.15em] text-gray-500"
            style={{ fontFamily: 'DM Sans' }}
          >
            History
          </div>
        </div>
      </div>

      {/* Range tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-full p-1 w-fit">
        {RANGES.map(r => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`px-4 py-1.5 rounded-full text-[12px] uppercase tracking-[0.1em] transition-colors ${
              range === r.key
                ? 'bg-white text-[#1A1A1A] shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            style={{ fontFamily: 'DM Sans' }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6 mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] text-gray-400 mb-1" style={{ fontFamily: 'DM Sans' }}>
            Avg {rangeSubtitle}
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-[28px] leading-[1.1] tracking-[-0.02em] ${avg > goal ? 'text-[#DC2626]' : 'text-[#1A1A1A]'}`}
              style={{ fontFamily: 'DM Serif Display' }}
            >
              {avg}
            </span>
            <span className="text-[14px] text-gray-400" style={{ fontFamily: 'DM Sans' }}>
              kcal
            </span>
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] text-gray-400 mb-1" style={{ fontFamily: 'DM Sans' }}>
            Days tracked
          </div>
          <span
            className="text-[28px] leading-[1.1] tracking-[-0.02em] text-[#1A1A1A]"
            style={{ fontFamily: 'DM Serif Display' }}
          >
            {daysWithData}
          </span>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] text-gray-400 mb-1" style={{ fontFamily: 'DM Sans' }}>
            Goal
          </div>
          <span
            className="text-[28px] leading-[1.1] tracking-[-0.02em] text-[#1A1A1A]"
            style={{ fontFamily: 'DM Serif Display' }}
          >
            {goal}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fontFamily: 'DM Sans', fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              interval={range === '1m' ? 2 : 0}
            />
            <YAxis
              tick={{ fontSize: 11, fontFamily: 'DM Sans', fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as ChartDataPoint;
                if (!d.hasData) return null;
                return (
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3" style={{ fontFamily: 'DM Sans' }}>
                    <div className="text-[13px] font-medium text-[#1A1A1A] mb-1">
                      {d.calories} kcal
                    </div>
                    <div className="text-[11px] text-gray-400 space-y-0.5">
                      <div>Protein: {d.protein}g</div>
                      <div>Carbs: {d.carbs}g</div>
                      <div>Fat: {d.fat}g</div>
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={goal}
              stroke="#DC2626"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{
                value: `Goal: ${goal}`,
                position: 'right',
                fontSize: 10,
                fontFamily: 'DM Sans',
                fill: '#DC2626',
              }}
            />
            <ReferenceLine
              y={avg}
              stroke="#7C3AED"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
              label={{
                value: `Avg: ${avg}`,
                position: 'left',
                fontSize: 10,
                fontFamily: 'DM Sans',
                fill: '#7C3AED',
              }}
            />
            <Bar dataKey="calories" radius={[4, 4, 0, 0]} maxBarSize={range === '1w' ? 48 : 24}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    !entry.hasData
                      ? '#f3f4f6'
                      : entry.calories > goal
                        ? 'rgba(220, 38, 38, 0.6)'
                        : 'rgba(124, 58, 237, 0.6)'
                  }
                  stroke={
                    !entry.hasData
                      ? 'transparent'
                      : entry.calories > goal
                        ? 'rgba(220, 38, 38, 0.8)'
                        : 'rgba(124, 58, 237, 0.8)'
                  }
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(124, 58, 237, 0.6)' }} />
          <span className="text-[11px] text-gray-400" style={{ fontFamily: 'DM Sans' }}>Under goal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(220, 38, 38, 0.6)' }} />
          <span className="text-[11px] text-gray-400" style={{ fontFamily: 'DM Sans' }}>Over goal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-6 border-t-2 border-dashed border-[#DC2626]/50" />
          <span className="text-[11px] text-gray-400" style={{ fontFamily: 'DM Sans' }}>Goal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-6 border-t-2 border-dashed border-[#7C3AED]/40" />
          <span className="text-[11px] text-gray-400" style={{ fontFamily: 'DM Sans' }}>Average</span>
        </div>
      </div>
    </section>
  );
}
