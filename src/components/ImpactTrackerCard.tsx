import { Car, CheckSquare, RotateCcw, Square, TrendingDown } from 'lucide-react';
import type { AdvisorPlan } from '../../lib/advisorSchema.js';

interface ImpactTrackerCardProps {
  swaps: AdvisorPlan['sustainableSwaps'];
  totalPotentialKgCo2PerWeek: number;
  checkedSwapIds: string[];
  onToggleSwap: (swapId: string) => void;
  onResetChecklist: () => void;
}

export function ImpactTrackerCard({
  swaps,
  totalPotentialKgCo2PerWeek,
  checkedSwapIds,
  onToggleSwap,
  onResetChecklist,
}: ImpactTrackerCardProps) {
  const checkedSet = new Set(checkedSwapIds);
  const checkedSwaps = swaps.filter((s) => checkedSet.has(s.id));

  const savedKgCo2 = Number(
    checkedSwaps.reduce((sum, s) => sum + s.kgCo2SavedPerWeek, 0).toFixed(1),
  );
  const carKmAvoided = Number(
    checkedSwaps.reduce((sum, s) => sum + s.carKmEquivalent, 0).toFixed(1),
  );
  const progressPct =
    totalPotentialKgCo2PerWeek > 0
      ? Math.min(100, Math.round((savedKgCo2 / totalPotentialKgCo2PerWeek) * 100))
      : 0;

  return (
    <aside
      aria-label="Weekly CO2 Impact Tracker"
      className="animate-card-reveal lg:sticky lg:top-20 rounded-2xl border border-[#E2E8E5] bg-white/95 p-5 shadow-xs backdrop-blur-md transition-colors dark:border-white/8 dark:bg-[#101720]/85"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4.5 w-4.5 text-emerald-500" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Weekly Impact Pledge
          </h2>
        </div>
        <button
          type="button"
          onClick={onResetChecklist}
          disabled={checkedSwapIds.length === 0}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Reset Checklist
        </button>
      </div>

      {/* Live Totals */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3">
          <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            CO2 Saved / Wk
          </div>
          <div className="font-mono-tabular mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {savedKgCo2.toFixed(1)}
            <span className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              kg
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8E5] bg-slate-50/80 p-3 dark:border-white/8 dark:bg-[#0B1017]">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <Car className="h-3 w-3 text-teal-500" aria-hidden="true" />
            Car Travel Avoided
          </div>
          <div className="font-mono-tabular mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {carKmAvoided.toFixed(1)}
            <span className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              km
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">
            Weekly Goal Progress
          </span>
          <span className="font-mono-tabular font-semibold text-emerald-700 dark:text-emerald-400">
            {savedKgCo2.toFixed(1)} / {totalPotentialKgCo2PerWeek.toFixed(1)} kg ({progressPct}%)
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Interactive Checklist */}
      <div className="mt-4 space-y-2 border-t border-[#E2E8E5] pt-4 dark:border-white/8">
        {swaps.map((swap) => {
          const checked = checkedSet.has(swap.id);
          return (
            <button
              key={swap.id}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => onToggleSwap(swap.id)}
              className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                checked
                  ? 'border-emerald-500/35 bg-emerald-500/10 text-slate-900 dark:border-emerald-400/30 dark:text-white'
                  : 'border-[#E2E8E5] bg-slate-50/60 text-slate-700 hover:bg-slate-100/80 dark:border-white/6 dark:bg-[#0B1017]/80 dark:text-slate-300 dark:hover:bg-white/5'
              }`}
            >
              {checked ? (
                <CheckSquare
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
              ) : (
                <Square
                  className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold leading-snug">{swap.ecoSwap}</div>
                <div className="font-mono-tabular mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                  +{swap.kgCo2SavedPerWeek} kg CO2/wk
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
