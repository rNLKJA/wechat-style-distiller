'use client';

import { useState } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface QuizState {
  avgLength: number;
  emojiRate: number;
  latinShare: number;
  bubblesPerTurn: number;
  laughterRate: number;
}

const PERSONAS = [
  { id: 'bilingual_early_adopter', name: 'Bilingual Early Adopter' },
  { id: 'concise_mandarin', name: 'Concise Mandarin' },
  { id: 'expressive_english', name: 'Expressive English' },
  { id: 'balanced_bilingual', name: 'Balanced Bilingual' },
  { id: 'emoji_enthusiast', name: 'Emoji Enthusiast' },
  { id: 'technical_researcher', name: 'Technical Researcher' },
];

export default function MatchQuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizState>>({});
  const [result, setResult] = useState<{ personaId: string; similarity: number } | null>(null);

  const questions = [
    {
      key: 'avgLength' as keyof QuizState,
      question: 'How long are your typical messages?',
      options: [
        { label: 'Very short (5-15 characters)', value: 10 },
        { label: 'Short (15-30 characters)', value: 22 },
        { label: 'Medium (30-50 characters)', value: 40 },
        { label: 'Long (50-80 characters)', value: 65 },
      ],
    },
    {
      key: 'emojiRate' as keyof QuizState,
      question: 'How often do you use emoji?',
      options: [
        { label: 'Rarely (almost never)', value: 0.05 },
        { label: 'Sometimes (1 per 5-10 messages)', value: 0.15 },
        { label: 'Often (1 per 2-3 messages)', value: 0.35 },
        { label: 'Very often (multiple per message)', value: 0.7 },
      ],
    },
    {
      key: 'latinShare' as keyof QuizState,
      question:
        'How much English do you mix in? (If you mostly text in English, select "Almost all")',
      options: [
        { label: 'None (Chinese only)', value: 0.0 },
        { label: 'A little (10-20%)', value: 0.15 },
        { label: 'Balanced (40-60%)', value: 0.5 },
        { label: 'Mostly English (70-90%)', value: 0.8 },
        { label: 'Almost all (English only)', value: 1.0 },
      ],
    },
    {
      key: 'bubblesPerTurn' as keyof QuizState,
      question: 'Do you send one long message or split into multiple short ones?',
      options: [
        { label: 'One message (1 bubble)', value: 1.0 },
        { label: 'Sometimes split (1.5 bubbles)', value: 1.5 },
        { label: 'Often split (2-3 bubbles)', value: 2.5 },
      ],
    },
    {
      key: 'laughterRate' as keyof QuizState,
      question: 'How often do you use laughter tokens (哈哈, lol, haha)?',
      options: [
        { label: 'Rarely', value: 0.1 },
        { label: 'Sometimes (1 per 3-5 messages)', value: 0.3 },
        { label: 'Often (1 per 2 messages)', value: 0.5 },
        { label: 'Very often (almost every message)', value: 0.85 },
      ],
    },
  ];

  const currentQuestion = questions[step];

  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [currentQuestion.key]: value };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Calculate match
      calculateMatch(newAnswers as QuizState);
    }
  };

  const calculateMatch = async (profile: QuizState) => {
    // Fetch persona stats and compute similarity
    const response = await fetch('/api/match-persona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });

    const data = await response.json();
    setResult(data.matches[0]);
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <Target className="mx-auto mb-4 h-12 w-12 text-[--color-wechat-green]" />
              <h1 className="mb-4 text-4xl font-bold">Which Persona Are You?</h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Answer 5 questions about your texting habits and find your closest match among the
                synthetic personas.
              </p>
            </div>

            {!result ? (
              <div className="rounded-lg border bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-6">
                  <div className="mb-2 flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                    <span>
                      Question {step + 1} of {questions.length}
                    </span>
                    <span>{Math.round(((step + 1) / questions.length) * 100)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-full bg-[--color-wechat-green] transition-all"
                      style={{ width: `${((step + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <h2 className="mb-6 text-xl font-semibold">{currentQuestion.question}</h2>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white p-4 text-left transition-all hover:scale-105 hover:border-[--color-wechat-green] hover:bg-[--color-wechat-green]/5 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-[--color-wechat-green]"
                    >
                      <span className="text-base font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>

                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="mt-6 text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    ← Back
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-lg border bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="mb-4 text-2xl font-bold">Your Match</h2>

                <div className="mb-6 rounded-lg border border-[--color-wechat-green]/30 bg-[--color-wechat-green]/5 p-6">
                  <div className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                    You&apos;re most similar to:
                  </div>
                  <div className="mb-3 text-3xl font-bold text-[--color-wechat-green]">
                    {PERSONAS.find((p) => p.id === result.personaId)?.name}
                  </div>
                  <div className="text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Similarity score: </span>
                    <span className="font-mono font-semibold">{result.similarity.toFixed(4)}</span>
                  </div>
                </div>

                <div className="mb-6 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <p>
                    This persona was the closest match in 6-dimensional feature space (cosine
                    similarity). Your texting habits align with this persona&apos;s:
                  </p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Message length: {answers.avgLength} chars (your answer)</li>
                    <li>Emoji rate: {answers.emojiRate} per message</li>
                    <li>Code-switching: {((answers.latinShare ?? 0) * 100).toFixed(0)}% English</li>
                    <li>Bubble bursts: {answers.bubblesPerTurn} bubbles per turn</li>
                    <li>Laughter rate: {answers.laughterRate} per message</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/personas/${result.personaId}`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[--color-wechat-green] px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
                  >
                    View Persona
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={reset}
                    className="rounded-lg border border-zinc-300 px-6 py-3 font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
