import { describe, expect, it } from 'vitest';
import { calculateDeterministicSwaps, summarizeWeeklyImpact } from './sustainability.js';
import type { LifestyleProfile } from './types.js';

describe('calculateDeterministicSwaps & summarizeWeeklyImpact', () => {
  it('generates 4 lifestyle-specific swaps with positive CO2 savings', () => {
    const profile: LifestyleProfile = {
      commuteMode: 'car',
      homeType: 'independent-house',
      outdoorActivity: 'morning-run',
      hasPurifier: true,
    };

    const swaps = calculateDeterministicSwaps(profile, 220);
    expect(swaps).toHaveLength(4);
    expect(swaps.map((s) => s.category)).toEqual([
      'commute',
      'energy',
      'indoor',
      'routine',
    ]);
    for (const swap of swaps) {
      expect(swap.kgCo2SavedPerWeek).toBeGreaterThan(0);
      expect(swap.carKmEquivalent).toBeGreaterThan(0);
    }
  });

  it('computes completed vs total weekly impact accurately', () => {
    const profile: LifestyleProfile = {
      commuteMode: 'two-wheeler',
      homeType: 'apartment',
      outdoorActivity: 'none',
      hasPurifier: false,
    };

    const swaps = calculateDeterministicSwaps(profile, 90);
    const total = swaps.reduce((acc, s) => acc + s.kgCo2SavedPerWeek, 0);

    const summaryNone = summarizeWeeklyImpact(swaps, []);
    expect(summaryNone.completedKgCo2).toBe(0);
    expect(summaryNone.totalPossibleKgCo2).toBe(Number(total.toFixed(1)));

    const summaryPartial = summarizeWeeklyImpact(swaps, [swaps[0].id]);
    expect(summaryPartial.completedKgCo2).toBe(swaps[0].kgCo2SavedPerWeek);
  });
});
