import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { promises as fs } from 'fs';
import path from 'path';

const DECISION_RECORDS: Record<string, string> = {
  '001': 'DR-001-local-first-architecture.md',
  '002': 'DR-002-synthetic-demo-data.md',
  '003': 'DR-003-feature-selection.md',
  '004': 'DR-004-byok-architecture.md',
};

interface DecisionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return Object.keys(DECISION_RECORDS).map((id) => ({ id }));
}

export default async function DecisionPage({ params }: DecisionPageProps) {
  const { id } = await params;
  const filename = DECISION_RECORDS[id];

  if (!filename) {
    notFound();
  }

  const filePath = path.join(process.cwd(), 'public', 'decisions', filename);
  const content = await fs.readFile(filePath, 'utf-8');

  // Simple markdown rendering (headers, lists, bold, code)
  const html = renderMarkdown(content);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <div
              className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-h2:mt-8 prose-h3:text-xl prose-a:text-[--color-wechat-green] prose-code:rounded prose-code:bg-zinc-100 prose-code:px-2 prose-code:py-1 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none dark:prose-code:bg-zinc-900"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/**
 * Minimal markdown renderer
 */
function renderMarkdown(md: string): string {
  let html = md;

  // Headers
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // Paragraphs (lines not already in tags)
  html = html.replace(/^(?!<[hul]|<\/[hul]|<li|<\/li)(.+)$/gm, '<p>$1</p>');

  // Tables
  html = html.replace(/\|(.+)\|/g, (match, content) => {
    const cells = content.split('|').map((cell: string) => cell.trim());
    const cellTags = cells.map((cell: string) => `<td>${cell}</td>`).join('');
    return `<tr>${cellTags}</tr>`;
  });
  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, (match) => `<table>${match}</table>`);

  return html;
}
