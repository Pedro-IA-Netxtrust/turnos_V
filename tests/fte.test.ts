import { calculateMonthlyTarget, calculateDeviationPercentage, computeFteTargetWithAlert } from '@/lib/fte/calculator';

describe('FTE calculator', () => {
  const pattern = {
    hours_sun: 0,
    hours_mon: 8,
    hours_tue: 8,
    hours_wed: 8,
    hours_thu: 8,
    hours_fri: 8,
    hours_sat: 0,
  };

  it('calculates monthly target correctly for mayo 2026', () => {
    const target = calculateMonthlyTarget(pattern, 100, 2026, 5);
    expect(target).toBeGreaterThan(0);
  });

  it('returns a negative deviation when actual is below target', () => {
    const target = calculateMonthlyTarget(pattern, 100, 2026, 5);
    const deviation = calculateDeviationPercentage(target - 10, target);
    expect(deviation).toBeCloseTo(-100 * 10 / target, 2);
  });

  it('flags an alert when deviation is below -10%', () => {
    const result = computeFteTargetWithAlert(100, pattern, 100, 2026, 5);
    expect(result.alert).toBe(result.deviationPct !== null && result.deviationPct < -10);
  });
});
