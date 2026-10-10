'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Moon, Sun, Menu, X } from 'lucide-react';
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
  { name: 'Prompt Test', href: '/prompt-effectiveness' },
  { name: 'Persona Tuner', href: '/persona-tuner' },
  { name: 'AI Log', href: '/ai-log' },
  { name: 'Methods', href: '/methods' },
  { name: 'Privacy', href: '/privacy' },
  { name: 'Install', href: '/install' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Wait for hydration to avoid theme flash
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-zinc-950/80 dark:supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <MessageSquare className="h-5 w-5 text-[--color-wechat-green]" />
          <span className="hidden sm:inline">WeChat Style Distiller</span>
          <span className="sm:hidden">Style Distiller</span>
        </Link>

        {/* Desktop Navigation */}
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle theme"
          >
            {mounted &&
              (theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />)}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav id="mobile-menu" className="md:hidden border-t bg-white dark:bg-zinc-950">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                  pathname === item.href
                    ? 'text-[--color-wechat-green] bg-zinc-50 dark:bg-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
