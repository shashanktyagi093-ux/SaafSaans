import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AnalyzeRequestSchema, type AnalyzeResponse } from '../lib/advisorSchema.js';
import { analyzeAirQuality } from '../lib/aqi.js';
import { generateAirQualityAdvice } from '../lib/geminiAdvisor.js';
import { fetchAirQuality } from '../lib/openMeteo.js';
import { computeLifestyleImpact } from '../lib/sustainability.js';

const DISCLAIMER =
  'Modelled Open-Meteo Estimate & CPCB AQI Formula — Informational Only, Not Medical Advice.';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  let rawBody: unknown = req.body;
  if (Buffer.isBuffer(rawBody)) {
    rawBody = rawBody.toString('utf8');
  }
  if (typeof rawBody === 'string') {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      res.status(400).json({ error: 'Invalid JSON request body.' });
      return;
    }
  }

  const parsed = AnalyzeRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request payload.',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { cityName, lat, lon, lifestyle } = parsed.data;

  let telemetry;
  try {
    telemetry = await fetchAirQuality(lat, lon);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upstream fetch error';
    console.error('[SaafSaans] Open-Meteo telemetry fetch failed:', message);
    res.status(502).json({
      error: 'Unable to fetch live air-quality telemetry right now. Please try again.',
    });
    return;
  }

  const airQuality = analyzeAirQuality(
    telemetry.current,
    telemetry.hourly,
    telemetry.currentTime,
  );
  const impact = computeLifestyleImpact(lifestyle, airQuality);
  const { advisor, source } = await generateAirQualityAdvice(
    cityName,
    airQuality,
    lifestyle,
    impact,
  );

  const responseBody: AnalyzeResponse = {
    meta: {
      cityName,
      lat,
      lon,
      generatedAt: new Date().toISOString(),
      source,
      disclaimer: DISCLAIMER,
    },
    airQuality,
    impactSummary: {
      totalPotentialKgCo2PerWeek: impact.totalPotentialKgCo2PerWeek,
      exposureReductionSummary: impact.exposureReductionSummary,
    },
    advisor,
  };

  res.status(200).json(responseBody);
}
