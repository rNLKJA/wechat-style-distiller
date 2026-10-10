'use client';

import { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Sliders, Sparkles, Settings, AlertCircle } from 'lucide-react';
import { PERSONA_IDS } from '@/lib/persona-constants';
import { AISettingsDialog } from '@/components/ai/ai-settings-dialog';
import { loadAISettings, type AISettings } from '@/lib/ai/settings';
import { callAI, type AIMessage } from '@/lib/ai/client';
import { logAIInteraction } from '@/lib/ai/audit-log';
import type { Persona } from '@/lib/types';

interface TuningParams {
  formalityDelta: number; // -2 to +2
  emojiDelta: number; // -2 to +2
  verbosityDelta: number; // -2 to +2
}

const TEST_PROMPTS = ['How was your day?', 'What are you working on?', 'Want to grab lunch?'];

export default function PersonaTunerPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [aiSettings, setAISettings] = useState<AISettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tuningParams, setTuningParams] = useState<TuningParams>({
    formalityDelta: 0,
    emojiDelta: 0,
    verbosityDelta: 0,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [beforeResponses, setBeforeResponses] = useState<string[]>([]);
  const [afterResponses, setAfterResponses] = useState<string[]>([]);
  const [tunedPrompt, setTunedPrompt] = useState<string>('');
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

  const buildTunedPrompt = (basePrompt: string, params: TuningParams): string => {
    let additions = '\n\n# Style Adjustments\n';

    if (params.formalityDelta !== 0) {
      if (params.formalityDelta > 0) {
        additions += `- Increase formality by ${params.formalityDelta} level(s): Use more complete sentences, reduce slang, add polite markers.\n`;
      } else {
        additions += `- Decrease formality by ${Math.abs(params.formalityDelta)} level(s): Use more casual language, contractions, and colloquialisms.\n`;
      }
    }

    if (params.emojiDelta !== 0) {
      if (params.emojiDelta > 0) {
        additions += `- Increase emoji usage by ${params.emojiDelta} level(s): Add ${params.emojiDelta * 2}x more emoji than baseline.\n`;
      } else {
        additions += `- Decrease emoji usage by ${Math.abs(params.emojiDelta)} level(s): Use ${Math.abs(params.emojiDelta) * 50}% fewer emoji.\n`;
      }
    }

    if (params.verbosityDelta !== 0) {
      if (params.verbosityDelta > 0) {
        additions += `- Increase verbosity by ${params.verbosityDelta} level(s): Write ${params.verbosityDelta * 50}% longer messages with more detail.\n`;
      } else {
        additions += `- Decrease verbosity by ${Math.abs(params.verbosityDelta)} level(s): Write ${Math.abs(params.verbosityDelta) * 30}% shorter, more concise messages.\n`;
      }
    }

    return additions === '\n\n# Style Adjustments\n' ? basePrompt : basePrompt + additions;
  };

  const handleGenerate = async () => {
    if (!selectedPersona || !aiSettings) return;

    setIsGenerating(true);
    setError(null);
    setBeforeResponses([]);
    setAfterResponses([]);

    const tuned = buildTunedPrompt(selectedPersona.prompt, tuningParams);
    setTunedPrompt(tuned);

    try {
      // Generate "before" responses
      const beforeResults: string[] = [];
      for (const prompt of TEST_PROMPTS) {
        const messages: AIMessage[] = [
          { role: 'user', content: selectedPersona.prompt },
          { role: 'user', content: prompt },
        ];

        const startTime = Date.now();
        const result = await callAI(messages, aiSettings);
        const latency = Date.now() - startTime;

        beforeResults.push(result.content);

        await logAIInteraction({
          feature: 'Persona Tuner (Before)',
          provider: aiSettings.provider,
          model: aiSettings.model,
          input: `Persona: ${selectedPersona.metadata.name} | Prompt: "${prompt}"`,
          output: result.content,
          latency_ms: latency,
          usage: result.usage,
          human_decision: 'accepted',
        });
      }
      setBeforeResponses(beforeResults);

      // Generate "after" responses
      const afterResults: string[] = [];
      for (const prompt of TEST_PROMPTS) {
        const messages: AIMessage[] = [
          { role: 'user', content: tuned },
          { role: 'user', content: prompt },
        ];

        const startTime = Date.now();
        const result = await callAI(messages, aiSettings);
        const latency = Date.now() - startTime;

        afterResults.push(result.content);

        await logAIInteraction({
          feature: 'Persona Tuner (After)',
          provider: aiSettings.provider,
          model: aiSettings.model,
          input: `Tuned Persona: ${selectedPersona.metadata.name} | Prompt: "${prompt}"`,
          output: result.content,
          latency_ms: latency,
          usage: result.usage,
          human_decision: 'accepted',
        });
      }
      setAfterResponses(afterResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const hasAPIKey = aiSettings !== null && aiSettings.apiKey.length > 0;
  const hasChanges =
    tuningParams.formalityDelta !== 0 ||
    tuningParams.emojiDelta !== 0 ||
    tuningParams.verbosityDelta !== 0;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <Sliders className="h-8 w-8 text-[--color-wechat-green]" />
                  <h1 className="text-4xl font-bold">Persona Tuner</h1>
                </div>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                  Adjust persona parameters interactively and compare before/after responses.
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
                  locally and never sent to our servers.
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
            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              {/* Persona Selection */}
              <div>
                <label htmlFor="persona-select" className="mb-2 block text-sm font-medium">
                  Base Persona
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

              {/* Tuning Parameters */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Adjustments</h3>

                <div>
                  <label className="mb-1 flex items-center justify-between text-xs">
                    <span>Formality</span>
                    <span className="font-mono text-zinc-500">
                      {tuningParams.formalityDelta > 0 && '+'}
                      {tuningParams.formalityDelta}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="1"
                    value={tuningParams.formalityDelta}
                    onChange={(e) =>
                      setTuningParams({ ...tuningParams, formalityDelta: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                  <div className="mt-1 flex justify-between text-xs text-zinc-500">
                    <span>Casual</span>
                    <span>Formal</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 flex items-center justify-between text-xs">
                    <span>Emoji Usage</span>
                    <span className="font-mono text-zinc-500">
                      {tuningParams.emojiDelta > 0 && '+'}
                      {tuningParams.emojiDelta}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="1"
                    value={tuningParams.emojiDelta}
                    onChange={(e) =>
                      setTuningParams({ ...tuningParams, emojiDelta: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                  <div className="mt-1 flex justify-between text-xs text-zinc-500">
                    <span>Fewer</span>
                    <span>More</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 flex items-center justify-between text-xs">
                    <span>Verbosity</span>
                    <span className="font-mono text-zinc-500">
                      {tuningParams.verbosityDelta > 0 && '+'}
                      {tuningParams.verbosityDelta}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="1"
                    value={tuningParams.verbosityDelta}
                    onChange={(e) =>
                      setTuningParams({ ...tuningParams, verbosityDelta: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                  <div className="mt-1 flex justify-between text-xs text-zinc-500">
                    <span>Concise</span>
                    <span>Detailed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="mb-8">
              <button
                onClick={handleGenerate}
                disabled={!hasAPIKey || !hasChanges || isGenerating}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[--color-wechat-green] px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>Generating responses...</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Before/After Comparison
                  </>
                )}
              </button>
              {!hasChanges && hasAPIKey && (
                <p className="mt-2 text-center text-sm text-zinc-500">
                  Adjust at least one parameter to generate
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-8 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            {/* Comparison Results */}
            {beforeResponses.length > 0 && afterResponses.length > 0 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold">Before/After Comparison</h2>

                {TEST_PROMPTS.map((prompt, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="mb-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Test prompt: &quot;{prompt}&quot;
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                          <div className="h-2 w-2 rounded-full bg-zinc-400" />
                          Before
                        </div>
                        <div className="rounded-lg bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
                          {beforeResponses[idx]}
                        </div>
                        <div className="mt-2 text-xs text-zinc-500">
                          {beforeResponses[idx].length} chars
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                          <div className="h-2 w-2 rounded-full bg-[--color-wechat-green]" />
                          After (Tuned)
                        </div>
                        <div className="rounded-lg bg-[--color-wechat-green]/5 p-4 text-sm">
                          {afterResponses[idx]}
                        </div>
                        <div className="mt-2 text-xs text-zinc-500">
                          {afterResponses[idx].length} chars
                          <span className="ml-2">
                            ({afterResponses[idx].length > beforeResponses[idx].length ? '+' : ''}
                            {afterResponses[idx].length - beforeResponses[idx].length})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Tuned Prompt */}
                <div>
                  <h3 className="mb-4 text-xl font-bold">Tuned Prompt</h3>
                  <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                    The modified persona prompt with your adjustments applied:
                  </p>
                  <div className="rounded-lg border bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
                    <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed">
                      {tunedPrompt}
                    </pre>
                  </div>
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
