import { AlertTriangle, CheckCircle2, Clock, Wind } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AqiAnalysis } from '../../lib/types.js';
import {
  formatShortTime,
  formatTimeRange,
  getAqiVisualTheme,
} from '../utils/aqiTheme.js';

interface HourlyWindowChartProps {
  airQuality: AqiAnalysis;
  exposureReductionSummary: string;
}

interface ChartPoint {
  hourLabel: string;
  aqi: number;
  pm2_5: number;
  category: AqiAnalysis['category'];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const pt = payload[0].payload;
  const theme = getAqiVisualTheme(pt.category);

  return (
    <div className="rounded-xl border border-[#E2E8E5] bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md dark:border-white/15 dark:bg-[#0D141C]/95">
      <div className="font-mono-tabular font-semibold text-slate-900 dark:text-white">
        {pt.hourLabel}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className={`font-mono-tabular font-bold ${theme.textAccentClass}`}>
          AQI {pt.aqi}
        </span>
        <span className="text-slate-500 dark:text-slate-400">· {pt.category}</span>
      </div>
      <div className="font-mono-tabular mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
        PM2.5: {pt.pm2_5.toFixed(1)} µg/m³
      </div>
    </div>
  );
}

export function HourlyWindowChart({
  airQuality,
  exposureReductionSummary,
}: HourlyWindowChartProps) {
  const chartData: ChartPoint[] = airQuality.hourly24h.map((pt) => ({
    hourLabel: formatShortTime(pt.time),
    aqi: pt.aqi,
    pm2_5: pt.pm2_5,
    category: pt.category,
  }));

  const cleanRange = formatTimeRange(
    airQuality.cleanest2hWindow.startTime,
    airQuality.cleanest2hWindow.endTime,
  );
  const worstRange = formatTimeRange(
    airQuality.worst2hWindow.startTime,
    airQuality.worst2hWindow.endTime,
  );

  return (
    <article className="animate-card-reveal flex flex-col justify-between rounded-2xl border border-[#E2E8E5] bg-white/95 p-5 shadow-xs backdrop-blur-md transition-all dark:border-white/8 dark:bg-[#101720]/80">
      <div>
        {/* Header + Cleanest / Peak Callout Pills */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                24-Hour Clean-Air Windows
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Hourly CPCB AQI trajectory from Open-Meteo forecast
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Cleanest 2h:{' '}
              <span className="font-mono-tabular">
                {cleanRange} (AQI {airQuality.cleanest2hWindow.avgAqi})
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-800 dark:text-orange-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Peak 2h:{' '}
              <span className="font-mono-tabular">
                {worstRange} (AQI {airQuality.worst2hWindow.avgAqi})
              </span>
            </span>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="mt-4 h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-slate-200 dark:text-white/8"
              />
              <XAxis
                dataKey="hourLabel"
                tick={{ fontSize: 11, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                interval={3}
                className="text-slate-500 dark:text-slate-400"
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                className="text-slate-500 dark:text-slate-400"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />
              <Bar dataKey="aqi" radius={[4, 4, 0, 0]} maxBarSize={20}>
                {chartData.map((entry, idx) => (
                  <Cell
                    key={`${entry.hourLabel}-${idx}`}
                    fill={getAqiVisualTheme(entry.category).barHex}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Safe Ventilation Windows + Exposure Reduction Callout */}
      <div className="mt-4 space-y-2.5 border-t border-[#E2E8E5] pt-3.5 dark:border-white/8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Wind className="h-3.5 w-3.5 text-teal-500" aria-hidden="true" />
            Safe Ventilation (AQI ≤ 100):
          </span>
          {airQuality.safeVentilationWindows.length > 0 ? (
            airQuality.safeVentilationWindows.slice(0, 3).map((win) => (
              <span
                key={`${win.startTime}-${win.endTime}`}
                className="font-mono-tabular rounded-md border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-800 dark:text-teal-300"
              >
                {formatTimeRange(win.startTime, win.endTime)} (AQI {win.avgAqi})
              </span>
            ))
          ) : (
            <span className="rounded-md border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-300">
              None in next 24h — keep windows closed
            </span>
          )}
        </div>

        <p className="rounded-xl bg-slate-100/80 px-3 py-2 text-xs leading-relaxed text-slate-700 dark:bg-white/5 dark:text-slate-300">
          {exposureReductionSummary}
        </p>
      </div>
    </article>
  );
}
