import type { Persona, PersonaMetadata, PersonaStats } from './types';
import { promises as fs } from 'fs';
import path from 'path';

// Re-export from constants file to avoid breaking existing imports
export { PERSONA_IDS } from './persona-constants';
export type { PersonaId } from './persona-constants';

import type { PersonaId } from './persona-constants';
import { PERSONA_IDS as PERSONA_IDS_CONST } from './persona-constants';

/**
 * Load a persona's data from the public directory.
 * Uses file system for SSG, fetch for client-side.
 */
export async function loadPersona(id: PersonaId): Promise<Persona> {
  const basePath = path.join(process.cwd(), 'public', 'data', 'personas', id);

  const [metadata, stats, profile, prompt] = await Promise.all([
    fs
      .readFile(path.join(basePath, 'metadata.json'), 'utf-8')
      .then(JSON.parse) as Promise<PersonaMetadata>,
    fs
      .readFile(path.join(basePath, 'stats.json'), 'utf-8')
      .then(JSON.parse) as Promise<PersonaStats>,
    fs.readFile(path.join(basePath, 'profile.md'), 'utf-8'),
    fs.readFile(path.join(basePath, 'persona_prompt.txt'), 'utf-8'),
  ]);

  return { metadata, stats, profile, prompt };
}

/**
 * Load all persona metadata (lightweight, for gallery views).
 */
export async function loadAllPersonaMetadata(): Promise<PersonaMetadata[]> {
  const results = await Promise.all(
    PERSONA_IDS_CONST.map(async (id) => {
      const filePath = path.join(process.cwd(), 'public', 'data', 'personas', id, 'metadata.json');
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as PersonaMetadata;
    })
  );
  return results;
}
