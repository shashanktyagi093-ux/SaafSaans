import { Moon, Sparkles, Sun, Wind, ShieldCheck } from 'lucide-react';
import type { CitySearchResult } from '../../lib/types.js';
import { CitySearchBar } from './CitySearchBar.js';

interface HeaderBarProps {
  selectedCity: CitySearchResult | null;
  onSelectCity: (city: CitySearchResult) => void;
  source: 'gemini' | 'fallback' | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function HeaderBar({
  selectedCity,
  onSelectCity,
  source,
  theme,
  onToggleTheme,
}: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E2E8E5] bg-[#F6F8F7]/85 backdrop-blur-md transition-colors dark:border-white/8 dark:bg-[#090D12]/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Left: Brand + Live Advisor Source Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Wind className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-slate-900 dark:text-white">
                SaafSaans
              </span>
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Clean-Air &amp; Low-Emission Assistant
              </span>
            </div>
          </div>

          {source !== null ? (
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${
                source === 'gemini'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
              }`}
            >
              {source === 'gemini' ? (
                <>
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Gemini Advisor
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  Deterministic Fallback
                </>
              )}
            </span>
          ) : null}
        </div>

        {/* Center: City Search */}
        <div className="order-3 w-full md:order-2 md:w-auto md:flex-1 md:max-w-md">
          <CitySearchBar selectedCity={selectedCity} onSelectCity={onSelectCity} />
        </div>

        {/* Right: Dark / Daylight Mode Toggle */}
        <div className="order-2 flex items-center gap-2 md:order-3">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Daylight mode' : 'Switch to Dark mode'}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8E5] bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-[#101720] dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-[#151E29]"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span className="hidden sm:inline">Daylight</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-slate-700" aria-hidden="true" />
                <span className="hidden sm:inline">Obsidian</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
