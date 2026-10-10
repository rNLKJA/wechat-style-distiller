import Link from 'next/link';
import { ArrowRight, MessageSquare, Lock, Code2, BarChart3 } from 'lucide-react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-12 w-12 text-[--color-wechat-green]" />
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                WeChat Style Distiller
              </h1>
            </div>

            <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 md:text-xl">
              Turn your WeChat chat history into a linguistic style profile and a persona prompt
              that makes any LLM reply in your voice.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/personas"
                className="flex items-center justify-center gap-2 rounded-lg bg-[--color-wechat-green] px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
              >
                Explore Personas
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pipeline"
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-3 font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </section>

        {/* What It Does */}
        <section className="border-t bg-zinc-50 dark:bg-zinc-900/50">
          <div className="container mx-auto px-4 py-16">
            <h2 className="mb-12 text-center text-3xl font-bold">What It Analyzes</h2>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<MessageSquare className="h-6 w-6" />}
                title="Message Patterns"
                description="Length distribution, bubble bursts, punctuation habits, turn-taking speed"
              />
              <FeatureCard
                icon={<BarChart3 className="h-6 w-6" />}
                title="Linguistic Features"
                description="Emoji frequency, laughter tokens, catchphrases, opener/closer habits"
              />
              <FeatureCard
                icon={<Code2 className="h-6 w-6" />}
                title="Code-Switching"
                description="English/Chinese ratio, language mixing patterns, register awareness"
              />
              <FeatureCard
                icon={<Lock className="h-6 w-6" />}
                title="Privacy-First"
                description="All analysis runs locally. Your chat data never leaves your machine."
              />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="border-t">
          <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-3xl font-bold">About This Project</h2>

              <div className="space-y-4 text-zinc-600 dark:text-zinc-400">
                <p>
                  <strong className="text-zinc-900 dark:text-zinc-100">Personal NLP project</strong>{' '}
                  by Sunchuangyu Huang, 2026. This is a methodology showcase demonstrating how
                  linguistic style profiling and persona generation work.
                </p>

                <p>
                  The original tool extracts patterns from your real WeChat history — how you
                  actually text (message length, emoji usage, code-switching, catchphrases) — and
                  generates a system prompt that makes any LLM reply in your voice.
                </p>

                <p>
                  This demo site uses{' '}
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    synthetic personas only
                  </strong>{' '}
                  to demonstrate the methodology without accessing real user data. Explore the
                  pipeline, feature analysis, and pre-generated personas to understand how the tool
                  works.
                </p>

                <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-sm">
                    <strong className="text-zinc-900 dark:text-zinc-100">Tech Stack:</strong>{' '}
                    Original tool is Python 3.12+ with pure-stdlib pipeline. This showcase is built
                    with Next.js 16, TypeScript, Tailwind CSS v4, and deployed on Vercel.
                  </p>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="https://github.com/rNLKJA/wechat-style-distiller"
                    className="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-6 py-3 font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    View on GitHub
                  </Link>
                  <Link
                    href="/install"
                    className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    Install Locally
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[--color-wechat-green]/10 text-[--color-wechat-green]">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}
