import { z } from 'zod';
import type { AqiAnalysis } from './types.js';

export const LifestyleProfileSchema = z.object({
  commuteMode: z.enum(['car', 'two-wheeler', 'public-transit', 'walk-cycle']),
  homeType: z.enum(['apartment', 'independent-house', 'hostel-room']),
  outdoorActivity: z.enum(['morning-run', 'evening-walk', 'none']),
  hasPurifier: z.boolean(),
});

export const AnalyzeRequestSchema = z.object({
  cityName: z
    .string()
    .trim()
    .min(1, 'City name is required')
    .max(100, 'City name must be 100 characters or fewer'),
  lat: z.number().finite().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90'),
  lon: z
    .number()
    .finite()
    .min(-180, 'Longitude must be >= -180')
    .max(180, 'Longitude must be <= 180'),
  lifestyle: LifestyleProfileSchema,
});

export const DailyRoutineItemSchema = z.object({
  timeWindow: z.string().trim().min(1),
  title: z.string().trim().min(1),
  action: z.string().trim().min(1),
  impactExplanation: z.string().trim().min(1),
});

export const IndoorAirHackSchema = z.object({
  title: z.string().trim().min(1),
  action: z.string().trim().min(1),
  whyNow: z.string().trim().min(1),
});

export const SustainableSwapAdviceSchema = z.object({
  id: z.string().trim().min(1),
  currentHabit: z.string().trim().min(1),
  ecoSwap: z.string().trim().min(1),
  kgCo2SavedPerWeek: z.number().nonnegative(),
  carKmEquivalent: z.number().nonnegative(),
  impactExplanation: z.string().trim().min(1),
});

export const AdvisorPlanSchema = z.object({
  summary: z.string().trim().min(1),
  dailyRoutine: z.array(DailyRoutineItemSchema).min(3).max(4),
  indoorAirHacks: z.array(IndoorAirHackSchema).min(3).max(4),
  sustainableSwaps: z.array(SustainableSwapAdviceSchema).min(1),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type AdvisorPlan = z.infer<typeof AdvisorPlanSchema>;

export interface AnalyzeResponse {
  meta: {
    cityName: string;
    lat: number;
    lon: number;
    generatedAt: string;
    source: 'gemini' | 'fallback';
    disclaimer: string;
  };
  airQuality: AqiAnalysis;
  impactSummary: {
    totalPotentialKgCo2PerWeek: number;
    exposureReductionSummary: string;
  };
  advisor: AdvisorPlan;
}
