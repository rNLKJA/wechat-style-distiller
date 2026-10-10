'use client';

import { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Sparkles, Play, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { PERSONA_IDS } from '@/lib/persona-constants';
import { AISettingsDialog } from '@/components/ai/ai-settings-dialog';
import { loadAISettings, type AISettings } from '@/lib/ai/settings';
import { callAI, type AIMessage } from '@/lib/ai/client';
import { logAIInteraction } from '@/lib/ai/audit-log';
import type { Persona, PersonaStats } from '@/lib/types';
import { bootstrapCI, stats } from '@/lib/stats/confidence-intervals';

const TEST_PROMPT = 'How was your day?';
const NUM_RESPONSES = 10;

interface IndividualAnalysis {
  avgLength: number;
  emojiCount: number;
  latinRatio: number;
  hasLaughter: boolean;
}

interface ResponseAnalysis {
  avgLength: number;
  avgLengthCI: [number, number];
  emojiCount: number;
  emojiCountCI: [number, number];
  latinRatio: number;
  latinRatioCI: [number, number];
  laughterRate: number;
}

export default function PromptEffectivenessPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [aiSettings, setAISettings] = useState<AISettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [responses, setResponses] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<ResponseAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Fetch personas from API to avoid fs import in client
    Promise.all(
      PERSONA_IDS.map(async (id) => {
        const res = await fetch(`/data/personas/${id}/metadata.json`);
        const metadata = await res.json();
        const statsRes = await fetch(`/data/personas/${id}/stats.json`);
        const stats = await statsRes.json();
        const profileRes = await fetch(`/data/personas/${id}/profile.md`);
        const profile = await profileRes.text();
        const promptRes = await fetch(`/data/personas/${id}/persona_prompt.txt`);
        const prompt = await promptRes.text();
        return { metadata, stats, profile, prompt };
      })
    ).then((loaded) => {
      if (isMounted) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPersonas(loaded);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedPersonaId(PERSONA_IDS[0]);
      }
    });

    const settings = loadAISettings();
    if (isMounted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAISettings(settings);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedPersona = personas.find((p) => p.metadata.id === selectedPersonaId);

  const analyzeResponse = (text: string): IndividualAnalysis => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu;
    const latinRegex = /[a-zA-Z]+/g;
    const laughterRegex = /(哈哈|haha|lol|233|hhh|笑)/gi;

    const emojiCount = (text.match(emojiRegex) || []).length;
    const latinWords = text.match(latinRegex) || [];
    const totalChars = text.length;
    const latinChars = latinWords.join('').length;
    const latinRatio = totalChars > 0 ? latinChars / totalChars : 0;
    const hasLaughter = laughterRegex.test(text);

    return {
      avgLength: text.length,
      emojiCount,
      latinRatio,
      hasLaughter,
    };
  };

  const handleGenerate = async () => {
    if (!selectedPersona || !aiSettings) return;

    setIsGenerating(true);
    setError(null);
    setResponses([]);
    setAnalysis(null);

    const generatedResponses: string[] = [];
    const analyses: IndividualAnalysis[] = [];

    try {
      for (let i = 0; i < NUM_RESPONSES; i++) {
        const messages: AIMessage[] = [
          { role: 'user', content: selectedPersona.prompt },
          { role: 'user', content: TEST_PROMPT },
        ];

        const startTime = Date.now();
        const result = await callAI(messages, aiSettings);
        const latency = Date.now() - startTime;

        generatedResponses.push(result.content);
        analyses.push(analyzeResponse(result.content));

        // Log to audit trail
        await logAIInteraction({
          feature: 'Prompt Effectiveness Test',
          provider: aiSettings.provider,
          model: aiSettings.model,
          input: `Persona: ${selectedPersona.metadata.name} | Prompt: "${TEST_PROMPT}"`,
          output: result.content,
          latency_ms: latency,
          usage: result.usage,
          human_decision: 'accepted',
        });

        // Update UI incrementally
        setResponses([...generatedResponses]);
      }

      // Compute aggregate analysis with bootstrap confidence intervals
      const lengths = analyses.map((a) => a.avgLength || 0);
      const emojis = analyses.map((a) => a.emojiCount || 0);
      const latins = analyses.map((a) => a.latinRatio || 0);
      const laughterCount = analyses.filter((a) => a.hasLaughter).length;

      // Bootstrap CIs for continuous metrics (1000 resamples, seed for reproducibility)
      const lengthCI = bootstrapCI(lengths, stats.mean, 1000, 0.95, 42);
      const emojiCI = bootstrapCI(emojis, stats.mean, 1000, 0.95, 43);
      const latinCI = bootstrapCI(latins, stats.mean, 1000, 0.95, 44);

      setAnalysis({
        avgLength: stats.mean(lengths),
        avgLengthCI: lengthCI,
        emojiCount: stats.mean(emojis),
        emojiCountCI: emojiCI,
        latinRatio: stats.mean(latins),
        latinRatioCI: latinCI,
        laughterRate: laughterCount / NUM_RESPONSES,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const hasAPIKey = aiSettings !== null && aiSettings.apiKey.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-[--color-wechat-green]" />
                  <h1 className="text-4xl font-bold">Prompt Effectiveness</h1>
                </div>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                  Test persona prompts by generating multiple responses and analyzing linguistic
                  consistency.
                </p>
              </div>

              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                <Settings className="h-4 w-4" />
                AI Settings
              </button>
            </div>

            {/* BYOK Notice */}
            {!hasAPIKey && (
              <div className="mb-8 rounded-lg border border-yellow-300 bg-yellow-50 p-6 dark:border-yellow-900 dark:bg-yellow-950">
                <div className="mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                    API Key Required
                  </h3>
                </div>
                <p className="mb-4 text-sm text-yellow-800 dark:text-yellow-300">
                  This feature requires your own API key (Anthropic or OpenAI). Your key is stored
                  locally and never sent to our servers. Click AI Settings to configure.
                </p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-yellow-700"
                >
                  Configure API Key
                </button>
              </div>
            )}

            {/* Controls */}
            <div className="mb-8 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="persona-select" className="mb-2 block text-sm font-medium">
                  Select Persona
                </label>
                <select
                  id="persona-select"
                  value={selectedPersonaId}
                  onChange={(e) => setSelectedPersonaId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {personas.map((p) => (
                    <option key={p.metadata.id} value={p.metadata.id}>
                      {p.metadata.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGenerate}
                  disabled={!hasAPIKey || isGenerating}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[--color-wechat-green] px-6 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      Generating {responses.length}/{NUM_RESPONSES}...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Generate {NUM_RESPONSES} Responses
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-8 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            {/* Analysis Results */}
            {analysis && selectedPersona && (
              <div className="mb-8 rounded-lg border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[--color-wechat-green]" />
                  <h2 className="text-xl font-bold">Consistency Analysis</h2>
                </div>

                <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                  Comparing generated responses (n={NUM_RESPONSES}) to persona profile:
                </p>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <MetricComparison
                    label="Avg Message Length"
                    target={selectedPersona.stats.length.mean}
                    actual={analysis.avgLength}
                    ci={analysis.avgLengthCI}
                    unit="chars"
                  />
                  <MetricComparison
                    label="Emoji Rate"
                    target={selectedPersona.stats.emoji.unicode_per_turn}
                    actual={analysis.emojiCount}
                    ci={analysis.emojiCountCI}
                    unit="/msg"
                  />
                  <MetricComparison
                    label="Latin Share"
                    target={selectedPersona.stats.code_switching.latin_share * 100}
                    actual={analysis.latinRatio * 100}
                    ci={[analysis.latinRatioCI[0] * 100, analysis.latinRatioCI[1] * 100]}
                    unit="%"
                  />
                  <MetricComparison
                    label="Laughter Rate"
                    target={selectedPersona.stats.laughter_per_turn}
                    actual={analysis.laughterRate}
                    unit="/msg"
                  />
                </div>

                <div className="mt-6 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  <p className="font-medium">Interpretation:</p>
                  <p className="mt-2">
                    Generated responses show{' '}
                    {Math.abs(analysis.avgLength - selectedPersona.stats.length.mean) <
                    selectedPersona.stats.length.mean * 0.3
                      ? 'strong'
                      : 'moderate'}{' '}
                    consistency with the persona&apos;s linguistic profile. Differences are expected
                    due to LLM variability and the single test prompt.
                  </p>
                </div>
              </div>
            )}

            {/* Generated Responses */}
            {responses.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold">Generated Responses</h2>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  Test prompt: &quot;{TEST_PROMPT}&quot;
                </p>

                <div className="space-y-3">
                  {responses.map((response, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="mb-2 text-xs font-medium text-zinc-500">
                        Response {idx + 1}
                      </div>
                      <div className="text-sm">{response}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />

      <AISettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsChange={setAISettings}
      />
    </div>
  );
}

function MetricComparison({
  label,
  target,
  actual,
  unit,
  ci,
}: {
  label: string;
  target: number;
  actual: number;
  unit: string;
  ci?: [number, number];
}) {
  const diff = actual - target;
  const percentDiff = target !== 0 ? (diff / target) * 100 : 0;
  const isClose = Math.abs(percentDiff) < 30;

  return (
    <div className="rounded-lg border bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</div>
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-xl font-bold">{actual.toFixed(1)}</span>
        <span className="text-sm text-zinc-500">{unit}</span>
      </div>
      {ci && (
        <div className="mb-1 text-xs text-zinc-500">
          95% CI: [{ci[0].toFixed(1)}, {ci[1].toFixed(1)}]
        </div>
      )}
      <div className="text-xs text-zinc-500">
        Target: {target.toFixed(1)} {unit}
      </div>
      <div
        className={`mt-2 text-xs font-medium ${
          isClose ? 'text-[--color-wechat-green]' : 'text-zinc-600 dark:text-zinc-400'
        }`}
      >
        {diff > 0 ? '+' : ''}
        {percentDiff.toFixed(0)}%
      </div>
    </div>
  );
}
