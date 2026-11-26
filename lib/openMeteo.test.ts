import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAirQuality, searchCities } from './openMeteo.js';

describe('Open-Meteo client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns [] for queries shorter than 2 characters without calling fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(await searchCities('a')).toEqual([]);
    expect(await searchCities(' ')).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('parses valid city search results', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              name: 'Metro City',
              admin1: 'Central',
              country: 'Countryland',
              latitude: 12.34,
              longitude: 56.78,
              timezone: 'UTC',
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const cities = await searchCities('Metro');
    expect(cities).toEqual([
      {
        name: 'Metro City',
        admin1: 'Central',
        country: 'Countryland',
        latitude: 12.34,
        longitude: 56.78,
        timezone: 'UTC',
      },
    ]);
  });

  it('throws descriptive error on geocoding HTTP failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' }),
    );

    await expect(searchCities('Metro')).rejects.toThrow(
      'Open-Meteo Geocoding request failed with HTTP 503 Service Unavailable',
    );
  });

  it('validates coordinates and parses air quality payload', async () => {
    await expect(fetchAirQuality(95, 10)).rejects.toThrow('Coordinates out of range');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          latitude: 12.34,
          longitude: 56.78,
          timezone: 'UTC',
          current: {
            time: '2026-11-26T10:00',
            pm2_5: 42.5,
            pm10: 80,
            nitrogen_dioxide: 25,
            sulphur_dioxide: 10,
            ozone: 35,
            carbon_monoxide: 450,
          },
          hourly: {
            time: ['2026-11-26T10:00', '2026-11-26T11:00'],
            pm2_5: [42.5, 40.0],
            pm10: [80, 75],
            nitrogen_dioxide: [25, 22],
            sulphur_dioxide: [10, 9],
            ozone: [35, 38],
            carbon_monoxide: [450, 420],
          },
        }),
        { status: 200 },
      ),
    );

    const aq = await fetchAirQuality(12.34, 56.78);
    expect(aq.current.pm2_5).toBe(42.5);
    expect(aq.hourly).toHaveLength(2);
    expect(aq.hourly[1].time).toBe('2026-11-26T11:00');
  });

  it('throws descriptive error when air quality payload is malformed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ unexpected: true }), { status: 200 }),
    );

    await expect(fetchAirQuality(12.34, 56.78)).rejects.toThrow(
      'Invalid Open-Meteo Air Quality response',
    );
  });
});
