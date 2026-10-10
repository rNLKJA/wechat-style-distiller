/**
 * AI audit logging for transparency and compliance
 * Stores all AI interactions client-side in IndexedDB
 */

export interface AIAuditLogEntry {
  id: string;
  timestamp: number;
  feature: string;
  provider: 'anthropic' | 'openai';
  model: string;
  input: string;
  output: string;
  latency_ms: number;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  human_decision?: 'accepted' | 'edited' | 'rejected';
}

const DB_NAME = 'wechat-style-distiller-audit';
const STORE_NAME = 'ai_audit_log';
const DB_VERSION = 1;

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('feature', 'feature', { unique: false });
      }
    };
  });
}

/**
 * Add entry to audit log
 */
export async function addAuditLogEntry(entry: AIAuditLogEntry): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(entry);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get all audit log entries
 */
export async function getAllAuditLogEntries(): Promise<AIAuditLogEntry[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as AIAuditLogEntry[]);
  });
}

/**
 * Update human decision for an entry
 */
export async function updateHumanDecision(
  id: string,
  decision: 'accepted' | 'edited' | 'rejected'
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const entry = getRequest.result as AIAuditLogEntry;
      if (entry) {
        entry.human_decision = decision;
        const updateRequest = store.put(entry);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      } else {
        reject(new Error(`Entry ${id} not found`));
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Clear all audit log entries
 */
export async function clearAuditLog(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Export audit log as JSON
 */
export async function exportAuditLogAsJSON(): Promise<string> {
  const entries = await getAllAuditLogEntries();
  return JSON.stringify(entries, null, 2);
}

/**
 * Export audit log as CSV
 */
export async function exportAuditLogAsCSV(): Promise<string> {
  const entries = await getAllAuditLogEntries();

  if (entries.length === 0) {
    return 'id,timestamp,feature,provider,model,latency_ms,input_tokens,output_tokens,human_decision\n';
  }

  const headers =
    'id,timestamp,feature,provider,model,latency_ms,input_tokens,output_tokens,human_decision\n';
  const rows = entries
    .map((e) => {
      const timestamp = new Date(e.timestamp).toISOString();
      const inputTokens = e.usage?.input_tokens ?? '';
      const outputTokens = e.usage?.output_tokens ?? '';
      const decision = e.human_decision ?? '';

      return `${e.id},"${timestamp}","${e.feature}","${e.provider}","${e.model}",${e.latency_ms},${inputTokens},${outputTokens},"${decision}"`;
    })
    .join('\n');

  return headers + rows;
}
