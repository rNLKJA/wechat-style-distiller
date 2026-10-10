import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { MessageSquare, Smile, Languages, Clock, Zap } from 'lucide-react';

const features = [
  {
    category: 'Message Shape',
    icon: MessageSquare,
    items: [
      {
        name: 'Length Distribution',
        description:
          'Mean, median, and percentiles (p25, p50, p75, p90). Captures if you write terse replies or long explanations.',
        example: 'Median 18 chars, p90 36 chars, max 120 chars',
      },
      {
        name: 'Bubble Bursts',
        description:
          'How often you send multiple messages in a row vs. one long message. Measured as bubbles per turn.',
        example: '1.5 bubbles/turn, 40% multi-bubble turns',
      },
      {
        name: 'Punctuation Habits',
        description:
          'Frequency of ellipsis, exclamation marks, question marks, tildes. Plus how often you skip end punctuation.',
        example: '70% of turns have no end punctuation',
      },
    ],
  },
  {
    category: 'Expressiveness',
    icon: Smile,
    items: [
      {
        name: 'Emoji Frequency',
        description:
          'Unicode emoji per turn, plus top emoji ranked by count. Includes WeChat-specific faces like [呲牙].',
        example: '0.3 emoji/turn. Top: 🤔(10), 👌(7), 💻(5)',
      },
      {
        name: 'Laughter Tokens',
        description:
          'Detects 哈哈, 呵呵, 233, lol, lmao, hhh patterns. Quantifies how often you laugh in text.',
        example: '0.46 laugh-tokens per turn',
      },
    ],
  },
  {
    category: 'Language',
    icon: Languages,
    items: [
      {
        name: 'Code-Switching Ratio',
        description:
          'Percentage of Latin words vs. CJK characters. Reveals EN/ZH mixing patterns and language dominance.',
        example: '40% code-switching (EN/ZH mixed)',
      },
      {
        name: 'Catchphrases',
        description:
          'Most-used phrases extracted via word/n-gram frequency. Surfaces your unique verbal tics.',
        example: 'Top: 哈哈(49), 一下(11), ok(9), push(10)',
      },
      {
        name: 'Openers & Closers',
        description:
          'First and last words of each turn. Reveals greeting patterns, conversation starters, sign-offs.',
        example: 'Opens: ok(9), 好的(8). Closes: 哈哈(18)',
      },
    ],
  },
  {
    category: 'Temporal & Contextual',
    icon: Clock,
    items: [
      {
        name: 'Active Hours',
        description: 'Time-of-day message distribution (UTC). Shows when you typically chat.',
        example: 'Peak: 2-4am UTC, 9-11pm UTC',
      },
      {
        name: 'Per-Contact Tone',
        description:
          'Average message length by contact. Longer + more formal with some people, shorter + casual with others.',
        example: 'Friend A: 20 chars/msg. Boss: 45 chars/msg',
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h1 className="mb-4 text-4xl font-bold">Linguistic Features</h1>
            <p className="mb-12 text-lg text-zinc-600 dark:text-zinc-400">
              12+ quantitative features extracted from your chat history. All computed locally with
              pure Python — no API calls.
            </p>

            <div className="space-y-12">
              {features.map((category) => (
                <section key={category.category}>
                  <div className="mb-6 flex items-center gap-3">
                    <category.icon className="h-6 w-6 text-[--color-wechat-green]" />
                    <h2 className="text-2xl font-bold">{category.category}</h2>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {category.items.map((item) => (
                      <div
                        key={item.name}
                        className="rounded-lg border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <h3 className="mb-2 text-lg font-semibold">{item.name}</h3>
                        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                          {item.description}
                        </p>
                        <div className="rounded bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                          {item.example}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* How Features Map to Prompts */}
            <section className="mt-16 rounded-lg border border-[--color-wechat-green]/30 bg-[--color-wechat-green]/5 p-8">
              <div className="mb-4 flex items-center gap-3">
                <Zap className="h-6 w-6 text-[--color-wechat-green]" />
                <h2 className="text-2xl font-bold">Feature → Prompt Mapping</h2>
              </div>

              <p className="mb-6 text-zinc-600 dark:text-zinc-400">
                Linguistic features are translated into LLM instructions in the persona prompt:
              </p>

              <div className="space-y-4">
                <MappingRow
                  feature="Median 18 chars, p90 36 chars"
                  arrow="→"
                  instruction="Keep replies short: median ~18 characters, rarely over 36"
                />
                <MappingRow
                  feature="40% code-switching, 21% Latin"
                  arrow="→"
                  instruction="About 21% of words are English; drop English words in naturally"
                />
                <MappingRow
                  feature="0.3 emoji/turn, top: 🤔👌💻"
                  arrow="→"
                  instruction="~0.3 emoji per message. Favourites: 🤔👌💻. Use sparingly."
                />
                <MappingRow
                  feature="1.5 bubbles/turn, 40% multi"
                  arrow="→"
                  instruction="Natural to send 1.5 short bubbles in a row (separate with newlines)"
                />
                <MappingRow
                  feature="70% no end punctuation"
                  arrow="→"
                  instruction="Often skip end punctuation"
                />
              </div>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function MappingRow({
  feature,
  arrow,
  instruction,
}: {
  feature: string;
  arrow: string;
  instruction: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <div className="shrink-0 rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900 sm:w-64">
        {feature}
      </div>
      <div className="hidden text-zinc-400 sm:block">{arrow}</div>
      <div className="flex-1 rounded border border-[--color-wechat-green]/30 bg-white px-3 py-2 text-xs dark:border-[--color-wechat-green]/20 dark:bg-zinc-900">
        {instruction}
      </div>
    </div>
  );
}
