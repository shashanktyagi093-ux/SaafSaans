import { ArrowRight, Check, Clock, Home, Leaf, Plus, ShieldAlert } from 'lucide-react';
import type { AdvisorPlan } from '../../lib/advisorSchema.js';

interface AdvisorSectionsProps {
  advisor: AdvisorPlan;
  checkedSwapIds: string[];
  onToggleSwap: (swapId: string) => void;
}

export function AdvisorSections({
  advisor,
  checkedSwapIds,
  onToggleSwap,
}: AdvisorSectionsProps) {
  const checkedSet = new Set(checkedSwapIds);

  return (
    <div className="space-y-6">
      {/* 1. Low-Emission Daily Routine */}
      <section aria-labelledby="heading-routine" className="animate-card-reveal">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-emerald-500" aria-hidden="true" />
          <h2
            id="heading-routine"
            className="text-base font-bold tracking-tight text-slate-900 dark:text-white"
          >
            Low-Emission Daily Routine
          </h2>
        </div>

        <div className="relative space-y-3 pl-4 before:absolute before:top-3 before:bottom-3 before:left-1.5 before:w-px before:bg-slate-200 dark:before:bg-white/10">
          {advisor.dailyRoutine.map((item, idx) => (
            <article
              key={`${item.timeWindow}-${idx}`}
              className="relative rounded-2xl border border-[#E2E8E5] bg-white/95 p-4 shadow-xs backdrop-blur-md transition-all hover:border-emerald-500/30 dark:border-white/8 dark:bg-[#101720]/80 dark:hover:border-emerald-400/25"
            >
              <span
                className="absolute top-5 -left-[15px] h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-[#090D12]"
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <span className="font-mono-tabular rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  {item.timeWindow}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {item.action}
              </p>
              <div className="mt-3 rounded-xl bg-slate-100/80 px-3 py-2 text-xs text-slate-700 dark:bg-white/5 dark:text-slate-300">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Impact:{' '}
                </span>
                {item.impactExplanation}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 2. Indoor Air Quality Hacks */}
      <section aria-labelledby="heading-indoor" className="animate-card-reveal">
        <div className="mb-3 flex items-center gap-2">
          <Home className="h-4.5 w-4.5 text-teal-500" aria-hidden="true" />
          <h2
            id="heading-indoor"
            className="text-base font-bold tracking-tight text-slate-900 dark:text-white"
          >
            Indoor Air Quality Hacks
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {advisor.indoorAirHacks.map((hack, idx) => (
            <article
              key={`${hack.title}-${idx}`}
              className="flex flex-col justify-between rounded-2xl border border-[#E2E8E5] bg-white/95 p-4 shadow-xs backdrop-blur-md transition-all hover:border-teal-500/30 dark:border-white/8 dark:bg-[#101720]/80 dark:hover:border-teal-400/25"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{hack.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {hack.action}
                </p>
              </div>
              <div className="mt-3 flex items-start gap-1.5 rounded-xl border border-teal-500/20 bg-teal-500/8 px-2.5 py-2 text-xs text-teal-900 dark:text-teal-200">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">Why Now: </strong>
                  {hack.whyNow}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. Sustainable Swaps */}
      <section aria-labelledby="heading-swaps" className="animate-card-reveal">
        <div className="mb-3 flex items-center gap-2">
          <Leaf className="h-4.5 w-4.5 text-emerald-500" aria-hidden="true" />
          <h2
            id="heading-swaps"
            className="text-base font-bold tracking-tight text-slate-900 dark:text-white"
          >
            Sustainable Swaps
          </h2>
        </div>

        <div className="space-y-3">
          {advisor.sustainableSwaps.map((swap) => {
            const isPledged = checkedSet.has(swap.id);
            return (
              <article
                key={swap.id}
                className={`rounded-2xl border p-4 shadow-xs backdrop-blur-md transition-all ${
                  isPledged
                    ? 'border-emerald-500/45 bg-emerald-500/6 dark:border-emerald-400/35 dark:bg-emerald-500/8'
                    : 'border-[#E2E8E5] bg-white/95 dark:border-white/8 dark:bg-[#101720]/80'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 line-through decoration-slate-400 dark:bg-white/8 dark:text-slate-400">
                      {swap.currentHabit}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {swap.ecoSwap}
                    </span>
                  </div>

                  <button
                    type="button"
                    aria-pressed={isPledged}
                    onClick={() => onToggleSwap(swap.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                      isPledged
                        ? 'border-emerald-500 bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                        : 'border-[#E2E8E5] bg-white text-slate-700 hover:border-emerald-500/40 hover:text-emerald-700 dark:border-white/15 dark:bg-[#151E29] dark:text-slate-200 dark:hover:border-emerald-400/40 dark:hover:text-emerald-300'
                    }`}
                  >
                    {isPledged ? (
                      <>
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Pledged</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Add to Weekly Pledge</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono-tabular rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    -{swap.kgCo2SavedPerWeek} kg CO2/wk
                  </span>
                  <span className="font-mono-tabular rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-300">
                    {swap.carKmEquivalent} km car avoided
                  </span>
                </div>

                <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {swap.impactExplanation}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
