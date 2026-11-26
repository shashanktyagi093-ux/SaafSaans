export interface CitySearchResult {
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface PollutantReadings {
  pm2_5: number | null;
  pm10: number | null;
  nitrogen_dioxide: number | null;
  sulphur_dioxide: number | null;
  ozone: number | null;
  carbon_monoxide: number | null;
}

export interface HourlyForecastPoint {
  time: string;
  pm2_5: number | null;
  pm10: number | null;
  nitrogen_dioxide: number | null;
  sulphur_dioxide: number | null;
  ozone: number | null;
  carbon_monoxide: number | null;
}

export interface AirQualityResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  currentTime: string;
  current: PollutantReadings;
  hourly: HourlyForecastPoint[];
}

export type AqiCategory =
  | 'Good'
  | 'Satisfactory'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Severe';

export interface TimeWindow {
  startTime: string;
  endTime: string;
  avgAqi: number;
  avgPm25: number;
}

export interface AqiAnalysis {
  aqi: number;
  category: AqiCategory;
  dominantPollutant: string;
  subIndices: Record<string, number>;
  cleanest2hWindow: TimeWindow;
  worst2hWindow: TimeWindow;
  safeVentilationWindows: TimeWindow[];
  hourly24h: Array<{
    time: string;
    aqi: number;
    pm2_5: number;
    category: AqiCategory;
  }>;
}

export interface LifestyleProfile {
  commuteMode: 'car' | 'two-wheeler' | 'public-transit' | 'walk-cycle';
  homeType: 'apartment' | 'independent-house' | 'hostel-room';
  outdoorActivity: 'morning-run' | 'evening-walk' | 'none';
  hasPurifier: boolean;
}

export interface DeterministicSwap {
  id: string;
  category: 'commute' | 'energy' | 'indoor' | 'routine';
  label: string;
  kgCo2SavedPerWeek: number;
  carKmEquivalent: number;
  basisNote: string;
}
