'use client';

import { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Shield, Download, Trash2 } from 'lucide-react';
import {
  getAllAuditLogEntries,
  exportAuditLogAsJSON,
  exportAuditLogAsCSV,
  clearAuditLog,
  type AIAuditLogEntry,
} from '@/lib/ai/audit-log';

export default function AILogPage() {
  const [entries, setEntries] = useState<AIAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getAllAuditLogEntries();
        if (mounted) {
          setEntries(data.sort((a, b) => b.timestamp - a.timestamp));
        }
      } catch (error) {
        console.error('Failed to load audit log:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const handleExportJSON = async () => {
    const json = await exportAuditLogAsJSON();
    downloadFile(json, 'ai-audit-log.json', 'application/json');
  };

  const handleExportCSV = async () => {
    const csv = await exportAuditLogAsCSV();
    downloadFile(csv, 'ai-audit-log.csv', 'text/csv');
  };

  const handleClear = async () => {
    if (!confirm('Clear all audit log entries? This cannot be undone.')) return;

    await clearAuditLog();
    setEntries([]);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <Shield className="h-8 w-8 text-[--color-wechat-green]" />
                  <h1 className="text-4xl font-bold">AI Audit Log</h1>
                </div>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                  Transparency record of all AI interactions. Stored locally in your browser.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExportJSON}
                  disabled={entries.length === 0}
                  className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <Download className="h-4 w-4" />
                  JSON
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={entries.length === 0}
                  className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </button>
                <button
                  onClick={handleClear}
                  disabled={entries.length === 0}
                  className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </button>
              </div>
            </div>

            {loading ? (
              <div className="rounded-lg border bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-zinc-600 dark:text-zinc-400">Loading audit log...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-lg border bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <Shield className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
                <p className="text-zinc-600 dark:text-zinc-400">
                  No AI interactions recorded yet. Try the BYOK features to see entries here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'} recorded
                </div>

                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <div className="mb-1 font-semibold">{entry.feature}</div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-mono text-[--color-wechat-green]">
                          {entry.provider} / {entry.model}
                        </div>
                        <div className="text-zinc-500">
                          {entry.latency_ms}ms
                          {entry.usage && (
                            <>
                              {' '}
                              · {entry.usage.input_tokens}→{entry.usage.output_tokens} tokens
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">
                          Input:
                        </div>
                        <div className="rounded bg-zinc-50 p-3 font-mono text-xs dark:bg-zinc-900">
                          {entry.input.length > 200
                            ? entry.input.substring(0, 200) + '...'
                            : entry.input}
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">
                          Output:
                        </div>
                        <div className="rounded bg-zinc-50 p-3 font-mono text-xs dark:bg-zinc-900">
                          {entry.output.length > 200
                            ? entry.output.substring(0, 200) + '...'
                            : entry.output}
                        </div>
                      </div>

                      {entry.human_decision && (
                        <div>
                          <div className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">
                            Human Decision:
                          </div>
                          <div
                            className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                              entry.human_decision === 'accepted'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : entry.human_decision === 'edited'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {entry.human_decision}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info Box */}
            <div className="mt-8 rounded-lg border border-[--color-wechat-green]/30 bg-[--color-wechat-green]/5 p-6">
              <h3 className="mb-3 font-semibold">About This Log</h3>
              <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                <li>• Stored locally in IndexedDB (your browser). Never sent to our servers.</li>
                <li>
                  • API keys are NOT logged (only provider, model, and input/output text are
                  stored).
                </li>
                <li>• Export to JSON/CSV for your own records or analysis.</li>
                <li>• Clear anytime. This does not affect your API key settings.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
