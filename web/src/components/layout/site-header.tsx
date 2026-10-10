'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Pipeline', href: '/pipeline' },
  { name: 'Personas', href: '/personas' },
  { name: 'Features', href: '/features' },
  { name: 'Validation', href: '/validation' },
  { name: 'Similarity', href: '/similarity' },
  { name: 'Match Quiz', href: '/match-quiz' },
  { name: 'Methods', href: '/methods' },
  { name: 'Privacy', href: '/privacy' },
  { name: 'Install', href: '/install' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Wait for hydration to avoid theme flash
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-zinc-950/80 dark:supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <MessageSquare className="h-5 w-5 text-[--color-wechat-green]" />
          <span className="hidden sm:inline">WeChat Style Distiller</span>
          <span className="sm:hidden">Style Distiller</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-[--color-wechat-green] ${
                pathname === item.href
                  ? 'text-[--color-wechat-green]'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Toggle theme"
        >
          {mounted &&
            (theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />)}
        </button>
      </div>
    </header>
  );
}
