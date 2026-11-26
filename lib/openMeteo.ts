import { z } from 'zod';
import type {
  AirQualityResponse,
  CitySearchResult,
  HourlyForecastPoint,
} from './types.js';

const REQUEST_TIMEOUT_MS = 10_000;

const geocodingResultSchema = z.object({
  name: z.string(),
  admin1: z.string().optional(),
  country: z.string().optional().default('Unknown'),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string().optional().default('UTC'),
});

const geocodingResponseSchema = z.object({
  results: z.array(geocodingResultSchema).optional(),
});

const nullableNumberArray = z.array(z.number().nullable());

const airQualityResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  current: z.object({
    time: z.string(),
    pm2_5: z.number().nullable().optional().default(null),
    pm10: z.number().nullable().optional().default(null),
    nitrogen_dioxide: z.number().nullable().optional().default(null),
    sulphur_dioxide: z.number().nullable().optional().default(null),
    ozone: z.number().nullable().optional().default(null),
    carbon_monoxide: z.number().nullable().optional().default(null),
  }),
  hourly: z.object({
    time: z.array(z.string()).min(1),
    pm2_5: nullableNumberArray,
    pm10: nullableNumberArray,
    nitrogen_dioxide: nullableNumberArray,
    sulphur_dioxide: nullableNumberArray,
    ozone: nullableNumberArray,
    carbon_monoxide: nullableNumberArray,
  }),
});

async function fetchJsonWithTimeout(url: string, label: string): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(
        `${label} request failed with HTTP ${response.status} ${response.statusText}`.trim(),
      );
    }
    return await response.json();
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`${label} request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Searches cities using the keyless Open-Meteo Geocoding API.
 * Returns [] if the trimmed query has fewer than 2 characters or no results match.
 */
export async function searchCities(query: string): Promise<CitySearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    trimmed,
  )}&count=5&language=en&format=json`;

  const raw = await fetchJsonWithTimeout(url, 'Open-Meteo Geocoding');
  const parsed = geocodingResponseSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(
      `Invalid Open-Meteo Geocoding response: ${parsed.error.issues[0]?.message ?? 'unknown schema error'}`,
    );
  }

  if (!parsed.data.results || parsed.data.results.length === 0) {
    return [];
  }

  return parsed.data.results.map((item) => ({
    name: item.name,
    ...(item.admin1 ? { admin1: item.admin1 } : {}),
    country: item.country,
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone,
  }));
}

/**
 * Fetches current and 48-hour hourly air quality data from Open-Meteo.
 */
export async function fetchAirQuality(
  lat: number,
  lon: number,
): Promise<AirQualityResponse> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('Invalid coordinates: latitude and longitude must be finite numbers');
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error('Coordinates out of range: lat must be [-90, 90], lon must be [-180, 180]');
  }

  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide` +
    `&hourly=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide` +
    `&forecast_days=2&timezone=auto`;

  const raw = await fetchJsonWithTimeout(url, 'Open-Meteo Air Quality');
  const parsed = airQualityResponseSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(
      `Invalid Open-Meteo Air Quality response: ${parsed.error.issues[0]?.message ?? 'unknown schema error'}`,
    );
  }

  const { current, hourly, latitude, longitude, timezone } = parsed.data;
  const hourlyLength = hourly.time.length;
  const points: HourlyForecastPoint[] = [];

  for (let i = 0; i < hourlyLength; i++) {
    points.push({
      time: hourly.time[i],
      pm2_5: hourly.pm2_5[i] ?? null,
      pm10: hourly.pm10[i] ?? null,
      nitrogen_dioxide: hourly.nitrogen_dioxide[i] ?? null,
      sulphur_dioxide: hourly.sulphur_dioxide[i] ?? null,
      ozone: hourly.ozone[i] ?? null,
      carbon_monoxide: hourly.carbon_monoxide[i] ?? null,
    });
  }

  return {
    latitude,
    longitude,
    timezone,
    currentTime: current.time,
    current: {
      pm2_5: current.pm2_5,
      pm10: current.pm10,
      nitrogen_dioxide: current.nitrogen_dioxide,
      sulphur_dioxide: current.sulphur_dioxide,
      ozone: current.ozone,
      carbon_monoxide: current.carbon_monoxide,
    },
    hourly: points,
  };
}
