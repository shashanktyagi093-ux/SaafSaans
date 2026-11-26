import { useCallback, useEffect, useState } from 'react';
import type { AnalyzeResponse } from '../lib/advisorSchema.js';
import type { CitySearchResult, LifestyleProfile } from '../lib/types.js';
import { AdvisorSections } from './components/AdvisorSections.js';
import { AqiGaugeCard } from './components/AqiGaugeCard.js';
import {
  EmptyLandingState,
  ErrorBannerState,
  LoadingSkeletonState,
} from './components/DashboardStates.js';
import { HeaderBar } from './components/HeaderBar.js';
import { HourlyWindowChart } from './components/HourlyWindowChart.js';
import { ImpactTrackerCard } from './components/ImpactTrackerCard.js';
import { LifestyleControls } from './components/LifestyleControls.js';
import { getAqiVisualTheme } from './utils/aqiTheme.js';

const THEME_STORAGE_KEY = 'saafsaans_theme';
const DEFAULT_DISCLAIMER =
  'Modelled Open-Meteo Estimate & CPCB AQI Formula — Informational Only, Not Medical Advice.';

const DEFAULT_LIFESTYLE: LifestyleProfile = {
  commuteMode: 'car',
  homeType: 'apartment',
  outdoorActivity: 'morning-run',
  hasPurifier: false,
};

function getCityPledgeKey(city: CitySearchResult): string {
  return `saafsaans_pledges_${city.name.toLowerCase()}_${city.latitude.toFixed(2)}_${city.longitude.toFixed(2)}`;
}

function readStoredPledges(city: CitySearchResult | null): string[] {
  if (!city) return [];
  try {
    const raw = localStorage.getItem(getCityPledgeKey(city));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [selectedCity, setSelectedCity] = useState<CitySearchResult | null>(null);
  const [lifestyle, setLifestyle] = useState<LifestyleProfile>(DEFAULT_LIFESTYLE);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedSwapIds, setCheckedSwapIds] = useState<string[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage quota errors
    }
  }, [theme]);

  useEffect(() => {
    setCheckedSwapIds(readStoredPledges(selectedCity));
  }, [selectedCity]);

  const runAnalysis = useCallback(
    async (city: CitySearchResult, profile: LifestyleProfile) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cityName: city.name,
            lat: city.latitude,
            lon: city.longitude,
            lifestyle: profile,
          }),
        });

        const data = (await res.json()) as AnalyzeResponse | { error?: string };
        if (!res.ok) {
          const errMsg =
            'error' in data && typeof data.error === 'string'
              ? data.error
              : `Request failed with status ${res.status}`;
          throw new Error(errMsg);
        }

        setAnalysis(data as AnalyzeResponse);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to fetch air-quality analysis. Please try again.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const handleSelectCity = (city: CitySearchResult) => {
    setSelectedCity(city);
    void runAnalysis(city, lifestyle);
  };

  const handleGenerate = () => {
    if (!selectedCity) return;
    void runAnalysis(selectedCity, lifestyle);
  };

  const handleToggleSwap = (swapId: string) => {
    setCheckedSwapIds((prev) => {
      const next = prev.includes(swapId)
        ? prev.filter((id) => id !== swapId)
        : [...prev, swapId];
      if (selectedCity) {
        try {
          localStorage.setItem(getCityPledgeKey(selectedCity), JSON.stringify(next));
        } catch {
          // Ignore storage quota errors
        }
      }
      return next;
    });
  };

  const handleResetChecklist = () => {
    setCheckedSwapIds([]);
    if (selectedCity) {
      try {
        localStorage.removeItem(getCityPledgeKey(selectedCity));
      } catch {
        // Ignore storage quota errors
      }
    }
  };

  const ambientGlow = analysis
    ? getAqiVisualTheme(analysis.airQuality.category).glowGradient
    : 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.10), transparent 70%)';

  return (
    <div className="bento-canvas-bg relative min-h-screen flex flex-col">
      {/* Dynamic AQI Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-14 h-96 transition-all duration-700"
        style={{ background: ambientGlow }}
      />

      <HeaderBar
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
        source={analysis?.meta.source ?? null}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      />

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        <LifestyleControls
          lifestyle={lifestyle}
          onChange={setLifestyle}
          onGenerate={handleGenerate}
          isLoading={isLoading}
          hasCitySelected={selectedCity !== null}
        />

        {error ? (
          <ErrorBannerState message={error} onRetry={handleGenerate} />
        ) : null}

        {isLoading ? (
          <LoadingSkeletonState />
        ) : analysis ? (
          <>
            {/* Hero Asymmetric Bento Row */}
            <section
              aria-label="Current Air Quality & 24-Hour Forecast"
              className="grid grid-cols-1 gap-5 lg:grid-cols-12"
            >
              <div className="lg:col-span-5">
                <AqiGaugeCard
                  cityName={analysis.meta.cityName}
                  airQuality={analysis.airQuality}
                  summary={analysis.advisor.summary}
                />
              </div>
              <div className="lg:col-span-7">
                <HourlyWindowChart
                  airQuality={analysis.airQuality}
                  exposureReductionSummary={analysis.impactSummary.exposureReductionSummary}
                />
              </div>
            </section>

            {/* Action Bento Grid + Sticky Weekly Impact Sidebar */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-8">
                <AdvisorSections
                  advisor={analysis.advisor}
                  checkedSwapIds={checkedSwapIds}
                  onToggleSwap={handleToggleSwap}
                />
              </div>
              <div className="lg:col-span-4">
                <ImpactTrackerCard
                  swaps={analysis.advisor.sustainableSwaps}
                  totalPotentialKgCo2PerWeek={analysis.impactSummary.totalPotentialKgCo2PerWeek}
                  checkedSwapIds={checkedSwapIds}
                  onToggleSwap={handleToggleSwap}
                  onResetChecklist={handleResetChecklist}
                />
              </div>
            </div>
          </>
        ) : !error ? (
          <EmptyLandingState />
        ) : null}
      </main>

      <footer className="relative z-10 border-t border-[#E2E8E5] bg-white/60 py-4 text-center backdrop-blur-sm dark:border-white/8 dark:bg-[#090D12]/60">
        <div className="mx-auto max-w-7xl px-4 text-xs text-slate-500 dark:text-slate-400">
          {analysis?.meta.disclaimer ?? DEFAULT_DISCLAIMER}
        </div>
      </footer>
    </div>
  );
}

export default App;
