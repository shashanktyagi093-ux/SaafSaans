import { GoogleGenAI, Type } from '@google/genai';
import { AdvisorPlanSchema, type AdvisorPlan } from './advisorSchema.js';
import type { LifestyleImpactResult } from './sustainability.js';
import type { AqiAnalysis, DeterministicSwap, LifestyleProfile } from './types.js';

const GEMINI_TIMEOUT_MS = 15_000;

const SYSTEM_INSTRUCTION =
  'You are SaafSaans, a practical Urban Air Quality & Sustainability Assistant. ' +
  'Reference ONLY the verified CPCB AQI, dominant pollutant, time windows, and deterministic CO2 numbers supplied in the JSON input. ' +
  'Never invent pollutant readings, change id/kgCo2SavedPerWeek/carKmEquivalent values, or give medical diagnoses. ' +
  "Write crisp, concrete, everyday advice tailored to the user's commute, home type, outdoor routine, and purifier status.";

function formatClock(isoTime: string): string {
  return isoTime.length >= 16 ? isoTime.slice(11, 16) : isoTime;
}

function formatWindow(startTime: string, endTime: string): string {
  return `${formatClock(startTime)}–${formatClock(endTime)}`;
}

function describeCommuteHabit(mode: LifestyleProfile['commuteMode']): string {
  switch (mode) {
    case 'car':
      return 'Daily solo car commute';
    case 'two-wheeler':
      return 'Two-wheeler trips for short local errands';
    case 'public-transit':
      return 'Short feeder rides to and from transit stops';
    case 'walk-cycle':
      return 'Occasional weekend ride-hail trips';
  }
}

function describeCurrentHabit(swap: DeterministicSwap, lifestyle: LifestyleProfile): string {
  switch (swap.category) {
    case 'commute':
      return describeCommuteHabit(lifestyle.commuteMode);
    case 'energy':
      return `Baseline ${lifestyle.homeType.replace('-', ' ')} appliance and cooling schedule`;
    case 'indoor':
      return lifestyle.hasPurifier
        ? 'Running air purifier continuously at high fan speed'
        : 'Leaving indoor dust and cooking fumes unfiltered';
    case 'routine':
      return lifestyle.outdoorActivity === 'none'
        ? 'Frequent separate last-mile household deliveries'
        : 'Unscheduled outdoor workout and single-use hydration';
  }
}

/**
 * Builds a complete, deterministic AdvisorPlan using only verified CPCB metrics,
 * time windows, and deterministic CO2 swap calculations.
 */
export function buildDeterministicFallbackPlan(
  cityName: string,
  analysis: AqiAnalysis,
  lifestyle: LifestyleProfile,
  impact: LifestyleImpactResult,
): AdvisorPlan {
  const cleanWin = formatWindow(
    analysis.cleanest2hWindow.startTime,
    analysis.cleanest2hWindow.endTime,
  );
  const worstWin = formatWindow(
    analysis.worst2hWindow.startTime,
    analysis.worst2hWindow.endTime,
  );
  const firstSafeVent = analysis.safeVentilationWindows[0];
  const isHighAqi = analysis.aqi > 200;
  const isModerateOrWorse = analysis.aqi > 100;

  const summary =
    `${cityName} is currently at CPCB AQI ${analysis.aqi} (${analysis.category}), driven primarily by ${analysis.dominantPollutant}. ` +
    (isHighAqi
      ? `Keep strenuous outdoor activity indoors today and reserve essential errands for the cleanest window (${cleanWin}, avg AQI ${analysis.cleanest2hWindow.avgAqi}).`
      : `Plan outdoor routines around the cleanest 2-hour window (${cleanWin}, avg AQI ${analysis.cleanest2hWindow.avgAqi}) and avoid peak buildup around ${worstWin}.`);

  const outdoorLabel =
    lifestyle.outdoorActivity === 'morning-run'
      ? 'Morning Run'
      : lifestyle.outdoorActivity === 'evening-walk'
        ? 'Evening Walk'
        : 'Outdoor Errands';

  const commuteAction =
    lifestyle.commuteMode === 'car'
      ? 'Keep cabin air on recirculate mode during traffic and combine errands into one trip.'
      : lifestyle.commuteMode === 'two-wheeler'
        ? isModerateOrWorse
          ? 'Wear a well-fitted N95 mask on main roads and prefer side streets away from heavy diesel traffic.'
          : 'Ride at steady speeds and avoid idling at long intersections.'
        : lifestyle.commuteMode === 'public-transit'
          ? 'Wait in covered or setback areas away from idling buses while waiting for transit.'
          : isHighAqi
            ? 'Replace high-exertion outdoor travel with transit or indoor mobility until AQI drops below 200.'
            : 'Use quieter, tree-lined routes away from arterial traffic.';

  const dailyRoutine: AdvisorPlan['dailyRoutine'] = [
    {
      timeWindow: cleanWin,
      title: `Cleanest Window: ${outdoorLabel}`,
      action: isHighAqi
        ? `Do light movement indoors or keep essential outdoor ${outdoorLabel.toLowerCase()} brief during ${cleanWin} (avg AQI ${analysis.cleanest2hWindow.avgAqi}).`
        : `Schedule your ${outdoorLabel.toLowerCase()} during ${cleanWin} when AQI dips to ${analysis.cleanest2hWindow.avgAqi} (PM2.5 ~${analysis.cleanest2hWindow.avgPm25} µg/m³).`,
      impactExplanation: `Lowers inhaled ${analysis.dominantPollutant} dose compared to the peak window (${worstWin}, avg AQI ${analysis.worst2hWindow.avgAqi}).`,
    },
    {
      timeWindow: firstSafeVent
        ? formatWindow(firstSafeVent.startTime, firstSafeVent.endTime)
        : 'Midday Indoor Care',
      title: firstSafeVent ? 'Safe Cross-Ventilation Window' : 'Keep Windows Sealed & Filter Indoor Air',
      action: firstSafeVent
        ? `Open opposite windows for 15–20 minutes during ${formatWindow(firstSafeVent.startTime, firstSafeVent.endTime)} (avg AQI ${firstSafeVent.avgAqi}) to flush indoor CO2 and cooking VOCs.`
        : `All next-24h hours exceed AQI 100; keep exterior windows closed and rely on kitchen exhaust and ${lifestyle.hasPurifier ? 'your air purifier' : 'damp dusting'}.`,
      impactExplanation: firstSafeVent
        ? 'Refreshes stale indoor air without pulling in high outdoor particulate matter.'
        : 'Prevents outdoor PM2.5 and PM10 from infiltrating living spaces.',
    },
    {
      timeWindow: worstWin,
      title: 'Peak Pollution Avoidance',
      action: `Avoid strenuous outdoor exertion during ${worstWin} (avg AQI ${analysis.worst2hWindow.avgAqi}, PM2.5 ~${analysis.worst2hWindow.avgPm25} µg/m³). ${commuteAction}`,
      impactExplanation: `Cutting exposure during the dirtiest 2-hour window avoids up to ${Math.max(0, analysis.worst2hWindow.avgAqi - analysis.cleanest2hWindow.avgAqi)} AQI points of peak burden.`,
    },
    {
      timeWindow: 'Evening Wind-Down',
      title: 'Low-Emission Home Reset',
      action: `Run kitchen exhaust while cooking, avoid incense or indoor smoke, and prep tomorrow's low-emission commute (${lifestyle.commuteMode}).`,
      impactExplanation: 'Eliminates indoor combustion spikes that often exceed outdoor PM2.5 levels.',
    },
  ];

  const homeLabel = lifestyle.homeType.replace('-', ' ');
  const indoorAirHacks: AdvisorPlan['indoorAirHacks'] = [
    {
      title: lifestyle.hasPurifier ? 'Optimize Purifier Placement & Speed' : 'Damp-Mop Instead of Dry Sweeping',
      action: lifestyle.hasPurifier
        ? `Place your purifier in the main ${homeLabel} room with doors shut, and run medium auto-mode during ${worstWin}.`
        : `Use a damp microfiber cloth and wet mop on ${homeLabel} floors rather than a dry broom.`,
      whyNow: `Current ${analysis.dominantPollutant} levels (AQI ${analysis.aqi}) make resuspending settled dust especially counterproductive.`,
    },
    {
      title: 'Kitchen Exhaust & Lid-On Cooking',
      action: 'Turn on the exhaust fan or range hood 5 minutes before cooking and keep lids on simmering pots.',
      whyNow: `Cooking fumes add fine particulates on top of outdoor AQI ${analysis.aqi} (${analysis.category}).`,
    },
    {
      title: firstSafeVent ? 'Timed Cross-Ventilation' : 'Seal Door & Window Gaps',
      action: firstSafeVent
        ? `Ventilate briefly during ${formatWindow(firstSafeVent.startTime, firstSafeVent.endTime)} when outdoor AQI is ${firstSafeVent.avgAqi}, then close up before ${worstWin}.`
        : 'Use door sweeps or rolled towels under exterior door gaps while outdoor AQI stays above 100.',
      whyNow: firstSafeVent
        ? 'Outdoor air is temporarily Satisfactory (AQI ≤ 100), making brief air exchange beneficial.'
        : 'No safe outdoor ventilation window (AQI ≤ 100) appears in the next 24 hours.',
    },
  ];

  const sustainableSwaps: AdvisorPlan['sustainableSwaps'] = impact.swaps.map((swap) => ({
    id: swap.id,
    currentHabit: describeCurrentHabit(swap, lifestyle),
    ecoSwap: swap.label,
    kgCo2SavedPerWeek: swap.kgCo2SavedPerWeek,
    carKmEquivalent: swap.carKmEquivalent,
    impactExplanation: `${swap.basisNote} — saves ${swap.kgCo2SavedPerWeek} kg CO2/week (${swap.carKmEquivalent} car-km equivalent).`,
  }));

  return {
    summary,
    dailyRoutine,
    indoorAirHacks,
    sustainableSwaps,
  };
}

const GEMINI_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    dailyRoutine: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timeWindow: { type: Type.STRING },
          title: { type: Type.STRING },
          action: { type: Type.STRING },
          impactExplanation: { type: Type.STRING },
        },
        required: ['timeWindow', 'title', 'action', 'impactExplanation'],
      },
    },
    indoorAirHacks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          action: { type: Type.STRING },
          whyNow: { type: Type.STRING },
        },
        required: ['title', 'action', 'whyNow'],
      },
    },
    sustainableSwaps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          currentHabit: { type: Type.STRING },
          ecoSwap: { type: Type.STRING },
          kgCo2SavedPerWeek: { type: Type.NUMBER },
          carKmEquivalent: { type: Type.NUMBER },
          impactExplanation: { type: Type.STRING },
        },
        required: [
          'id',
          'currentHabit',
          'ecoSwap',
          'kgCo2SavedPerWeek',
          'carKmEquivalent',
          'impactExplanation',
        ],
      },
    },
  },
  required: ['summary', 'dailyRoutine', 'indoorAirHacks', 'sustainableSwaps'],
};

function relockDeterministicSwaps(
  geminiSwaps: AdvisorPlan['sustainableSwaps'],
  fallbackPlan: AdvisorPlan,
  deterministicSwaps: DeterministicSwap[],
): AdvisorPlan['sustainableSwaps'] {
  const byId = new Map(geminiSwaps.map((s) => [s.id, s]));
  const fallbackById = new Map(fallbackPlan.sustainableSwaps.map((s) => [s.id, s]));

  return deterministicSwaps.map((det) => {
    const matched = byId.get(det.id) ?? fallbackById.get(det.id);
    return {
      id: det.id,
      currentHabit: matched?.currentHabit ?? 'Baseline weekly habit',
      ecoSwap: matched?.ecoSwap ?? det.label,
      kgCo2SavedPerWeek: det.kgCo2SavedPerWeek,
      carKmEquivalent: det.carKmEquivalent,
      impactExplanation: matched?.impactExplanation ?? det.basisNote,
    };
  });
}

/**
 * Generates personalized air-quality & sustainability advice via Gemini on the server,
 * falling back cleanly to a deterministic plan if the API key is missing or the call fails.
 */
export async function generateAirQualityAdvice(
  cityName: string,
  analysis: AqiAnalysis,
  lifestyle: LifestyleProfile,
  impact: LifestyleImpactResult,
): Promise<{ advisor: AdvisorPlan; source: 'gemini' | 'fallback' }> {
  const fallbackPlan = buildDeterministicFallbackPlan(cityName, analysis, lifestyle, impact);
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return { advisor: fallbackPlan, source: 'fallback' };
  }

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const ai = new GoogleGenAI({ apiKey });

  const promptPayload = {
    cityName,
    cpcbAqi: analysis.aqi,
    category: analysis.category,
    dominantPollutant: analysis.dominantPollutant,
    subIndices: analysis.subIndices,
    cleanest2hWindow: analysis.cleanest2hWindow,
    worst2hWindow: analysis.worst2hWindow,
    safeVentilationWindows: analysis.safeVentilationWindows,
    lifestyle,
    deterministicSwaps: impact.swaps,
    totalPotentialKgCo2PerWeek: impact.totalPotentialKgCo2PerWeek,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Generate a personalized daily routine (3-4 items), indoor air hacks (3-4 items), and sustainable swaps matching every id in deterministicSwaps for this verified telemetry:\n${JSON.stringify(
        promptPayload,
      )}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: GEMINI_RESPONSE_SCHEMA,
        abortSignal: controller.signal,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      console.warn('[SaafSaans] Gemini returned empty response; using deterministic fallback.');
      return { advisor: fallbackPlan, source: 'fallback' };
    }

    const parsedJson = JSON.parse(text) as unknown;
    const validated = AdvisorPlanSchema.safeParse(parsedJson);
    if (!validated.success) {
      console.warn(
        '[SaafSaans] Gemini response failed schema validation; using fallback:',
        validated.error.issues[0]?.message,
      );
      return { advisor: fallbackPlan, source: 'fallback' };
    }

    const relocked: AdvisorPlan = {
      ...validated.data,
      sustainableSwaps: relockDeterministicSwaps(
        validated.data.sustainableSwaps,
        fallbackPlan,
        impact.swaps,
      ),
    };

    return { advisor: relocked, source: 'gemini' };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Unknown Gemini error';
    console.warn(`[SaafSaans] Gemini call failed (${reason}); using deterministic fallback.`);
    return { advisor: fallbackPlan, source: 'fallback' };
  } finally {
    clearTimeout(timeoutId);
  }
}
