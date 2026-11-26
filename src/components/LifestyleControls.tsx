import {
  Bike,
  Building2,
  Bus,
  Car,
  Footprints,
  Home,
  Loader2,
  Moon,
  Sparkles,
  Sun,
  Wind,
  DoorClosed,
  Ban,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { LifestyleProfile } from '../../lib/types.js';

interface LifestyleControlsProps {
  lifestyle: LifestyleProfile;
  onChange: (next: LifestyleProfile) => void;
  onGenerate: () => void;
  isLoading: boolean;
  hasCitySelected: boolean;
}

interface PillOption<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
}

const COMMUTE_OPTIONS: PillOption<LifestyleProfile['commuteMode']>[] = [
  { value: 'car', label: 'Car', icon: <Car className="h-3.5 w-3.5" aria-hidden="true" /> },
  {
    value: 'two-wheeler',
    label: 'Two-Wheeler',
    icon: <Bike className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    value: 'public-transit',
    label: 'Transit',
    icon: <Bus className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    value: 'walk-cycle',
    label: 'Walk / Cycle',
    icon: <Footprints className="h-3.5 w-3.5" aria-hidden="true" />,
  },
];

const HOME_OPTIONS: PillOption<LifestyleProfile['homeType']>[] = [
  {
    value: 'apartment',
    label: 'Apartment',
    icon: <Building2 className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    value: 'independent-house',
    label: 'House',
    icon: <Home className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    value: 'hostel-room',
    label: 'Hostel Room',
    icon: <DoorClosed className="h-3.5 w-3.5" aria-hidden="true" />,
  },
];

const OUTDOOR_OPTIONS: PillOption<LifestyleProfile['outdoorActivity']>[] = [
  {
    value: 'morning-run',
    label: 'Morning Run',
    icon: <Sun className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    value: 'evening-walk',
    label: 'Evening Walk',
    icon: <Moon className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    value: 'none',
    label: 'None',
    icon: <Ban className="h-3.5 w-3.5" aria-hidden="true" />,
  },
];

function SegmentedGroup<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: PillOption<T>[];
  value: T;
  onSelect: (val: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        className="inline-flex flex-wrap gap-1 rounded-xl border border-[#E2E8E5] bg-slate-100/80 p-1 dark:border-white/8 dark:bg-[#0B1017]"
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(opt.value)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                active
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-emerald-500/30 dark:bg-[#17222F] dark:text-emerald-300 dark:ring-emerald-400/30'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LifestyleControls({
  lifestyle,
  onChange,
  onGenerate,
  isLoading,
  hasCitySelected,
}: LifestyleControlsProps) {
  return (
    <section
      aria-label="Lifestyle profile controls"
      className="rounded-2xl border border-[#E2E8E5] bg-white/90 p-4 shadow-xs backdrop-blur-md transition-colors dark:border-white/8 dark:bg-[#101720]/80"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-4">
          <SegmentedGroup
            label="Commute"
            options={COMMUTE_OPTIONS}
            value={lifestyle.commuteMode}
            onSelect={(commuteMode) => onChange({ ...lifestyle, commuteMode })}
          />

          <SegmentedGroup
            label="Living Space"
            options={HOME_OPTIONS}
            value={lifestyle.homeType}
            onSelect={(homeType) => onChange({ ...lifestyle, homeType })}
          />

          <SegmentedGroup
            label="Outdoor Routine"
            options={OUTDOOR_OPTIONS}
            value={lifestyle.outdoorActivity}
            onSelect={(outdoorActivity) => onChange({ ...lifestyle, outdoorActivity })}
          />

          {/* Air Purifier On/Off Pill Switch */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Air Purifier
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={lifestyle.hasPurifier}
              onClick={() => onChange({ ...lifestyle, hasPurifier: !lifestyle.hasPurifier })}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                lifestyle.hasPurifier
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/35 dark:text-emerald-300'
                  : 'border-[#E2E8E5] bg-slate-100/80 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:bg-[#0B1017] dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Wind className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{lifestyle.hasPurifier ? 'Purifier: On' : 'Purifier: Off'}</span>
            </button>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={onGenerate}
          disabled={!hasCitySelected || isLoading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Analyzing Air &amp; Plan...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Generate Clean-Air Plan</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
