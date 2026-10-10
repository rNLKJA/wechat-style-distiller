import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { ArrowRight, Download, FileCode, MessageSquare, BarChart } from 'lucide-react';

const stages = [
  {
    id: 1,
    name: 'Extract',
    icon: Download,
    description: 'Read WeChat chat history using the chatlog tool',
    input: 'WeChat database (encrypted)',
    output: 'Raw message JSON',
    details: [
      'Delegates decryption to the chatlog CLI tool (MIT licensed)',
      'Extracts messages, timestamps, contacts, group flags',
      'Filters for YOUR messages only (context → your reply pairs)',
    ],
  },
  {
    id: 2,
    name: 'Clean',
    icon: FileCode,
    description: 'Normalize and structure conversation turns',
    input: 'Raw messages',
    output: 'Turn objects (context + reply)',
    details: [
      'Groups consecutive messages into "bubble bursts"',
      'Associates each reply with its conversational context',
      'Preserves metadata: contact, group/1:1, timestamp',
    ],
  },
  {
    id: 3,
    name: 'Analyze',
    icon: BarChart,
    description: 'Extract quantitative linguistic features',
    input: 'Structured turns',
    output: 'stats.json',
    details: [
      'Message length distribution (mean, median, percentiles)',
      'Emoji & WeChat face frequency, laughter tokens',
      'Code-switching ratio (Chinese ↔ English)',
      'Punctuation habits, catchphrases, opener/closer patterns',
      'Time-of-day activity, per-contact tone differences',
      'Pure Python, no API calls',
    ],
  },
  {
    id: 4,
    name: 'Distill',
    icon: MessageSquare,
    description: 'Generate human-readable profile and persona prompt',
    input: 'stats.json',
    output: 'profile.md, persona_prompt.txt',
    details: [
      'profile.md: Human-readable style report with examples',
      'persona_prompt.txt: System prompt encoding your voice',
      'Maps linguistic features to LLM instructions',
      'Includes few-shot examples from your actual messages',
    ],
  },
];

export default function PipelinePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-4 text-4xl font-bold">Pipeline Architecture</h1>
            <p className="mb-12 text-lg text-zinc-600 dark:text-zinc-400">
              Four-stage pipeline: Extract → Clean → Analyze → Distill. Each stage is pure Python
              with no API calls except the optional chatbot.
            </p>

            <div className="space-y-12">
              {stages.map((stage, idx) => (
                <div key={stage.id}>
                  <div className="flex items-start gap-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[--color-wechat-green]/10 text-[--color-wechat-green]">
                      <stage.icon className="h-8 w-8" />
                    </div>

                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                          Stage {stage.id}
                        </span>
                        <h2 className="text-2xl font-bold">{stage.name}</h2>
                      </div>

                      <p className="mb-4 text-zinc-600 dark:text-zinc-400">{stage.description}</p>

                      <div className="mb-4 flex items-center gap-4 text-sm">
                        <div className="rounded border border-zinc-300 bg-zinc-50 px-3 py-1 font-mono dark:border-zinc-700 dark:bg-zinc-900">
                          {stage.input}
                        </div>
                        <ArrowRight className="h-4 w-4 text-zinc-400" />
                        <div className="rounded border border-[--color-wechat-green]/30 bg-[--color-wechat-green]/10 px-3 py-1 font-mono text-[--color-wechat-green]">
                          {stage.output}
                        </div>
                      </div>

                      <ul className="space-y-2">
                        {stage.details.map((detail, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[--color-wechat-green]" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {idx < stages.length - 1 && (
                    <div className="ml-8 mt-6 h-8 w-px bg-zinc-300 dark:bg-zinc-700" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-16 rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 font-semibold">Example: 500 messages → Style Profile</h3>
              <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <p>
                  <strong className="text-zinc-900 dark:text-zinc-100">Input:</strong> 500 of your
                  WeChat messages across 20 contacts
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-zinc-100">Extract:</strong> 500 raw
                  message objects with timestamps
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-zinc-100">Clean:</strong> 320 turns
                  (context → reply pairs)
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-zinc-100">Analyze:</strong> 12
                  linguistic features quantified (median length 18 chars, 40% code-switching, 0.3
                  emoji/turn...)
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-zinc-100">Distill:</strong> 1
                  profile.md + 1 persona_prompt.txt ready to use
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
