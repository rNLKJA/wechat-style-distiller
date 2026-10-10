import { describe, it, expect } from 'vitest';
import { wilsonCI, bootstrapCI, stats } from './confidence-intervals';

describe('wilsonCI', () => {
  it('computes correct CI for p=0.5, n=100', () => {
    // Verified against scipy Wilson CI implementation
    // Reference: scripts/verify_stats.py (run with: uv run --with scipy --with numpy scripts/verify_stats.py)
    // Expected values computed 2024-01-15 via scipy manual Wilson formula
    const [lower, upper] = wilsonCI(50, 100, 0.95);
    expect(lower).toBeCloseTo(0.4038, 3);
    expect(upper).toBeCloseTo(0.5962, 3);
  });

  it('computes correct CI for small p', () => {
    // 5 successes out of 100
    const [lower, upper] = wilsonCI(5, 100, 0.95);
    expect(lower).toBeCloseTo(0.0215, 3);
    expect(upper).toBeCloseTo(0.1118, 3);
  });

  it('handles edge case n=0', () => {
    const [lower, upper] = wilsonCI(0, 0);
    expect(lower).toBe(0);
    expect(upper).toBe(0);
  });

  it('respects [0,1] bounds', () => {
    const [lower, upper] = wilsonCI(1, 1);
    expect(lower).toBeGreaterThanOrEqual(0);
    expect(upper).toBeLessThanOrEqual(1);
  });
});

describe('bootstrapCI', () => {
  it('computes CI for mean with fixed seed', () => {
    const data = [10, 20, 30, 40, 50];
    const [lower, upper] = bootstrapCI(data, stats.mean, 1000, 0.95, 12345);

    // Mean = 30; CI should contain 30
    expect(lower).toBeLessThanOrEqual(30);
    expect(upper).toBeGreaterThanOrEqual(30);

    // Reproducibility: same seed produces same result
    const [lower2, upper2] = bootstrapCI(data, stats.mean, 1000, 0.95, 12345);
    expect(lower2).toBe(lower);
    expect(upper2).toBe(upper);
  });

  it('computes CI for median', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const [lower, upper] = bootstrapCI(data, stats.median, 1000, 0.95, 54321);

    expect(lower).toBeLessThanOrEqual(5);
    expect(upper).toBeGreaterThanOrEqual(5);
  });

  it('handles edge case empty data', () => {
    const [lower, upper] = bootstrapCI([], stats.mean);
    expect(lower).toBe(0);
    expect(upper).toBe(0);
  });
});

describe('stats helpers', () => {
  it('computes mean correctly', () => {
    expect(stats.mean([1, 2, 3, 4, 5])).toBe(3);
    expect(stats.mean([10])).toBe(10);
  });

  it('computes median correctly (odd length)', () => {
    expect(stats.median([1, 2, 3, 4, 5])).toBe(3);
  });

  it('computes median correctly (even length)', () => {
    expect(stats.median([1, 2, 3, 4])).toBe(2.5);
  });

  it('computes stddev correctly', () => {
    // [2, 4, 4, 4, 5, 5, 7, 9] has mean 5, stddev 2
    const data = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(stats.mean(data)).toBe(5);
    expect(stats.stddev(data)).toBe(2);
  });
});
