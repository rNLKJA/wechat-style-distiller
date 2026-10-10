import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Shield, HardDrive, GitBranch, EyeOff, Lock, Server } from 'lucide-react';

const principles = [
  {
    icon: HardDrive,
    title: 'Local-First Processing',
    description:
      'All analysis runs on your machine. The pipeline reads your WeChat database, extracts linguistic features, and generates profiles entirely offline.',
    guarantee: 'Your chat data never leaves your computer.',
  },
  {
    icon: GitBranch,
    title: 'Git-Ignored Data',
    description:
      'All input data (WeChat databases, raw messages) and intermediate outputs are written to git-ignored folders. Nothing is committed to version control.',
    guarantee: 'Your messages never enter the repository.',
  },
  {
    icon: EyeOff,
    title: 'No Telemetry',
    description:
      'The tool sends no analytics, crash reports, or usage data. No tracking, no metrics collection, no network calls except the optional chatbot.',
    guarantee: 'Zero telemetry, zero tracking.',
  },
  {
    icon: Lock,
    title: 'Optional API Calls',
    description:
      'The chatbot feature (voice summary + chat) requires your own Anthropic API key. This is BYOK (bring your own key) and entirely opt-in. The core pipeline works fully offline.',
    guarantee: 'API calls only when you explicitly enable them.',
  },
  {
    icon: Server,
    title: 'No Server, No Storage',
    description:
      'This is a CLI tool, not a web service. There is no backend, no database, no cloud storage. Generated profiles live in local files you control.',
    guarantee: 'No servers, no remote storage.',
  },
  {
    icon: Shield,
    title: 'Transparent Source',
    description:
      'The entire pipeline is open source (MIT license). You can audit every line of code that touches your data.',
    guarantee: 'Full transparency, no hidden behavior.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-4 text-4xl font-bold">Privacy Guarantees</h1>
            <p className="mb-12 text-lg text-zinc-600 dark:text-zinc-400">
              WeChat Style Distiller is built privacy-first. Your chat data is personal and
              sensitive — it never leaves your machine.
            </p>

            <div className="mb-16 space-y-6">
              {principles.map((principle) => (
                <div
                  key={principle.title}
                  className="flex gap-6 rounded-lg border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[--color-wechat-green]/10 text-[--color-wechat-green]">
                    <principle.icon className="h-6 w-6" />
                  </div>

                  <div className="flex-1">
                    <h2 className="mb-2 text-xl font-semibold">{principle.title}</h2>
                    <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {principle.description}
                    </p>
                    <div className="rounded bg-[--color-wechat-green]/10 px-3 py-2 text-sm font-medium text-[--color-wechat-green]">
                      ✓ {principle.guarantee}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Data Flow Diagram */}
            <section className="mb-16">
              <h2 className="mb-6 text-2xl font-bold">Data Flow</h2>

              <div className="space-y-4">
                <DataFlowStep
                  step="1"
                  location="Your Machine"
                  action="WeChat database (encrypted) → chatlog tool → raw JSON"
                  privacy="✓ All local"
                />
                <DataFlowStep
                  step="2"
                  location="Your Machine"
                  action="Raw JSON → Python pipeline → stats.json"
                  privacy="✓ Pure Python, no network"
                />
                <DataFlowStep
                  step="3"
                  location="Your Machine"
                  action="stats.json → profile.md + persona_prompt.txt"
                  privacy="✓ Local files only"
                />
                <DataFlowStep
                  step="4"
                  location="Optional: Your Choice"
                  action="If you enable chatbot: persona_prompt → Anthropic API (BYOK)"
                  privacy="⚠️ Network call with your key"
                />
              </div>

              <div className="mt-6 rounded-lg border border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  <strong className="text-zinc-900 dark:text-zinc-100">Summary:</strong> Steps 1-3
                  are fully local and private. Step 4 (chatbot) is optional and requires you to
                  explicitly set{' '}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-950">
                    ANTHROPIC_API_KEY
                  </code>
                  . Without it, the tool works completely offline.
                </p>
              </div>
            </section>

            {/* Demo Site Privacy */}
            <section className="rounded-lg border border-[--color-wechat-green]/30 bg-[--color-wechat-green]/5 p-8">
              <h2 className="mb-4 text-2xl font-bold">About This Demo Site</h2>
              <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                <p>
                  This website is a{' '}
                  <strong className="text-zinc-900 dark:text-zinc-100">methodology showcase</strong>{' '}
                  that demonstrates how the tool works. It uses{' '}
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    synthetic personas only
                  </strong>{' '}
                  — no real user data is involved.
                </p>
                <p>
                  The demo does not ask you to upload chat data, does not run the pipeline in the
                  browser, and does not store or transmit any personal information.
                </p>
                <p>
                  To analyze your own chats, install the tool locally (see the{' '}
                  <a
                    href="/install"
                    className="font-medium text-[--color-wechat-green] hover:underline"
                  >
                    Install
                  </a>{' '}
                  page). Your data stays on your machine.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function DataFlowStep({
  step,
  location,
  action,
  privacy,
}: {
  step: string;
  location: string;
  action: string;
  privacy: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-lg border bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[--color-wechat-green] font-mono text-sm font-bold text-white">
        {step}
      </div>
      <div className="flex-1">
        <div className="mb-1 text-xs font-medium text-zinc-500">{location}</div>
        <div className="mb-2 text-sm">{action}</div>
        <div className="text-xs font-medium text-[--color-wechat-green]">{privacy}</div>
      </div>
    </div>
  );
}
