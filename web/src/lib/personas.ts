import type { Persona, PersonaMetadata, PersonaStats } from './types';

// List of all available personas (must match generated data)
export const PERSONA_IDS = [
  'bilingual_early_adopter',
  'concise_mandarin',
  'expressive_english',
  'balanced_bilingual',
  'emoji_enthusiast',
  'technical_researcher',
] as const;

export type PersonaId = (typeof PERSONA_IDS)[number];

/**
 * Load a persona's data from the public directory.
 * This runs server-side only (no direct FS access in browser).
 */
export async function loadPersona(id: PersonaId): Promise<Persona> {
  const basePath = `/data/personas/${id}`;

  const [metadata, stats, profile, prompt] = await Promise.all([
    fetch(`${basePath}/metadata.json`).then((r) => r.json() as Promise<PersonaMetadata>),
    fetch(`${basePath}/stats.json`).then((r) => r.json() as Promise<PersonaStats>),
    fetch(`${basePath}/profile.md`).then((r) => r.text()),
    fetch(`${basePath}/persona_prompt.txt`).then((r) => r.text()),
  ]);

  return { metadata, stats, profile, prompt };
}

/**
 * Load all persona metadata (lightweight, for gallery views).
 */
export async function loadAllPersonaMetadata(): Promise<PersonaMetadata[]> {
  const results = await Promise.all(
    PERSONA_IDS.map((id) =>
      fetch(`/data/personas/${id}/metadata.json`).then((r) => r.json() as Promise<PersonaMetadata>)
    )
  );
  return results;
}
