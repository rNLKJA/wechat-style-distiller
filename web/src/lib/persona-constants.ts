/**
 * Persona constants - safe for client-side import
 */

export const PERSONA_IDS = [
  'bilingual_early_adopter',
  'concise_mandarin',
  'expressive_english',
  'balanced_bilingual',
  'emoji_enthusiast',
  'technical_researcher',
] as const;

export type PersonaId = (typeof PERSONA_IDS)[number];
