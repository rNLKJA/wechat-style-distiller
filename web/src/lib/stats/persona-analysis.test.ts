import { describe, it, expect } from 'vitest';
import {
  extractFeatures,
  cosineSimilarity,
  computePairwiseSimilarities,
  computeDistinctiveness,
  computeFeatureVariance,
  matchToPersona,
  type PersonaFeatureVector
} from './persona-analysis';
import type { PersonaStats } from '../types';

describe('extractFeatures', () => {
  it('extracts feature vector from persona stats', () => {
    const stats: PersonaStats = {
      n_turns: 100,
      total_chars: 2000,
      length: { mean: 20, median: 18, p25: 10, p50: 18, p75: 25, p90: 35, max: 100 },
      bubbles_per_turn: { mean: 1.5, max: 3, multi_bubble_share: 0.4 },
      emoji: { unicode_per_turn: 0.3, top_unicode: [], top_wechat_faces: [] },
      laughter_per_turn: 0.5,
      code_switching: { cjk_chars: 1200, latin_words: 200, latin_share: 0.4 },
      punctuation: { ellipsis: 10, exclaim: 5, question: 3, tilde: 2, no_end_punct_turns: 70 },
      top_phrases: [],
      top_openers: [],
      top_closers: [],
      active_hours_utc: {},
      by_contact: {},
      engine: 'test'
    };

    const vector = extractFeatures('test-persona', stats);

    expect(vector.personaId).toBe('test-persona');
    expect(vector.features.avgLength).toBe(20);
    expect(vector.features.emojiRate).toBe(0.3);
    expect(vector.features.latinShare).toBe(0.4);
    expect(vector.features.bubblesPerTurn).toBe(1.5);
    expect(vector.features.laughterRate).toBe(0.5);
    expect(vector.features.noPunctRate).toBe(0.7);
  });
});

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const vector: PersonaFeatureVector = {
      personaId: 'a',
      features: { avgLength: 20, emojiRate: 0.3, latinShare: 0.4, bubblesPerTurn: 1.5, laughterRate: 0.5, noPunctRate: 0.7 }
    };

    expect(cosineSimilarity(vector, vector)).toBeCloseTo(1, 5);
  });

  it('returns 0 for orthogonal vectors', () => {
    const a: PersonaFeatureVector = {
      personaId: 'a',
      features: { avgLength: 1, emojiRate: 0, latinShare: 0, bubblesPerTurn: 0, laughterRate: 0, noPunctRate: 0 }
    };
    const b: PersonaFeatureVector = {
      personaId: 'b',
      features: { avgLength: 0, emojiRate: 1, latinShare: 0, bubblesPerTurn: 0, laughterRate: 0, noPunctRate: 0 }
    };

    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it('computes similarity for typical personas', () => {
    const a: PersonaFeatureVector = {
      personaId: 'a',
      features: { avgLength: 20, emojiRate: 0.3, latinShare: 0.4, bubblesPerTurn: 1.5, laughterRate: 0.5, noPunctRate: 0.7 }
    };
    const b: PersonaFeatureVector = {
      personaId: 'b',
      features: { avgLength: 25, emojiRate: 0.2, latinShare: 0.5, bubblesPerTurn: 1.8, laughterRate: 0.4, noPunctRate: 0.6 }
    };

    const sim = cosineSimilarity(a, b);
    expect(sim).toBeGreaterThan(0.9); // Similar personas
    expect(sim).toBeLessThan(1);
  });
});

describe('computePairwiseSimilarities', () => {
  it('computes all pairs and sorts ascending', () => {
    const personas: PersonaFeatureVector[] = [
      { personaId: 'a', features: { avgLength: 10, emojiRate: 0.1, latinShare: 0.2, bubblesPerTurn: 1.0, laughterRate: 0.3, noPunctRate: 0.5 } },
      { personaId: 'b', features: { avgLength: 11, emojiRate: 0.12, latinShare: 0.22, bubblesPerTurn: 1.1, laughterRate: 0.32, noPunctRate: 0.52 } },
      { personaId: 'c', features: { avgLength: 50, emojiRate: 0.8, latinShare: 0.9, bubblesPerTurn: 3.0, laughterRate: 0.1, noPunctRate: 0.1 } }
    ];

    const similarities = computePairwiseSimilarities(personas);

    expect(similarities).toHaveLength(3); // 3 choose 2 = 3
    expect(similarities[0].similarity).toBeLessThanOrEqual(similarities[1].similarity);
    expect(similarities[1].similarity).toBeLessThanOrEqual(similarities[2].similarity);
  });
});

describe('computeDistinctiveness', () => {
  it('assigns higher score to more unique personas', () => {
    const personas: PersonaFeatureVector[] = [
      { personaId: 'typical1', features: { avgLength: 20, emojiRate: 0.3, latinShare: 0.4, bubblesPerTurn: 1.5, laughterRate: 0.5, noPunctRate: 0.7 } },
      { personaId: 'typical2', features: { avgLength: 22, emojiRate: 0.32, latinShare: 0.42, bubblesPerTurn: 1.6, laughterRate: 0.52, noPunctRate: 0.72 } },
      { personaId: 'outlier', features: { avgLength: 100, emojiRate: 0.0, latinShare: 1.0, bubblesPerTurn: 5.0, laughterRate: 0.0, noPunctRate: 0.0 } }
    ];

    const distinctiveness = computeDistinctiveness(personas);

    // Outlier should be most distinctive
    expect(distinctiveness[0].personaId).toBe('outlier');
    expect(distinctiveness[0].distinctiveness).toBeGreaterThan(distinctiveness[1].distinctiveness);
  });
});

describe('computeFeatureVariance', () => {
  it('computes mean, variance, and CI', () => {
    const personas: PersonaFeatureVector[] = [
      { personaId: 'a', features: { avgLength: 10, emojiRate: 0.1, latinShare: 0.2, bubblesPerTurn: 1.0, laughterRate: 0.3, noPunctRate: 0.5 } },
      { personaId: 'b', features: { avgLength: 20, emojiRate: 0.2, latinShare: 0.3, bubblesPerTurn: 1.5, laughterRate: 0.4, noPunctRate: 0.6 } },
      { personaId: 'c', features: { avgLength: 30, emojiRate: 0.3, latinShare: 0.4, bubblesPerTurn: 2.0, laughterRate: 0.5, noPunctRate: 0.7 } }
    ];

    const result = computeFeatureVariance(personas, 'avgLength', 12345);

    expect(result.mean).toBe(20);
    expect(result.variance).toBeGreaterThan(0);
    expect(result.ci[0]).toBeLessThanOrEqual(result.mean);
    expect(result.ci[1]).toBeGreaterThanOrEqual(result.mean);
  });
});

describe('matchToPersona', () => {
  it('matches user profile to closest persona', () => {
    const personas: PersonaFeatureVector[] = [
      { personaId: 'short', features: { avgLength: 10, emojiRate: 0.1, latinShare: 0.1, bubblesPerTurn: 1.0, laughterRate: 0.2, noPunctRate: 0.5 } },
      { personaId: 'medium', features: { avgLength: 25, emojiRate: 0.3, latinShare: 0.4, bubblesPerTurn: 1.5, laughterRate: 0.5, noPunctRate: 0.7 } },
      { personaId: 'long', features: { avgLength: 60, emojiRate: 0.1, latinShare: 0.8, bubblesPerTurn: 1.2, laughterRate: 0.1, noPunctRate: 0.2 } }
    ];

    const userProfile = {
      avgLength: 26,
      emojiRate: 0.32,
      latinShare: 0.42,
      bubblesPerTurn: 1.6,
      laughterRate: 0.48
    };

    const matches = matchToPersona(userProfile, personas);

    expect(matches).toHaveLength(3);
    expect(matches[0].personaId).toBe('medium'); // Closest match
    expect(matches[0].similarity).toBeGreaterThan(matches[1].similarity);
  });
});
