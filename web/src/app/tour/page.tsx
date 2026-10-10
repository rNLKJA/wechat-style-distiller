import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import Image from 'next/image';

export const metadata = {
  title: 'Interactive Tour — WeChat Style Distiller',
  description: 'Video walkthroughs demonstrating key features and workflows',
};

export default function TourPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="mb-4 text-4xl font-bold">Interactive Tour</h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Video walkthroughs demonstrating how the WeChat Style Distiller methodology works
              </p>
            </div>

            {/* Workflow 1: Explore Personas */}
            <section className="mb-16">
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[--color-wechat-green] text-sm font-bold text-white">
                    1
                  </span>
                  <h2 className="text-2xl font-bold">Explore Personas</h2>
                </div>
                <p className="ml-11 text-zinc-600 dark:text-zinc-400">
                  Browse the synthetic persona collection, view detailed linguistic profiles and
                  generated prompts, compare different communication styles.
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <video
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  poster="/showcase/01-explore-personas-poster.jpg"
                  className="w-full"
                >
                  <source src="/showcase/01-explore-personas.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="mt-4 rounded-lg border bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <h3 className="mb-2 font-semibold">Steps:</h3>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>Navigate to the persona gallery from the landing page</li>
                  <li>Browse the collection of synthetic personas</li>
                  <li>Open a persona to view detailed linguistic features</li>
                  <li>Review statistics, message patterns, and emoji usage</li>
                  <li>Read the generated persona prompt for LLMs</li>
                  <li>Compare with other personas to see style variations</li>
                </ol>
              </div>
            </section>

            {/* Workflow 2: Chat Like a Persona */}
            <section className="mb-16">
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[--color-wechat-green] text-sm font-bold text-white">
                    2
                  </span>
                  <h2 className="text-2xl font-bold">Chat Like a Persona (BYOK)</h2>
                </div>
                <p className="ml-11 text-zinc-600 dark:text-zinc-400">
                  BYOK (Bring Your Own Key) architecture for optional AI features: paste your own
                  API key (Anthropic or OpenAI), test persona prompts interactively, view complete
                  audit logs.
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <video
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  poster="/showcase/02-chat-persona-poster.jpg"
                  className="w-full"
                >
                  <source src="/showcase/02-chat-persona.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="mt-4 rounded-lg border bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <h3 className="mb-2 font-semibold">Steps:</h3>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>Navigate to the persona tuner page</li>
                  <li>See the BYOK dialog (API key required for live testing)</li>
                  <li>Understand client-side-only AI architecture</li>
                  <li>Navigate to the AI audit log page</li>
                  <li>Review transparency features: all calls logged with full details</li>
                  <li>Export audit data as JSON or CSV</li>
                </ol>
              </div>
            </section>

            {/* Workflow 3: Privacy & Governance */}
            <section className="mb-16">
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[--color-wechat-green] text-sm font-bold text-white">
                    3
                  </span>
                  <h2 className="text-2xl font-bold">Privacy & Governance</h2>
                </div>
                <p className="ml-11 text-zinc-600 dark:text-zinc-400">
                  Review the comprehensive threat model, explore feature validation with confidence
                  intervals, read architectural decision records with full rationale.
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <video
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  poster="/showcase/03-privacy-governance-poster.jpg"
                  className="w-full"
                >
                  <source src="/showcase/03-privacy-governance.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="mt-4 rounded-lg border bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <h3 className="mb-2 font-semibold">Steps:</h3>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>Navigate to the privacy threat model page</li>
                  <li>Review comprehensive analysis of potential data leaks</li>
                  <li>Navigate to feature validation results</li>
                  <li>See statistical rigor: bootstrap CIs, inter-persona variance</li>
                  <li>Navigate to the methods page</li>
                  <li>Read complete methodology, assumptions, and limitations</li>
                  <li>View architectural decision records</li>
                  <li>Understand detailed rationale and outcomes for key decisions</li>
                </ol>
              </div>
            </section>

            {/* Screenshot Gallery */}
            <section className="mb-16">
              <h2 className="mb-6 text-2xl font-bold">Feature Gallery</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <ScreenshotCard
                  src="/showcase/screenshots/02-personas-gallery.png"
                  alt="Persona Gallery"
                  title="Synthetic Persona Gallery"
                  description="6 pre-generated personas with varied linguistic patterns"
                />
                <ScreenshotCard
                  src="/showcase/screenshots/03-persona-detail.png"
                  alt="Persona Detail"
                  title="Detailed Profiles"
                  description="Linguistic features, statistics, and generated prompts"
                />
                <ScreenshotCard
                  src="/showcase/screenshots/05-validation.png"
                  alt="Feature Validation"
                  title="Statistical Validation"
                  description="Bootstrap CIs, inter-persona variance, rigorous evaluation"
                />
                <ScreenshotCard
                  src="/showcase/screenshots/06-privacy.png"
                  alt="Privacy Threat Model"
                  title="Privacy & Governance"
                  description="Comprehensive threat analysis and mitigation checklist"
                />
              </div>
            </section>

            {/* Accessibility Note */}
            <section className="rounded-lg border bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="mb-3 font-semibold">Accessibility</h3>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                All videos include visible step captions for clarity. The written step lists above
                each video provide the same information for screen reader users or those who prefer
                text.
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Videos are encoded with H.264 for broad compatibility and include poster frames for
                preview. All controls are keyboard accessible.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function ScreenshotCard({
  src,
  alt,
  title,
  description,
}: {
  src: string;
  alt: string;
  title: string;
  description: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <Image src={src} alt={alt} width={1440} height={900} className="w-full" loading="lazy" />
      <div className="p-4">
        <h3 className="mb-1 font-semibold">{title}</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}
