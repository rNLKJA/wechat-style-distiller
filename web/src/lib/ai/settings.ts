/**
 * AI settings management (sessionStorage by default, localStorage opt-in)
 */

import type { AIProvider } from './client';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
  rememberKey: boolean;
}

const SESSION_KEY = 'wechat-distiller-ai-settings';
const LOCAL_KEY = 'wechat-distiller-ai-settings-persistent';

/**
 * Load AI settings from storage
 */
export function loadAISettings(): AISettings | null {
  // Try localStorage first (opt-in persistent)
  const persistent = localStorage.getItem(LOCAL_KEY);
  if (persistent) {
    try {
      return JSON.parse(persistent);
    } catch {
      localStorage.removeItem(LOCAL_KEY);
    }
  }

  // Fall back to sessionStorage
  const session = sessionStorage.getItem(SESSION_KEY);
  if (session) {
    try {
      return JSON.parse(session);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  return null;
}

/**
 * Save AI settings to storage
 */
export function saveAISettings(settings: AISettings): void {
  const data = JSON.stringify(settings);

  if (settings.rememberKey) {
    localStorage.setItem(LOCAL_KEY, data);
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    sessionStorage.setItem(SESSION_KEY, data);
    localStorage.removeItem(LOCAL_KEY);
  }
}

/**
 * Clear AI settings from all storage
 */
export function clearAISettings(): void {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LOCAL_KEY);
}

/**
 * Check if API key is configured
 */
export function hasAPIKey(): boolean {
  const settings = loadAISettings();
  return settings !== null && settings.apiKey.length > 0;
}
