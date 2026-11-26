import { Activity, MapPin } from 'lucide-react';
import type { AqiAnalysis } from '../../lib/types.js';
import { getAqiVisualTheme } from '../utils/aqiTheme.js';

interface AqiGaugeCardProps {
  cityName: string;
  airQuality: AqiAnalysis;
  summary: string;
}

const POLLUTANT_ORDER = ['PM2.5', 'PM10', 'NO2', 'SO2', 'O3', 'CO'] as const;

export function AqiGaugeCard({ cityName, airQuality, summary }: AqiGaugeCardProps) {
  const theme = getAqiVisualTheme(airQuality.category);

  // Semi-circular / 240-degree radial arc math
  const radius = 74;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 240 / 360; // 240-degree sweep
  const totalArcLength = circumference * arcFraction;
  const clampedAqi = Math.max(0, Math.min(500, airQuality.aqi));
  const filledLength = totalArcLength * (clampedAqi / 500);

  return (
    <article className="animate-card-reveal flex flex-col justify-between rounded-2xl border border-[#E2E8E5] bg-white/95 p-5 shadow-xs backdrop-blur-md transition-all dark:border-white/8 dark:bg-[#101720]/80">
      <div>
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className={`h-4 w-4 ${theme.textAccentClass}`} aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{cityName}</h2>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${theme.badgeClasses}`}
          >
            {airQuality.category}
          </span>
        </div>

        {/* Radial SVG Gauge + Dominant Pollutant */}
        <div className="mt-4 flex flex-col items-center">
          <div className="relative flex h-44 w-52 items-center justify-center">
            <svg
              viewBox="0 0 180 165"
              className="h-full w-full overflow-visible"
              role="img"
              aria-label={`CPCB AQI ${airQuality.aqi}, ${airQuality.category}`}
            >
              {/* Background Track */}
              <circle
                cx="90"
                cy="92"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeDasharray={`${totalArcLength} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(150 90 92)"
                className="text-slate-200 dark:text-white/10"
              />
              {/* Animated Value Arc */}
              <circle
                cx="90"
                cy="92"
                r={radius}
                fill="none"
                stroke={theme.strokeHex}
                strokeWidth={strokeWidth}
                strokeDasharray={`${filledLength} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(150 90 92)"
                style={{
                  transition: 'stroke-dasharray 700ms cubic-bezier(0.22, 1, 0.36, 1), stroke 300ms ease',
                }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pt-3">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                CPCB AQI
              </span>
              <span className="font-mono-tabular text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                {airQuality.aqi}
              </span>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-white/8 dark:text-slate-300">
                <Activity className="h-3 w-3" aria-hidden="true" />
                Lead: <strong className="font-mono-tabular">{airQuality.dominantPollutant}</strong>
              </span>
            </div>
          </div>

          {/* 6-Pollutant Sub-Index Mini-Grid */}
          <div className="mt-1 grid w-full grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3">
            {POLLUTANT_ORDER.map((key) => {
              const val = airQuality.subIndices[key];
              const isDominant = key === airQuality.dominantPollutant;
              return (
                <div
                  key={key}
                  className={`rounded-xl border px-2.5 py-2 text-center transition-colors ${
                    isDominant
                      ? 'border-emerald-500/35 bg-emerald-500/8 dark:border-emerald-400/30 dark:bg-emerald-500/10'
                      : 'border-[#E2E8E5] bg-slate-50/70 dark:border-white/6 dark:bg-[#0B1017]/80'
                  }`}
                >
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {key}
                  </div>
                  <div className="font-mono-tabular mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {val !== undefined ? val : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-Sentence Summary */}
      <p className="mt-4 border-t border-[#E2E8E5] pt-3.5 text-sm leading-relaxed text-slate-600 dark:border-white/8 dark:text-slate-300">
        {summary}
      </p>
    </article>
  );
}
