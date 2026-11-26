import type { AqiCategory } from '../../lib/types.js';

export interface AqiVisualTheme {
  strokeHex: string;
  barHex: string;
  badgeClasses: string;
  glowGradient: string;
  textAccentClass: string;
}

const AQI_THEME_MAP: Record<AqiCategory, AqiVisualTheme> = {
  Good: {
    strokeHex: '#10b981',
    barHex: '#10b981',
    badgeClasses:
      'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300 dark:border-emerald-400/30',
    glowGradient: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.16), transparent 70%)',
    textAccentClass: 'text-emerald-600 dark:text-emerald-400',
  },
  Satisfactory: {
    strokeHex: '#14b8a6',
    barHex: '#14b8a6',
    badgeClasses:
      'bg-teal-500/15 text-teal-700 border-teal-500/30 dark:text-teal-300 dark:border-teal-400/30',
    glowGradient: 'radial-gradient(ellipse at 50% 0%, rgba(20, 184, 166, 0.16), transparent 70%)',
    textAccentClass: 'text-teal-600 dark:text-teal-400',
  },
  Moderate: {
    strokeHex: '#f59e0b',
    barHex: '#f59e0b',
    badgeClasses:
      'bg-amber-500/15 text-amber-800 border-amber-500/35 dark:text-amber-300 dark:border-amber-400/30',
    glowGradient: 'radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.16), transparent 70%)',
    textAccentClass: 'text-amber-600 dark:text-amber-400',
  },
  Poor: {
    strokeHex: '#f97316',
    barHex: '#f97316',
    badgeClasses:
      'bg-orange-500/15 text-orange-800 border-orange-500/35 dark:text-orange-300 dark:border-orange-400/30',
    glowGradient: 'radial-gradient(ellipse at 50% 0%, rgba(249, 115, 22, 0.17), transparent 70%)',
    textAccentClass: 'text-orange-600 dark:text-orange-400',
  },
  'Very Poor': {
    strokeHex: '#f43f5e',
    barHex: '#f43f5e',
    badgeClasses:
      'bg-rose-500/15 text-rose-800 border-rose-500/35 dark:text-rose-300 dark:border-rose-400/30',
    glowGradient: 'radial-gradient(ellipse at 50% 0%, rgba(244, 63, 94, 0.18), transparent 70%)',
    textAccentClass: 'text-rose-600 dark:text-rose-400',
  },
  Severe: {
    strokeHex: '#dc2626',
    barHex: '#dc2626',
    badgeClasses:
      'bg-red-600/20 text-red-800 border-red-600/40 dark:text-red-300 dark:border-red-500/40',
    glowGradient: 'radial-gradient(ellipse at 50% 0%, rgba(220, 38, 38, 0.2), transparent 70%)',
    textAccentClass: 'text-red-600 dark:text-red-400',
  },
};

export function getAqiVisualTheme(category: AqiCategory): AqiVisualTheme {
  return AQI_THEME_MAP[category];
}

export function formatShortTime(isoTime: string): string {
  return isoTime.length >= 16 ? isoTime.slice(11, 16) : isoTime;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatShortTime(startTime)}–${formatShortTime(endTime)}`;
}
