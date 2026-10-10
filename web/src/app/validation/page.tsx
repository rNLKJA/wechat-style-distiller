import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { BarChart3, Target, GitCompare } from 'lucide-react';
import { PERSONA_IDS } from '@/lib/personas';
import { loadPersona } from '@/lib/personas';
import {
  extractFeatures,
  computePairwiseSimilarities,
  computeDistinctiveness,
  computeFeatureVariance,
  computeFeatureCorrelations,
  type PersonaFeatureVector,
} from '@/lib/stats/persona-analysis';

export default async function ValidationPage() {
  // Load all personas
  const personas = await Promise.all(PERSONA_IDS.map((id) => loadPersona(id)));

  // Extract feature vectors
  const featureVectors: PersonaFeatureVector[] = personas.map((p) =>
    extractFeatures(p.metadata.id, p.stats)
  );

  // Compute statistics
  const similarities = computePairwiseSimilarities(featureVectors);
  const distinctiveness = computeDistinctiveness(featureVectors);
  const featureVariances = {
    avgLength: computeFeatureVariance(featureVectors, 'avgLength', 42),
    emojiRate: computeFeatureVariance(featureVectors, 'emojiRate', 43),
    latinShare: computeFeatureVariance(featureVectors, 'latinShare', 44),
    bubblesPerTurn: computeFeatureVariance(featureVectors, 'bubblesPerTurn', 45),
    laughterRate: computeFeatureVariance(featureVectors, 'laughterRate', 46),
    noPunctRate: computeFeatureVariance(featureVectors, 'noPunctRate', 47),
  };
  const correlations = computeFeatureCorrelations(featureVectors);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <h1 className="mb-4 text-4xl font-bold">Feature Validation</h1>
            <p className="mb-12 text-lg text-zinc-600 dark:text-zinc-400">
              Statistical analysis of linguistic features across synthetic personas. All confidence
              intervals computed with bootstrap resampling (1000 iterations, seed=42–47).
            </p>

            {/* Inter-Persona Variance */}
            <section className="mb-16">
              <div className="mb-6 flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-[--color-wechat-green]" />
                <h2 className="text-2xl font-bold">Inter-Persona Variance</h2>
              </div>

              <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                Do the synthetic personas differ meaningfully? Higher variance indicates the
                personas span a diverse range of linguistic patterns.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(featureVariances).map(([feature, stats]) => (
                  <div
                    key={feature}
                    className="rounded-lg border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <h3 className="mb-3 font-semibold">
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Mean:</span>
                        <span className="font-mono">{stats.mean.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Variance:</span>
                        <span className="font-mono">{stats.variance.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">95% CI:</span>
                        <span className="font-mono">
                          [{stats.ci[0].toFixed(3)}, {stats.ci[1].toFixed(3)}]
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-600">
                        n={featureVectors.length}, bootstrap 1000 iterations
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Persona Distinctiveness */}
            <section className="mb-16">
              <div className="mb-6 flex items-center gap-3">
                <Target className="h-6 w-6 text-[--color-wechat-green]" />
                <h2 className="text-2xl font-bold">Persona Distinctiveness</h2>
              </div>

              <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                How unique is each persona&apos;s linguistic profile? Computed as 1 minus average
                cosine similarity to all other personas. Higher = more distinctive.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b dark:border-zinc-800">
                    <tr>
                      <th className="pb-3 pr-4 font-semibold">Rank</th>
                      <th className="pb-3 pr-4 font-semibold">Persona</th>
                      <th className="pb-3 text-right font-semibold">Distinctiveness Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distinctiveness.map((entry, idx) => {
                      const persona = personas.find((p) => p.metadata.id === entry.personaId);
                      return (
                        <tr key={entry.personaId} className="border-b dark:border-zinc-800">
                          <td className="py-3 pr-4 font-mono text-zinc-500">{idx + 1}</td>
                          <td className="py-3 pr-4">{persona?.metadata.name}</td>
                          <td className="py-3 text-right font-mono">
                            {entry.distinctiveness.toFixed(4)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Pairwise Similarities */}
            <section className="mb-16">
              <div className="mb-6 flex items-center gap-3">
                <GitCompare className="h-6 w-6 text-[--color-wechat-green]" />
                <h2 className="text-2xl font-bold">Pairwise Persona Similarity</h2>
              </div>

              <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                Cosine similarity in 6-dimensional feature space. Lower values = more distinct
                persona pairs.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b dark:border-zinc-800">
                    <tr>
                      <th className="pb-3 pr-4 font-semibold">Persona A</th>
                      <th className="pb-3 pr-4 font-semibold">Persona B</th>
                      <th className="pb-3 text-right font-semibold">Cosine Similarity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {similarities.map((sim, idx) => {
                      const personaA = personas.find((p) => p.metadata.id === sim.personaA);
                      const personaB = personas.find((p) => p.metadata.id === sim.personaB);
                      return (
                        <tr key={idx} className="border-b dark:border-zinc-800">
                          <td className="py-3 pr-4">{personaA?.metadata.name}</td>
                          <td className="py-3 pr-4">{personaB?.metadata.name}</td>
                          <td className="py-3 text-right font-mono">{sim.similarity.toFixed(4)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Feature Correlations */}
            <section>
              <h2 className="mb-6 text-2xl font-bold">Feature Correlation Matrix</h2>

              <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                Pearson correlation coefficients. Values near ±1 indicate strong linear
                relationships.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="border p-2 text-left dark:border-zinc-800"></th>
                      {Object.keys(correlations).map((feature) => (
                        <th key={feature} className="border p-2 text-center dark:border-zinc-800">
                          {feature.replace(/([A-Z])/g, ' $1').trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(correlations).map(([rowFeature, row]) => (
                      <tr key={rowFeature}>
                        <th className="border p-2 text-left dark:border-zinc-800">
                          {rowFeature.replace(/([A-Z])/g, ' $1').trim()}
                        </th>
                        {Object.entries(row).map(([colFeature, corr]) => {
                          const bgColor =
                            Math.abs(corr) > 0.7
                              ? 'bg-[--color-wechat-green]/20'
                              : Math.abs(corr) > 0.4
                                ? 'bg-[--color-wechat-green]/10'
                                : '';
                          return (
                            <td
                              key={colFeature}
                              className={`border p-2 text-center font-mono dark:border-zinc-800 ${bgColor}`}
                            >
                              {corr.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-600">
                Cells highlighted green have |r| &gt; 0.4 (darker = stronger correlation)
              </div>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
