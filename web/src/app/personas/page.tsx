import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { MessageSquare } from 'lucide-react';

const personas = [
  {
    id: 'bilingual_early_adopter',
    name: 'Bilingual Early Adopter',
    description: 'Tech-savvy, EN/ZH code-switching 40%, emoji-heavy, casual tone',
    avgLength: 25,
    codeSwitchRatio: 0.4,
    emojiRate: 0.3,
    style: 'casual_tech',
  },
  {
    id: 'concise_mandarin',
    name: 'Concise Mandarin',
    description: 'ZH only, short messages (8-15 chars), rare emoji, formal punctuation',
    avgLength: 12,
    codeSwitchRatio: 0.0,
    emojiRate: 0.05,
    style: 'formal_zh',
  },
  {
    id: 'expressive_english',
    name: 'Expressive English',
    description: 'EN only, long messages (40-80 chars), reaction emoji, casual punctuation',
    avgLength: 60,
    codeSwitchRatio: 1.0,
    emojiRate: 0.25,
    style: 'expressive_en',
  },
  {
    id: 'balanced_bilingual',
    name: 'Balanced Bilingual',
    description: 'EN/ZH 50/50, medium length, moderate emoji, professional tone',
    avgLength: 35,
    codeSwitchRatio: 0.5,
    emojiRate: 0.15,
    style: 'professional',
  },
  {
    id: 'emoji_enthusiast',
    name: 'Emoji Enthusiast',
    description: 'ZH primary, heavy emoji (50%+ messages), short bursts, playful',
    avgLength: 18,
    codeSwitchRatio: 0.1,
    emojiRate: 0.6,
    style: 'playful_zh',
  },
  {
    id: 'technical_researcher',
    name: 'Technical Researcher',
    description: 'EN-heavy code-switching, long analytical messages, minimal emoji, jargon',
    avgLength: 55,
    codeSwitchRatio: 0.7,
    emojiRate: 0.08,
    style: 'academic',
  },
];

export default function PersonasPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <h1 className="mb-4 text-4xl font-bold">Synthetic Persona Gallery</h1>
            <p className="mb-12 text-lg text-zinc-600 dark:text-zinc-400">
              Six pre-generated personas demonstrating diverse linguistic patterns. Each was created
              from 150+ synthetic messages and analyzed with the original pipeline.
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {personas.map((persona) => (
                <Link
                  key={persona.id}
                  href={`/personas/${persona.id}`}
                  className="group flex flex-col gap-4 rounded-lg border bg-white p-6 transition-all hover:border-[--color-wechat-green] hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-8 w-8 text-[--color-wechat-green]" />
                    <h2 className="text-xl font-semibold group-hover:text-[--color-wechat-green]">
                      {persona.name}
                    </h2>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{persona.description}</p>

                  <div className="mt-auto grid grid-cols-2 gap-3 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
                    <div>
                      <div className="text-xs text-zinc-500">Avg Length</div>
                      <div className="font-mono font-semibold">{persona.avgLength} chars</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Code-Switch</div>
                      <div className="font-mono font-semibold">
                        {(persona.codeSwitchRatio * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Emoji Rate</div>
                      <div className="font-mono font-semibold">
                        {persona.emojiRate.toFixed(2)}/msg
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Style</div>
                      <div className="truncate font-mono text-xs">{persona.style}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
