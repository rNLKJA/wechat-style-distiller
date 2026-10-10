import { GitHubLogoIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Personal project by{' '}
              <Link
                href="https://github.com/rNLKJA"
                className="font-medium hover:text-[--color-wechat-green] transition-colors"
              >
                Sunchuangyu Huang
              </Link>{' '}
              · 2026
            </p>
            <p className="text-xs text-zinc-500">
              Privacy-first NLP tool. Your data stays on your machine.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/rNLKJA/wechat-style-distiller"
              className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-[--color-wechat-green] transition-colors dark:text-zinc-400"
            >
              <GitHubLogoIcon className="h-4 w-4" />
              <span>View on GitHub</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
