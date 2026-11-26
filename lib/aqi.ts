import type {
  AqiAnalysis,
  AqiCategory,
  HourlyForecastPoint,
  PollutantReadings,
  TimeWindow,
} from './types.js';

type BreakpointBand = readonly [cLow: number, cHigh: number, iLow: number, iHigh: number];

const CPCB_BREAKPOINTS: Record<keyof PollutantReadings, readonly BreakpointBand[]> = {
  pm2_5: [
    [0, 30, 0, 50],
    [30, 60, 51, 100],
    [60, 90, 101, 200],
    [90, 120, 201, 300],
    [120, 250, 301, 400],
    [250, 380, 401, 500],
  ],
  pm10: [
    [0, 50, 0, 50],
    [50, 100, 51, 100],
    [100, 250, 101, 200],
    [250, 350, 201, 300],
    [350, 430, 301, 400],
    [430, 510, 401, 500],
  ],
  nitrogen_dioxide: [
    [0, 40, 0, 50],
    [40, 80, 51, 100],
    [80, 180, 101, 200],
    [180, 280, 201, 300],
    [280, 400, 301, 400],
    [400, 520, 401, 500],
  ],
  sulphur_dioxide: [
    [0, 40, 0, 50],
    [40, 80, 51, 100],
    [80, 380, 101, 200],
    [380, 800, 201, 300],
    [800, 1600, 301, 400],
    [1600, 2400, 401, 500],
  ],
  ozone: [
    [0, 50, 0, 50],
    [50, 100, 51, 100],
    [100, 168, 101, 200],
    [168, 208, 201, 300],
    [208, 748, 301, 400],
    [748, 900, 401, 500],
  ],
  // CPCB CO breakpoints are in mg/m^3; Open-Meteo provides ug/m^3.
  carbon_monoxide: [
    [0, 1.0, 0, 50],
    [1.0, 2.0, 51, 100],
    [2.0, 10.0, 101, 200],
    [10.0, 17.0, 201, 300],
    [17.0, 34.0, 301, 400],
    [34.0, 51.0, 401, 500],
  ],
};

const POLLUTANT_LABELS: Record<keyof PollutantReadings, string> = {
  pm2_5: 'PM2.5',
  pm10: 'PM10',
  nitrogen_dioxide: 'NO2',
  sulphur_dioxide: 'SO2',
  ozone: 'O3',
  carbon_monoxide: 'CO',
};

export function calculatePollutantSubIndex(
  pollutant: keyof PollutantReadings,
  rawValue: number,
): number {
  if (!Number.isFinite(rawValue) || rawValue < 0) {
    return 0;
  }

  // Convert Open-Meteo carbon_monoxide from ug/m^3 to mg/m^3 for CPCB breakpoints.
  const concentration = pollutant === 'carbon_monoxide' ? rawValue / 1000 : rawValue;
  const bands = CPCB_BREAKPOINTS[pollutant];

  for (const [cLow, cHigh, iLow, iHigh] of bands) {
    if (concentration <= cHigh) {
      const subIndex = ((iHigh - iLow) / (cHigh - cLow)) * (concentration - cLow) + iLow;
      return Math.max(0, Math.min(500, Math.round(subIndex)));
    }
  }

  return 500;
}

export function getAqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

export function calculateCpcbAqi(readings: PollutantReadings): {
  aqi: number;
  category: AqiCategory;
  dominantPollutant: string;
  subIndices: Record<string, number>;
} {
  const subIndices: Record<string, number> = {};
  let maxAqi = 0;
  let dominantPollutant = 'PM2.5';
  let hasAnyReading = false;

  for (const key of Object.keys(POLLUTANT_LABELS) as Array<keyof PollutantReadings>) {
    const val = readings[key];
    if (val === null || val === undefined || !Number.isFinite(val) || val < 0) {
      continue;
    }

    const label = POLLUTANT_LABELS[key];
    const subIndex = calculatePollutantSubIndex(key, val);
    subIndices[label] = subIndex;

    if (!hasAnyReading || subIndex > maxAqi) {
      maxAqi = subIndex;
      dominantPollutant = label;
      hasAnyReading = true;
    }
  }

  return {
    aqi: maxAqi,
    category: getAqiCategory(maxAqi),
    dominantPollutant,
    subIndices,
  };
}

function addOneHourLocal(isoTimestamp: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(isoTimestamp);
  if (!match) {
    return isoTimestamp;
  }

  const [, y, m, d, h, min] = match;
  const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(h), Number(min)));
  dt.setUTCHours(dt.getUTCHours() + 1);

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}T${pad(
    dt.getUTCHours(),
  )}:${pad(dt.getUTCMinutes())}`;
}

function buildWindow(points: AqiAnalysis['hourly24h']): TimeWindow {
  const sumAqi = points.reduce((acc, p) => acc + p.aqi, 0);
  const sumPm25 = points.reduce((acc, p) => acc + p.pm2_5, 0);
  const count = points.length || 1;

  return {
    startTime: points[0].time,
    endTime: addOneHourLocal(points[points.length - 1].time),
    avgAqi: Math.round(sumAqi / count),
    avgPm25: Number((sumPm25 / count).toFixed(1)),
  };
}

export function analyzeAirQuality(
  current: PollutantReadings,
  hourly: HourlyForecastPoint[],
  currentTime?: string,
): AqiAnalysis {
  const currentResult = calculateCpcbAqi(current);

  let startIndex = 0;
  if (currentTime && hourly.length > 0) {
    const hourPrefix = currentTime.slice(0, 13);
    const exactOrNext = hourly.findIndex(
      (pt) => pt.time.slice(0, 13) >= hourPrefix,
    );
    if (exactOrNext >= 0) {
      startIndex = exactOrNext;
    }
  }

  const slice24h = hourly.slice(startIndex, startIndex + 24);
  const effectiveSlice =
    slice24h.length > 0
      ? slice24h
      : [
          {
            time: currentTime ?? new Date().toISOString().slice(0, 16),
            ...current,
          },
        ];

  const hourly24h: AqiAnalysis['hourly24h'] = effectiveSlice.map((pt) => {
    const { aqi, category } = calculateCpcbAqi(pt);
    return {
      time: pt.time,
      aqi,
      pm2_5: pt.pm2_5 ?? 0,
      category,
    };
  });

  // Compute cleanest and worst 2-hour sliding windows.
  let cleanest2hWindow = buildWindow(hourly24h.slice(0, Math.min(2, hourly24h.length)));
  let worst2hWindow = cleanest2hWindow;

  for (let i = 1; i < hourly24h.length - 1; i++) {
    const candidate = buildWindow([hourly24h[i], hourly24h[i + 1]]);
    if (
      candidate.avgAqi < cleanest2hWindow.avgAqi ||
      (candidate.avgAqi === cleanest2hWindow.avgAqi &&
        candidate.avgPm25 < cleanest2hWindow.avgPm25)
    ) {
      cleanest2hWindow = candidate;
    }
    if (
      candidate.avgAqi > worst2hWindow.avgAqi ||
      (candidate.avgAqi === worst2hWindow.avgAqi &&
        candidate.avgPm25 > worst2hWindow.avgPm25)
    ) {
      worst2hWindow = candidate;
    }
  }

  // Identify contiguous ventilation windows where AQI <= 100 (Good or Satisfactory).
  const safeVentilationWindows: TimeWindow[] = [];
  let currentRun: AqiAnalysis['hourly24h'] = [];

  for (const pt of hourly24h) {
    if (pt.aqi <= 100) {
      currentRun.push(pt);
    } else if (currentRun.length > 0) {
      safeVentilationWindows.push(buildWindow(currentRun));
      currentRun = [];
    }
  }
  if (currentRun.length > 0) {
    safeVentilationWindows.push(buildWindow(currentRun));
  }

  return {
    aqi: currentResult.aqi,
    category: currentResult.category,
    dominantPollutant: currentResult.dominantPollutant,
    subIndices: currentResult.subIndices,
    cleanest2hWindow,
    worst2hWindow,
    safeVentilationWindows,
    hourly24h,
  };
}
