import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdvisorPlanSchema, AnalyzeRequestSchema } from '../advisorSchema.js';
import { buildDeterministicFallbackPlan, generateAirQualityAdvice } from '../geminiAdvisor.js';
import { computeLifestyleImpact } from '../sustainability.js';
import type { AqiAnalysis, LifestyleProfile } from '../types.js';

function makeAnalysis(aqi: number, category: AqiAnalysis['category']): AqiAnalysis {
  const isGood = aqi <= 100;
  return {
    aqi,
    category,
    dominantPollutant: 'PM2.5',
    subIndices: { 'PM2.5': aqi, PM10: Math.max(10, aqi - 20) },
    cleanest2hWindow: {
      startTime: '2026-11-26T05:00',
      endTime: '2026-11-26T07:00',
      avgAqi: isGood ? 32 : 210,
      avgPm25: isGood ? 19 : 93,
    },
    worst2hWindow: {
      startTime: '2026-11-26T19:00',
      endTime: '2026-11-26T21:00',
      avgAqi: isGood ? 48 : aqi,
      avgPm25: isGood ? 28 : 195,
    },
    safeVentilationWindows: isGood
      ? [
          {
            startTime: '2026-11-26T05:00',
            endTime: '2026-11-26T07:00',
            avgAqi: 32,
            avgPm25: 19,
          },
        ]
      : [],
    hourly24h: [
      {
        time: '2026-11-26T05:00',
        aqi: isGood ? 32 : 210,
        pm2_5: isGood ? 19 : 93,
        category: isGood ? 'Good' : 'Poor',
      },
    ],
  };
}

const sampleLifestyle: LifestyleProfile = {
  commuteMode: 'car',
  homeType: 'apartment',
  outdoorActivity: 'morning-run',
  hasPurifier: true,
};

describe('AnalyzeRequestSchema', () => {
  it('accepts a valid request payload', () => {
    const result = AnalyzeRequestSchema.safeParse({
      cityName: '  Metro City  ',
      lat: 28.6,
      lon: 77.2,
      lifestyle: sampleLifestyle,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cityName).toBe('Metro City');
    }
  });

  it('rejects out-of-range coordinates and invalid lifestyle enums', () => {
    const badLat = AnalyzeRequestSchema.safeParse({
      cityName: 'Metro City',
      lat: 95,
      lon: 10,
      lifestyle: sampleLifestyle,
    });
    expect(badLat.success).toBe(false);

    const badEnum = AnalyzeRequestSchema.safeParse({
      cityName: 'Metro City',
      lat: 12.3,
      lon: 45.6,
      lifestyle: {
        ...sampleLifestyle,
        commuteMode: 'helicopter',
      },
    });
    expect(badEnum.success).toBe(false);
  });
});

describe('buildDeterministicFallbackPlan', () => {
  it('passes AdvisorPlanSchema and preserves exact CO2 values for Good AQI', () => {
    const analysis = makeAnalysis(35, 'Good');
    const impact = computeLifestyleImpact(sampleLifestyle, analysis);
    const plan = buildDeterministicFallbackPlan('Metro City', analysis, sampleLifestyle, impact);

    const parsed = AdvisorPlanSchema.safeParse(plan);
    expect(parsed.success).toBe(true);
    expect(plan.sustainableSwaps.map((s) => s.kgCo2SavedPerWeek)).toEqual(
      impact.swaps.map((s) => s.kgCo2SavedPerWeek),
    );
    expect(plan.summary).toContain('35');
    expect(plan.summary).toContain('Good');
  });

  it('passes AdvisorPlanSchema and preserves exact CO2 values for Very Poor AQI', () => {
    const analysis = makeAnalysis(345, 'Very Poor');
    const impact = computeLifestyleImpact(
      { ...sampleLifestyle, hasPurifier: false },
      analysis,
    );
    const plan = buildDeterministicFallbackPlan(
      'Harbor Town',
      analysis,
      { ...sampleLifestyle, hasPurifier: false },
      impact,
    );

    const parsed = AdvisorPlanSchema.safeParse(plan);
    expect(parsed.success).toBe(true);
    expect(plan.sustainableSwaps.map((s) => s.kgCo2SavedPerWeek)).toEqual(
      impact.swaps.map((s) => s.kgCo2SavedPerWeek),
    );
    expect(plan.summary).toContain('345');
    expect(plan.summary).toContain('Very Poor');
  });
});

describe('generateAirQualityAdvice', () => {
  const originalKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
    vi.restoreAllMocks();
  });

  it('falls back cleanly when GEMINI_API_KEY is unset without making network calls', async () => {
    delete process.env.GEMINI_API_KEY;
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const analysis = makeAnalysis(140, 'Moderate');
    const impact = computeLifestyleImpact(sampleLifestyle, analysis);

    const result = await generateAirQualityAdvice(
      'Metro City',
      analysis,
      sampleLifestyle,
      impact,
    );

    expect(result.source).toBe('fallback');
    expect(AdvisorPlanSchema.safeParse(result.advisor).success).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
