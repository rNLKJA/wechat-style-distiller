/**
 * Statistical confidence interval calculations
 * Wilson score for proportions, bootstrap percentile for means
 */

/**
 * Wilson score confidence interval for a proportion
 * More reliable than normal approximation for small samples or extreme proportions
 *
 * @param successes Number of successes
 * @param n Total sample size
 * @param confidence Confidence level (default 0.95 for 95% CI)
 * @returns [lower, upper] bounds
 */
export function wilsonCI(
  successes: number,
  n: number,
  confidence: number = 0.95
): [number, number] {
  if (n === 0) return [0, 0];

  const p = successes / n;
  const z = getZScore(confidence);
  const z2 = z * z;

  const denominator = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denominator;
  const margin = (z / denominator) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));

  return [
    Math.max(0, center - margin),
    Math.min(1, center + margin)
  ];
}

/**
 * Get z-score for a confidence level
 */
function getZScore(confidence: number): number {
  // Common confidence levels
  const zScores: Record<number, number> = {
    0.90: 1.645,
    0.95: 1.960,
    0.99: 2.576
  };

  return zScores[confidence] ?? 1.960;
}

/**
 * Bootstrap percentile confidence interval for a statistic
 *
 * @param data Sample data
 * @param statFn Function to compute statistic (e.g., mean, median)
 * @param nBootstrap Number of bootstrap samples
 * @param confidence Confidence level
 * @param seed Random seed for reproducibility
 * @returns [lower, upper] bounds
 */
export function bootstrapCI(
  data: number[],
  statFn: (sample: number[]) => number,
  nBootstrap: number = 1000,
  confidence: number = 0.95,
  seed?: number
): [number, number] {
  if (data.length === 0) return [0, 0];

  const rng = seed !== undefined ? seededRandom(seed) : Math.random;
  const bootstrapStats: number[] = [];

  for (let i = 0; i < nBootstrap; i++) {
    const sample = resample(data, rng);
    bootstrapStats.push(statFn(sample));
  }

  bootstrapStats.sort((a, b) => a - b);

  const alpha = 1 - confidence;
  const lowerIdx = Math.floor(nBootstrap * (alpha / 2));
  const upperIdx = Math.ceil(nBootstrap * (1 - alpha / 2)) - 1;

  return [bootstrapStats[lowerIdx], bootstrapStats[upperIdx]];
}

/**
 * Resample with replacement
 */
function resample(data: number[], rng: () => number): number[] {
  const n = data.length;
  const sample: number[] = [];

  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * n);
    sample.push(data[idx]);
  }

  return sample;
}

/**
 * Seeded PRNG (simple LCG for reproducibility)
 */
function seededRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Common statistics for bootstrap
 */
export const stats = {
  mean: (data: number[]) => data.reduce((a, b) => a + b, 0) / data.length,
  median: (data: number[]) => {
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  },
  stddev: (data: number[]) => {
    const mean = stats.mean(data);
    const variance = data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length;
    return Math.sqrt(variance);
  }
};
