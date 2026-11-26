import type { DeterministicSwap, LifestyleProfile } from './types.js';

// Average passenger car emission factor: 0.17 kg CO2 per km.
const CAR_KG_CO2_PER_KM = 0.17;

function toCarKm(kgCo2: number): number {
  return Number((kgCo2 / CAR_KG_CO2_PER_KM).toFixed(1));
}

function roundKg(val: number): number {
  return Number(val.toFixed(1));
}

/**
 * Generates deterministic weekly CO2-saving swaps tailored to the user's
 * lifestyle profile and current air quality level.
 */
export function calculateDeterministicSwaps(
  profile: LifestyleProfile,
  aqi: number,
): DeterministicSwap[] {
  const swaps: DeterministicSwap[] = [];

  // 1. Commute swap (based on current commuteMode)
  if (profile.commuteMode === 'car') {
    const kgSaved = 15.6; // ~120 km/week shifted from car (0.17) to public transit (0.04)
    swaps.push({
      id: 'commute-shift-transit',
      category: 'commute',
      label: 'Replace 2 car commute days/week with metro or bus',
      kgCo2SavedPerWeek: kgSaved,
      carKmEquivalent: toCarKm(kgSaved),
      basisNote: '120 km/wk shifted from car (0.17 kg/km) to public transit (0.04 kg/km)',
    });
  } else if (profile.commuteMode === 'two-wheeler') {
    const kgSaved = 4.8; // ~60 km/week short trips shifted to walking/cycling
    swaps.push({
      id: 'commute-short-walk',
      category: 'commute',
      label: 'Walk or cycle errands under 3 km instead of riding',
      kgCo2SavedPerWeek: kgSaved,
      carKmEquivalent: toCarKm(kgSaved),
      basisNote: '60 km/wk shifted from two-wheeler (0.08 kg/km) to zero-emission travel',
    });
  } else if (profile.commuteMode === 'public-transit') {
    const kgSaved = 2.4; // ~60 km/week last-mile shifted to walking/cycling
    swaps.push({
      id: 'commute-last-mile-walk',
      category: 'commute',
      label: 'Walk or cycle last-mile transit legs under 2 km',
      kgCo2SavedPerWeek: kgSaved,
      carKmEquivalent: toCarKm(kgSaved),
      basisNote: '60 km/wk feeder trips shifted from motorized transit (0.04 kg/km) to walking',
    });
  } else {
    const kgSaved = 1.7; // Maintaining zero-emission commute vs 10 km/wk ride-hail
    swaps.push({
      id: 'commute-zero-emission-streak',
      category: 'commute',
      label: 'Keep weekend errands car-free with walking or cycling',
      kgCo2SavedPerWeek: kgSaved,
      carKmEquivalent: toCarKm(kgSaved),
      basisNote: 'Avoids ~10 km/wk of ride-hail car trips (0.17 kg/km)',
    });
  }

  // 2. Energy swap (based on homeType)
  if (profile.homeType === 'independent-house') {
    const kgSaved = 7.1; // ~10 kWh/wk saved via thermostat & water heater scheduling
    swaps.push({
      id: 'energy-hvac-schedule',
      category: 'energy',
      label: 'Raise AC setpoint by 2°C and use ceiling fans for 6 hrs/day',
      kgCo2SavedPerWeek: kgSaved,
      carKmEquivalent: toCarKm(kgSaved),
      basisNote: 'Saves ~10 kWh/wk at 0.71 kg CO2/kWh grid average',
    });
  } else if (profile.homeType === 'apartment') {
    const kgSaved = 5.0; // ~7 kWh/wk saved
    swaps.push({
      id: 'energy-appliance-offpeak',
      category: 'energy',
      label: 'Air-dry laundry and switch off standby appliances overnight',
      kgCo2SavedPerWeek: kgSaved,
      carKmEquivalent: toCarKm(kgSaved),
      basisNote: 'Saves ~7 kWh/wk at 0.71 kg CO2/kWh grid average',
    });
  } else {
    const kgSaved = 2.8; // ~4 kWh/wk saved in a hostel/single room
    swaps.push({
      id: 'energy-room-unplug',
      category: 'energy',
      label: 'Unplug chargers, kettle, and desk electronics when stepping out',
      kgCo2SavedPerWeek: kgSaved,
      carKmEquivalent: toCarKm(kgSaved),
      basisNote: 'Saves ~4 kWh/wk at 0.71 kg CO2/kWh grid average',
    });
  }

  // 3. Indoor air-care swap (tailored to purifier & AQI)
  if (profile.hasPurifier) {
    const kgSaved = aqi > 200 ? 2.1 : 3.2;
    swaps.push({
      id: 'indoor-purifier-smart-mode',
      category: 'indoor',
      label:
        aqi > 200
          ? 'Seal window gaps and run purifier on medium auto-mode'
          : 'Switch purifier to eco/sleep mode during cleaner hours',
      kgCo2SavedPerWeek: kgSaved,
      carKmEquivalent: toCarKm(kgSaved),
      basisNote:
        aqi > 200
          ? 'Reduces continuous high-speed fan draw by ~3 kWh/wk (0.71 kg CO2/kWh)'
          : 'Cuts unnecessary runtime by ~4.5 kWh/wk (0.71 kg CO2/kWh)',
    });
  } else {
    const kgSaved = 2.5;
    swaps.push({
      id: 'indoor-clean-ventilation',
      category: 'indoor',
      label:
        aqi > 100
          ? 'Use kitchen exhaust while cooking and damp-mop instead of dry-sweeping'
          : 'Cross-ventilate during the cleanest 2-hour window instead of running fans',
      kgCo2SavedPerWeek: kgSaved,
      carKmEquivalent: toCarKm(kgSaved),
      basisNote: 'Avoids ~3.5 kWh/wk of mechanical cooling/fan draw (0.71 kg CO2/kWh)',
    });
  }

  // 4. Routine / household habit swap
  if (profile.outdoorActivity !== 'none') {
    const kgSaved = 3.4;
    swaps.push({
      id: 'routine-clean-window-shift',
      category: 'routine',
      label:
        aqi > 150
          ? 'Shift outdoor exercise to the cleanest 2-hour window or indoor mobility'
          : 'Time outdoor workout to the cleanest 2-hour window and carry a reusable bottle',
      kgCo2SavedPerWeek: kgSaved,
      carKmEquivalent: toCarKm(kgSaved),
      basisNote: 'Eliminates single-use bottle/gym-commute emissions (~3.4 kg CO2/wk)',
    });
  } else {
    const kgSaved = 4.2;
    swaps.push({
      id: 'routine-local-groceries',
      category: 'routine',
      label: 'Batch household deliveries into one weekly order',
      kgCo2SavedPerWeek: kgSaved,
      carKmEquivalent: toCarKm(kgSaved),
      basisNote: 'Consolidates ~3–4 last-mile delivery trips/wk (~4.2 kg CO2/wk)',
    });
  }

  return swaps.map((s) => ({
    ...s,
    kgCo2SavedPerWeek: roundKg(s.kgCo2SavedPerWeek),
  }));
}

export function summarizeWeeklyImpact(
  swaps: DeterministicSwap[],
  completedIds: string[] = [],
): {
  totalPossibleKgCo2: number;
  completedKgCo2: number;
  totalCarKmEquivalent: number;
  completedCarKmEquivalent: number;
} {
  const completedSet = new Set(completedIds);
  const totalPossibleKgCo2 = roundKg(
    swaps.reduce((sum, s) => sum + s.kgCo2SavedPerWeek, 0),
  );
  const completedKgCo2 = roundKg(
    swaps
      .filter((s) => completedSet.has(s.id))
      .reduce((sum, s) => sum + s.kgCo2SavedPerWeek, 0),
  );

  return {
    totalPossibleKgCo2,
    completedKgCo2,
    totalCarKmEquivalent: toCarKm(totalPossibleKgCo2),
    completedCarKmEquivalent: toCarKm(completedKgCo2),
  };
}
