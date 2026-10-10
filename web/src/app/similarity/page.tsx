import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Target, GitCompare } from 'lucide-react';
import { PERSONA_IDS, loadPersona } from '@/lib/personas';
import {
  extractFeatures,
  computePairwiseSimilarities,
  type PersonaFeatureVector
} from '@/lib/stats/persona-analysis';
import Link from 'next/link';

export default async function SimilarityPage() {
  // Load all personas
  const personas = await Promise.all(PERSONA_IDS.map(id => loadPersona(id)));

  // Extract feature vectors
  const featureVectors: PersonaFeatureVector[] = personas.map(p =>
    extractFeatures(p.metadata.id, p.stats)
  );

  // Compute pairwise similarities
  const similarities = computePairwiseSimilarities(featureVectors);

  // Most similar pair
  const mostSimilar = similarities[similarities.length - 1];
  // Least similar pair
  const leastSimilar = similarities[0];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <h1 className="mb-4 text-4xl font-bold">Persona Similarity Analysis</h1>
            <p className="mb-12 text-lg text-zinc-600 dark:text-zinc-400">
              Pairwise comparison of synthetic personas in 6-dimensional feature space. Similarity
              computed via cosine distance.
            </p>

            {/* Key Findings */}
            <section className="mb-16 grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-[--color-wechat-green]/30 bg-[--color-wechat-green]/5 p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-[--color-wechat-green]" />
                  <h3 className="font-semibold">Most Similar Pair</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <Link
                      href={`/personas/${mostSimilar.personaA}`}
                      className="text-[--color-wechat-green] underline"
                    >
                      {personas.find(p => p.metadata.id === mostSimilar.personaA)?.metadata.name}
                    </Link>
                    {' vs '}
                    <Link
                      href={`/personas/${mostSimilar.personaB}`}
                      className="text-[--color-wechat-green] underline"
                    >
                      {personas.find(p => p.metadata.id === mostSimilar.personaB)?.metadata.name}
                    </Link>
                  </div>
                  <div className="font-mono text-2xl font-bold text-[--color-wechat-green]">
                    {mostSimilar.similarity.toFixed(4)}
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Highest cosine similarity among all pairs
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-3 flex items-center gap-2">
                  <GitCompare className="h-5 w-5" />
                  <h3 className="font-semibold">Least Similar Pair</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <Link
                      href={`/personas/${leastSimilar.personaA}`}
                      className="text-[--color-wechat-green] underline"
                    >
                      {personas.find(p => p.metadata.id === leastSimilar.personaA)?.metadata.name}
                    </Link>
                    {' vs '}
                    <Link
                      href={`/personas/${leastSimilar.personaB}`}
                      className="text-[--color-wechat-green] underline"
                    >
                      {personas.find(p => p.metadata.id === leastSimilar.personaB)?.metadata.name}
                    </Link>
                  </div>
                  <div className="font-mono text-2xl font-bold">
                    {leastSimilar.similarity.toFixed(4)}
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Lowest cosine similarity among all pairs
                  </p>
                </div>
              </div>
            </section>

            {/* All Pairwise Similarities */}
            <section className="mb-16">
              <h2 className="mb-6 text-2xl font-bold">All Pairwise Comparisons</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b dark:border-zinc-800">
                    <tr>
                      <th className="pb-3 pr-4 font-semibold">Rank</th>
                      <th className="pb-3 pr-4 font-semibold">Persona A</th>
                      <th className="pb-3 pr-4 font-semibold">Persona B</th>
                      <th className="pb-3 text-right font-semibold">Similarity</th>
                      <th className="pb-3 pl-4 text-right font-semibold">Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {similarities.map((sim, idx) => {
                      const personaA = personas.find(p => p.metadata.id === sim.personaA);
                      const personaB = personas.find(p => p.metadata.id === sim.personaB);
                      const distance = 1 - sim.similarity;

                      return (
                        <tr key={idx} className="border-b dark:border-zinc-800">
                          <td className="py-3 pr-4 font-mono text-zinc-500">{idx + 1}</td>
                          <td className="py-3 pr-4">
                            <Link
                              href={`/personas/${sim.personaA}`}
                              className="text-[--color-wechat-green] underline"
                            >
                              {personaA?.metadata.name}
                            </Link>
                          </td>
                          <td className="py-3 pr-4">
                            <Link
                              href={`/personas/${sim.personaB}`}
                              className="text-[--color-wechat-green] underline"
                            >
                              {personaB?.metadata.name}
                            </Link>
                          </td>
                          <td className="py-3 text-right font-mono">{sim.similarity.toFixed(4)}</td>
                          <td className="py-3 pl-4 text-right font-mono text-zinc-500">
                            {distance.toFixed(4)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-600">
                Distance = 1 - Similarity. Lower distance = more similar personas. n=
                {similarities.length} pairs from {PERSONA_IDS.length} personas.
              </p>
            </section>

            {/* Feature Space Explanation */}
            <section>
              <h2 className="mb-6 text-2xl font-bold">Feature Space</h2>

              <p className="mb-6 text-zinc-700 dark:text-zinc-300">
                Each persona is represented as a vector in 6-dimensional space:
              </p>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FeatureDimension name="Average Length" description="Mean message length in characters" />
                <FeatureDimension name="Emoji Rate" description="Emoji per turn" />
                <FeatureDimension name="Latin Share" description="Proportion of Latin words (code-switching)" />
                <FeatureDimension name="Bubbles Per Turn" description="Messages sent in each turn" />
                <FeatureDimension name="Laughter Rate" description="Laughter tokens per turn" />
                <FeatureDimension name="No Punctuation Rate" description="Proportion of turns without end punctuation" />
              </div>

              <div className="mt-6 rounded-lg border border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-3 font-semibold">Cosine Similarity Formula</h3>
                <div className="font-mono text-sm">
                  sim(A, B) = (A · B) / (||A|| × ||B||)
                </div>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  Cosine of the angle between two vectors. Range: -1 (opposite) to +1 (identical). All
                  personas in this dataset have positive similarity (same general direction in feature
                  space).
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

function FeatureDimension({ name, description }: { name: string; description: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h4 className="mb-1 font-semibold">{name}</h4>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}
