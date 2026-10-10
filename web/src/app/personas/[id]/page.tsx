import { notFound } from 'next/navigation';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { PERSONA_IDS } from '@/lib/personas';
import type { PersonaStats, PersonaMetadata } from '@/lib/types';
import { BarChart3, MessageSquare, Clock } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadPersonaData(id: string) {
  try {
    const basePath = join(process.cwd(), 'public', 'data', 'personas', id);

    const metadata = JSON.parse(
      readFileSync(join(basePath, 'metadata.json'), 'utf8')
    ) as PersonaMetadata;
    const stats = JSON.parse(readFileSync(join(basePath, 'stats.json'), 'utf8')) as PersonaStats;
    const profile = readFileSync(join(basePath, 'profile.md'), 'utf8');
    const prompt = readFileSync(join(basePath, 'persona_prompt.txt'), 'utf8');

    return { metadata, stats, profile, prompt };
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  return PERSONA_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const data = await loadPersonaData(id);

  if (!data) {
    return {
      title: 'Persona Not Found',
    };
  }

  return {
    title: `${data.metadata.name} — WeChat Style Distiller`,
    description: data.metadata.description,
  };
}

export default async function PersonaDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!PERSONA_IDS.includes(id as (typeof PERSONA_IDS)[number])) {
    notFound();
  }

  const data = await loadPersonaData(id);

  if (!data) {
    notFound();
  }

  const { metadata, stats, profile, prompt } = data;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="mb-3 text-4xl font-bold">{metadata.name}</h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">{metadata.description}</p>
            </div>

            {/* Stats Overview */}
            <div className="mb-12 grid gap-4 md:grid-cols-3">
              <StatCard
                icon={<MessageSquare className="h-5 w-5" />}
                label="Messages Analyzed"
                value={stats.n_turns.toString()}
              />
              <StatCard
                icon={<BarChart3 className="h-5 w-5" />}
                label="Avg Message Length"
                value={`${stats.length.mean.toFixed(1)} chars`}
              />
              <StatCard
                icon={<Clock className="h-5 w-5" />}
                label="Code-Switching"
                value={`${(stats.code_switching.latin_share * 100).toFixed(0)}%`}
              />
            </div>

            {/* Key Metrics */}
            <section className="mb-12">
              <h2 className="mb-6 mt-12 text-2xl font-bold md:text-3xl">Key Metrics</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricCard
                  label="Emoji Usage"
                  value={`${stats.emoji.unicode_per_turn.toFixed(2)}/turn`}
                  detail={
                    stats.emoji.top_unicode.length > 0
                      ? `Top: ${stats.emoji.top_unicode
                          .slice(0, 5)
                          .map((e) => e[0])
                          .join(' ')}`
                      : 'None'
                  }
                />
                <MetricCard
                  label="Bubble Bursts"
                  value={`${stats.bubbles_per_turn.mean.toFixed(2)}/turn`}
                  detail={`${(stats.bubbles_per_turn.multi_bubble_share * 100).toFixed(0)}% multi-bubble`}
                />
                <MetricCard
                  label="Laughter"
                  value={`${stats.laughter_per_turn.toFixed(2)}/turn`}
                  detail="哈哈 / 233 / hhh patterns"
                />
                <MetricCard
                  label="Length Distribution"
                  value={`p50: ${stats.length.p50}, p90: ${stats.length.p90}`}
                  detail={`Max: ${stats.length.max} chars`}
                />
              </div>
            </section>

            {/* Profile */}
            <section className="mb-12">
              <h2 className="mb-6 mt-12 text-2xl font-bold md:text-3xl">Style Profile</h2>
              <div className="overflow-hidden rounded-lg border bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <div className="prose prose-zinc max-w-none p-6 dark:prose-invert prose-headings:mb-3 prose-headings:mt-6 prose-h1:text-2xl prose-h2:text-xl prose-p:my-2 prose-ul:my-3">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{profile}</pre>
                </div>
              </div>
            </section>

            {/* Persona Prompt */}
            <section>
              <h2 className="mb-6 mt-12 text-2xl font-bold md:text-3xl">Persona Prompt</h2>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                This system prompt encodes the linguistic style. Use it with any LLM (via API or
                chat interface) to make it reply in this persona&apos;s voice.
              </p>
              <div className="overflow-hidden rounded-lg border bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <pre className="overflow-x-auto p-6 text-xs leading-relaxed">{prompt}</pre>
              </div>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[--color-wechat-green]/10 text-[--color-wechat-green]">
        {icon}
      </div>
      <div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</div>
      <div className="mb-1 text-2xl font-bold">{value}</div>
      <div className="text-xs text-zinc-500">{detail}</div>
    </div>
  );
}
