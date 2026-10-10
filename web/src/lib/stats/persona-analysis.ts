/**
 * Statistical analysis for persona comparison and validation
 */

import type { PersonaStats } from '../types';
import { bootstrapCI, stats } from './confidence-intervals';

export interface PersonaFeatureVector {
  personaId: string;
  features: {
    avgLength: number;
    emojiRate: number;
    latinShare: number;
    bubblesPerTurn: number;
    laughterRate: number;
    noPunctRate: number;
  };
}

/**
 * Extract feature vector from persona stats
 */
export function extractFeatures(personaId: string, stats: PersonaStats): PersonaFeatureVector {
  return {
    personaId,
    features: {
      avgLength: stats.length.mean,
      emojiRate: stats.emoji.unicode_per_turn,
      latinShare: stats.code_switching.latin_share,
      bubblesPerTurn: stats.bubbles_per_turn.mean,
      laughterRate: stats.laughter_per_turn,
      noPunctRate: stats.punctuation.no_end_punct_turns / stats.n_turns
    }
  };
}

/**
 * Compute cosine similarity between two feature vectors
 */
export function cosineSimilarity(a: PersonaFeatureVector, b: PersonaFeatureVector): number {
  const featuresA = Object.values(a.features);
  const featuresB = Object.values(b.features);

  const dotProduct = featuresA.reduce((sum, val, i) => sum + val * featuresB[i], 0);
  const magnitudeA = Math.sqrt(featuresA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(featuresB.reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Compute pairwise similarities for all personas
 */
export function computePairwiseSimilarities(
  personas: PersonaFeatureVector[]
): Array<{ personaA: string; personaB: string; similarity: number }> {
  const results: Array<{ personaA: string; personaB: string; similarity: number }> = [];

  for (let i = 0; i < personas.length; i++) {
    for (let j = i + 1; j < personas.length; j++) {
      const similarity = cosineSimilarity(personas[i], personas[j]);
      results.push({
        personaA: personas[i].personaId,
        personaB: personas[j].personaId,
        similarity
      });
    }
  }

  return results.sort((a, b) => a.similarity - b.similarity);
}

/**
 * Compute distinctiveness score for each persona
 * Higher score = more unique linguistic profile
 */
export function computeDistinctiveness(
  personas: PersonaFeatureVector[]
): Array<{ personaId: string; distinctiveness: number }> {
  return personas.map(persona => {
    const similarities = personas
      .filter(other => other.personaId !== persona.personaId)
      .map(other => cosineSimilarity(persona, other));

    // Distinctiveness = 1 - average similarity to others
    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    const distinctiveness = 1 - avgSimilarity;

    return { personaId: persona.personaId, distinctiveness };
  }).sort((a, b) => b.distinctiveness - a.distinctiveness);
}

/**
 * Compute inter-persona variance for each feature
 * Returns variance and confidence interval
 */
export function computeFeatureVariance(
  personas: PersonaFeatureVector[],
  featureName: keyof PersonaFeatureVector['features'],
  seed: number = 42
): { mean: number; variance: number; ci: [number, number] } {
  const values = personas.map(p => p.features[featureName]);

  const mean = stats.mean(values);
  const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
  const ci = bootstrapCI(values, stats.mean, 1000, 0.95, seed);

  return { mean, variance, ci };
}

/**
 * Compute feature correlation matrix
 */
export function computeFeatureCorrelations(
  personas: PersonaFeatureVector[]
): Record<string, Record<string, number>> {
  const featureNames = Object.keys(personas[0].features) as Array<keyof PersonaFeatureVector['features']>;
  const correlations: Record<string, Record<string, number>> = {};

  for (const feature1 of featureNames) {
    correlations[feature1] = {};

    for (const feature2 of featureNames) {
      const values1 = personas.map(p => p.features[feature1]);
      const values2 = personas.map(p => p.features[feature2]);

      correlations[feature1][feature2] = pearsonCorrelation(values1, values2);
    }
  }

  return correlations;
}

/**
 * Pearson correlation coefficient
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const meanX = stats.mean(x);
  const meanY = stats.mean(y);

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  if (denomX === 0 || denomY === 0) return 0;

  return numerator / Math.sqrt(denomX * denomY);
}

/**
 * Match user input to closest persona
 */
export interface UserProfile {
  avgLength: number;
  emojiRate: number;
  latinShare: number;
  bubblesPerTurn: number;
  laughterRate: number;
}

export function matchToPersona(
  userProfile: UserProfile,
  personas: PersonaFeatureVector[]
): Array<{ personaId: string; distance: number; similarity: number }> {
  const userVector: PersonaFeatureVector = {
    personaId: 'user',
    features: {
      ...userProfile,
      noPunctRate: 0.5 // Default assumption
    }
  };

  return personas
    .map(persona => {
      const similarity = cosineSimilarity(userVector, persona);
      const distance = euclideanDistance(userVector, persona);

      return { personaId: persona.personaId, distance, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Euclidean distance in normalized feature space
 */
function euclideanDistance(a: PersonaFeatureVector, b: PersonaFeatureVector): number {
  const featuresA = Object.values(a.features);
  const featuresB = Object.values(b.features);

  const sumSquares = featuresA.reduce((sum, val, i) => sum + (val - featuresB[i]) ** 2, 0);
  return Math.sqrt(sumSquares);
}
