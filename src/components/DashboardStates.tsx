import { AlertCircle, Clock, Leaf, RefreshCw, Search, ShieldCheck, Wind } from 'lucide-react';

export function EmptyLandingState() {
  return (
    <section className="animate-card-reveal rounded-2xl border border-[#E2E8E5] bg-white/95 p-8 text-center shadow-xs backdrop-blur-md dark:border-white/8 dark:bg-[#101720]/80 sm:p-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <Wind className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        Breathe Smarter. Cut Weekly Emissions.
      </h1>
      <p className="mx-auto mt-2.5 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        Search any city above and dial in your commute, home, and outdoor routine. SaafSaans
        computes official Indian CPCB AQI, 24-hour clean-air windows, and realistic CO2 swaps.
      </p>

      <div className="mx-auto mt-7 grid max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
        <div className="rounded-xl border border-[#E2E8E5] bg-slate-50/80 p-4 dark:border-white/8 dark:bg-[#0B1017]">
          <Clock className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          <h2 className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
            CPCB AQI &amp; 24h Windows
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Pinpoints your cleanest and dirtiest 2-hour windows from live Open-Meteo telemetry.
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8E5] bg-slate-50/80 p-4 dark:border-white/8 dark:bg-[#0B1017]">
          <ShieldCheck className="h-4 w-4 text-teal-500" aria-hidden="true" />
          <h2 className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
            Indoor Air Hacks
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Safe cross-ventilation timing and home air-care tailored to your living space.
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8E5] bg-slate-50/80 p-4 dark:border-white/8 dark:bg-[#0B1017]">
          <Leaf className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          <h2 className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
            Quantified CO2 Swaps
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Interactive weekly pledge tracker showing kg CO2 saved and car-km avoided.
          </p>
        </div>
      </div>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Start by searching any city in the top bar</span>
      </div>
    </section>
  );
}

export function LoadingSkeletonState() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading air quality analysis">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="h-96 animate-pulse rounded-2xl border border-[#E2E8E5] bg-white/70 dark:border-white/8 dark:bg-[#101720]/70 lg:col-span-5" />
        <div className="h-96 animate-pulse rounded-2xl border border-[#E2E8E5] bg-white/70 dark:border-white/8 dark:bg-[#101720]/70 lg:col-span-7" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-8">
          <div className="h-28 animate-pulse rounded-2xl border border-[#E2E8E5] bg-white/70 dark:border-white/8 dark:bg-[#101720]/70" />
          <div className="h-28 animate-pulse rounded-2xl border border-[#E2E8E5] bg-white/70 dark:border-white/8 dark:bg-[#101720]/70" />
        </div>
        <div className="h-72 animate-pulse rounded-2xl border border-[#E2E8E5] bg-white/70 dark:border-white/8 dark:bg-[#101720]/70 lg:col-span-4" />
      </div>
    </div>
  );
}

export function ErrorBannerState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="animate-card-reveal flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-500/35 bg-rose-500/10 p-5 text-rose-900 dark:text-rose-200"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-bold">Unable to Complete Analysis</h2>
          <p className="mt-0.5 text-xs opacity-90">{message}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-white px-3.5 py-2 text-xs font-semibold text-rose-800 shadow-xs transition-colors hover:bg-rose-50 dark:bg-[#101720] dark:text-rose-200 dark:hover:bg-[#151E29]"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Retry Analysis</span>
      </button>
    </div>
  );
}
