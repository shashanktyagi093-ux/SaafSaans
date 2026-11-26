import { describe, expect, it } from 'vitest';
import {
  analyzeAirQuality,
  calculateCpcbAqi,
  calculatePollutantSubIndex,
  getAqiCategory,
} from './aqi.js';
import type { HourlyForecastPoint, PollutantReadings } from './types.js';

describe('CPCB AQI calculation', () => {
  it('maps AQI values to official CPCB categories', () => {
    expect(getAqiCategory(0)).toBe('Good');
    expect(getAqiCategory(50)).toBe('Good');
    expect(getAqiCategory(51)).toBe('Satisfactory');
    expect(getAqiCategory(100)).toBe('Satisfactory');
    expect(getAqiCategory(150)).toBe('Moderate');
    expect(getAqiCategory(250)).toBe('Poor');
    expect(getAqiCategory(350)).toBe('Very Poor');
    expect(getAqiCategory(450)).toBe('Severe');
  });

  it('computes PM2.5 sub-indices accurately across bands', () => {
    expect(calculatePollutantSubIndex('pm2_5', 15)).toBe(25);
    expect(calculatePollutantSubIndex('pm2_5', 30)).toBe(50);
    expect(calculatePollutantSubIndex('pm2_5', 45)).toBe(76);
    expect(calculatePollutantSubIndex('pm2_5', 75)).toBe(151);
    expect(calculatePollutantSubIndex('pm2_5', 105)).toBe(251);
    expect(calculatePollutantSubIndex('pm2_5', 185)).toBe(351);
    expect(calculatePollutantSubIndex('pm2_5', 500)).toBe(500);
  });

  it('converts Open-Meteo CO ug/m3 to mg/m3 before applying CPCB breakpoints', () => {
    // 1000 ug/m3 = 1.0 mg/m3 -> CPCB AQI 50
    expect(calculatePollutantSubIndex('carbon_monoxide', 1000)).toBe(50);
    // 2000 ug/m3 = 2.0 mg/m3 -> CPCB AQI 100
    expect(calculatePollutantSubIndex('carbon_monoxide', 2000)).toBe(100);
  });

  it('determines overall AQI as max sub-index and identifies dominant pollutant', () => {
    const readings: PollutantReadings = {
      pm2_5: 45, // sub-index 76
      pm10: 175, // sub-index 151
      nitrogen_dioxide: 30, // sub-index 38
      sulphur_dioxide: null,
      ozone: 40, // sub-index 40
      carbon_monoxide: 500, // 0.5 mg/m3 -> sub-index 25
    };

    const result = calculateCpcbAqi(readings);
    expect(result.aqi).toBe(151);
    expect(result.category).toBe('Moderate');
    expect(result.dominantPollutant).toBe('PM10');
    expect(result.subIndices['SO2']).toBeUndefined();
  });

  it('handles all-null readings gracefully', () => {
    const empty: PollutantReadings = {
      pm2_5: null,
      pm10: null,
      nitrogen_dioxide: null,
      sulphur_dioxide: null,
      ozone: null,
      carbon_monoxide: null,
    };

    const result = calculateCpcbAqi(empty);
    expect(result.aqi).toBe(0);
    expect(result.category).toBe('Good');
    expect(result.subIndices).toEqual({});
  });
});

describe('analyzeAirQuality', () => {
  it('identifies cleanest 2h window, worst 2h window, and safe ventilation windows', () => {
    const hourly: HourlyForecastPoint[] = Array.from({ length: 6 }, (_, i) => {
      const hour = String(i + 6).padStart(2, '0');
      // Hours 06, 07 -> clean (PM2.5=20 -> AQI 33)
      // Hours 08, 09 -> moderate (PM2.5=75 -> AQI 151)
      // Hours 10, 11 -> poor (PM2.5=105 -> AQI 251)
      const pm25 = i < 2 ? 20 : i < 4 ? 75 : 105;
      return {
        time: `2026-11-26T${hour}:00`,
        pm2_5: pm25,
        pm10: null,
        nitrogen_dioxide: null,
        sulphur_dioxide: null,
        ozone: null,
        carbon_monoxide: null,
      };
    });

    const current: PollutantReadings = {
      pm2_5: 75,
      pm10: null,
      nitrogen_dioxide: null,
      sulphur_dioxide: null,
      ozone: null,
      carbon_monoxide: null,
    };

    const analysis = analyzeAirQuality(current, hourly, '2026-11-26T06:00');
    expect(analysis.aqi).toBe(151);
    expect(analysis.cleanest2hWindow).toEqual({
      startTime: '2026-11-26T06:00',
      endTime: '2026-11-26T08:00',
      avgAqi: 33,
      avgPm25: 20,
    });
    expect(analysis.worst2hWindow).toEqual({
      startTime: '2026-11-26T10:00',
      endTime: '2026-11-26T12:00',
      avgAqi: 251,
      avgPm25: 105,
    });
    expect(analysis.safeVentilationWindows).toEqual([
      {
        startTime: '2026-11-26T06:00',
        endTime: '2026-11-26T08:00',
        avgAqi: 33,
        avgPm25: 20,
      },
    ]);
  });

  it('returns empty safeVentilationWindows when all hours exceed AQI 100', () => {
    const hourly: HourlyForecastPoint[] = [
      {
        time: '2026-11-26T10:00',
        pm2_5: 95,
        pm10: null,
        nitrogen_dioxide: null,
        sulphur_dioxide: null,
        ozone: null,
        carbon_monoxide: null,
      },
      {
        time: '2026-11-26T11:00',
        pm2_5: 105,
        pm10: null,
        nitrogen_dioxide: null,
        sulphur_dioxide: null,
        ozone: null,
        carbon_monoxide: null,
      },
    ];

    const analysis = analyzeAirQuality(hourly[0], hourly, '2026-11-26T10:00');
    expect(analysis.safeVentilationWindows).toEqual([]);
  });
});
