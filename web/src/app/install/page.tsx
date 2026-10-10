import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Terminal, Download, Play, MessageSquare } from 'lucide-react';

const steps = [
  {
    title: 'Prerequisites',
    commands: [
      { label: 'Python 3.12 or later', code: 'python3 --version' },
      { label: 'WeChat desktop app (for decryption)', code: null },
    ],
  },
  {
    title: 'Install the chatlog extractor',
    commands: [
      {
        label: 'Download and set up the chatlog tool (MIT licensed)',
        code: 'cd original\nbash scripts/setup_chatlog.sh',
      },
    ],
  },
  {
    title: 'Install dependencies',
    commands: [
      {
        label: 'Install the distiller with optional dependencies',
        code: 'cd original\npip install -e ".[full,dev]"',
      },
    ],
  },
  {
    title: 'Try the demo (no WeChat required)',
    commands: [
      {
        label: 'Generate synthetic data and run the full pipeline',
        code: 'cd original\nmake demo',
      },
      {
        label: 'Output lands in output/samples/',
        code: 'ls output/samples/\n# profile.md  persona_prompt.txt  stats.json',
      },
    ],
  },
];

const realUsage = [
  {
    title: 'Extract your chats',
    commands: [
      {
        label: 'With WeChat desktop running and logged in, run:',
        code: 'chatlog',
      },
      {
        label: 'Follow the TUI to decrypt your database',
        code: null,
      },
    ],
  },
  {
    title: 'Run the pipeline',
    commands: [
      {
        label: 'Analyze your messages and generate profile + prompt',
        code: 'python -m wechat_style_distiller.cli run \\\n  --from-api \\\n  --out output \\\n  --name "Your Name"',
      },
      {
        label: 'Check the outputs',
        code: 'ls output/\n# profile.md  persona_prompt.txt  dataset.jsonl  stats.json',
      },
    ],
  },
  {
    title: 'Chat in your voice (optional)',
    commands: [
      {
        label: 'Requires ANTHROPIC_API_KEY in environment',
        code: 'export ANTHROPIC_API_KEY="sk-ant-..."',
      },
      {
        label: 'Start the chatbot',
        code: 'python -m wechat_style_distiller.cli chat \\\n  --persona output/persona_prompt.txt',
      },
    ],
  },
];

export default function InstallPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-4 text-4xl font-bold">Installation Guide</h1>
            <p className="mb-12 text-lg text-zinc-600 dark:text-zinc-400">
              Install the tool locally to analyze your own WeChat chat history. Runs on macOS and
              Linux.
            </p>

            {/* Quick Start */}
            <section className="mb-16">
              <div className="mb-6 flex items-center gap-3">
                <Download className="h-6 w-6 text-[--color-wechat-green]" />
                <h2 className="text-2xl font-bold">Quick Start</h2>
              </div>

              <div className="space-y-8">
                {steps.map((step, idx) => (
                  <div key={idx}>
                    <h3 className="mb-3 text-lg font-semibold">{`${idx + 1}. ${step.title}`}</h3>
                    <div className="space-y-3">
                      {step.commands.map((cmd, cmdIdx) => (
                        <div key={cmdIdx}>
                          {cmd.label && (
                            <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                              {cmd.label}
                            </p>
                          )}
                          {cmd.code && (
                            <pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 font-mono text-sm text-zinc-100 dark:border-zinc-800">
                              {cmd.code}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Real Usage */}
            <section className="mb-16">
              <div className="mb-6 flex items-center gap-3">
                <Play className="h-6 w-6 text-[--color-wechat-green]" />
                <h2 className="text-2xl font-bold">Using Your Real Chats</h2>
              </div>

              <div className="space-y-8">
                {realUsage.map((step, idx) => (
                  <div key={idx}>
                    <h3 className="mb-3 text-lg font-semibold">{`${idx + 1}. ${step.title}`}</h3>
                    <div className="space-y-3">
                      {step.commands.map((cmd, cmdIdx) => (
                        <div key={cmdIdx}>
                          {cmd.label && (
                            <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                              {cmd.label}
                            </p>
                          )}
                          {cmd.code && (
                            <pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 font-mono text-sm text-zinc-100 dark:border-zinc-800">
                              {cmd.code}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Privacy Reminder */}
            <section className="rounded-lg border border-[--color-wechat-green]/30 bg-[--color-wechat-green]/5 p-6">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[--color-wechat-green]" />
                <h3 className="font-semibold">Privacy Reminder</h3>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                All analysis runs locally. Your chat data is read from your machine, written to
                git-ignored folders, and never uploaded. Network calls only happen if you explicitly
                enable the chatbot feature with your own API key.
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                See the{' '}
                <a
                  href="/privacy"
                  className="font-medium text-[--color-wechat-green] hover:underline"
                >
                  Privacy
                </a>{' '}
                page for full details.
              </p>
            </section>

            {/* Repository Link */}
            <section className="mt-12 text-center">
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Full documentation and source code available on GitHub:
              </p>
              <a
                href="https://github.com/rNLKJA/wechat-style-distiller"
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
              >
                <Terminal className="h-5 w-5" />
                rNLKJA/wechat-style-distiller
              </a>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
