'use client';

import { useState } from 'react';
import {
  Menu,
  X,
  Search,
  Moon,
  Sun,
  ChevronRight,
  Home,
  Rocket,
  BookOpen,
  Shield,
  Code2,
  Cloud,
  Settings,
  AlertCircle,
  History,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const docsSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Rocket,
    items: [
      { id: 'installation', label: 'Installation', href: '/installation' },
      { id: 'configuration', label: 'Configuration', href: '/configuration' },
      { id: 'providers', label: 'Providers', href: '/providers' },
    ],
  },
  {
    id: 'core-concepts',
    title: 'Core Concepts',
    icon: BookOpen,
    items: [
      { id: 'jwt-tokens', label: 'JWT Tokens', href: '/jwt-tokens' },
      { id: 'sessions', label: 'Sessions', href: '/sessions' },
      { id: 'protected-routes', label: 'Protected Routes', href: '/protected-routes' },
      { id: 'middleware', label: 'Middleware', href: '/middleware' },
    ],
  },
  {
    id: 'authentication',
    title: 'Authentication',
    icon: Shield,
    items: [
      { id: 'database-adapters', label: 'Database Adapters', href: '/database-adapters' },
      { id: 'oauth-flow', label: 'OAuth Flow', href: '/oauth-flow' },
      { id: 'credentials', label: 'Credentials', href: '/credentials' },
      { id: 'multi-factor', label: 'Multi-Factor Auth', href: '/multi-factor' },
    ],
  },
  {
    id: 'api',
    title: 'API Reference',
    icon: Code2,
    items: [
      { id: 'api-routes', label: 'API Routes', href: '/api-routes' },
      { id: 'server-components', label: 'Server Components', href: '/server-components' },
      { id: 'client-components', label: 'Client Components', href: '/client-components' },
      { id: 'nextjs-config', label: 'Next.js Config', href: '/nextjs-config' },
    ],
  },
  {
    id: 'deployment',
    title: 'Deployment',
    icon: Cloud,
    items: [
      { id: 'vercel', label: 'Vercel', href: '/vercel' },
      { id: 'netlify', label: 'Netlify', href: '/netlify' },
      { id: 'self-hosted', label: 'Self-Hosted', href: '/self-hosted' },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    icon: Settings,
    items: [
      { id: 'custom-pages', label: 'Custom Pages', href: '/custom-pages' },
      { id: 'rate-limiting', label: 'Rate Limiting', href: '/rate-limiting' },
      { id: 'webhooks', label: 'Webhooks', href: '/webhooks' },
      { id: 'monitoring', label: 'Monitoring', href: '/monitoring' },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: AlertCircle,
    items: [
      { id: 'common-issues', label: 'Common Issues', href: '/common-issues' },
      { id: 'migration-guide', label: 'Migration Guide', href: '/migration-guide' },
      { id: 'best-practices', label: 'Best Practices', href: '/best-practices' },
    ],
  },
  {
    id: 'changelog',
    title: 'Changelog',
    icon: History,
    items: [
      { id: 'v3', label: 'v3.0.0', href: '/changelog#v3' },
      { id: 'v2', label: 'v2.0.0', href: '/changelog#v2' },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  return (
    <div className='min-h-screen bg-white dark:bg-slate-950'>
      {/* Header */}
      <header className='fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800'>
        <div className='px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className='lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800'
            >
              {isSidebarOpen ? (
                <X className='w-5 h-5 text-slate-600 dark:text-slate-400' />
              ) : (
                <Menu className='w-5 h-5 text-slate-600 dark:text-slate-400' />
              )}
            </button>

            {/* Logo */}
            <Link href='/' className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>A</span>
              </div>
              <span className='font-semibold text-lg text-slate-900 dark:text-white'>
                @airauth / docs
              </span>
            </Link>
          </div>

          <div className='flex items-center gap-4'>
            {/* Search Bar */}
            <div className='hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg'>
              <Search className='w-4 h-4 text-slate-400' />
              <input
                type='text'
                placeholder='Search documentation...'
                className='bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none w-48 lg:w-64'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <kbd className='hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded text-xs text-slate-500 dark:text-slate-400'>
                ⌘K
              </kbd>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className='p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800'
            >
              {theme === 'dark' ? (
                <Sun className='w-5 h-5 text-slate-600 dark:text-slate-400' />
              ) : (
                <Moon className='w-5 h-5 text-slate-600' />
              )}
            </button>

            {/* GitHub Link */}
            <a
              href='https://github.com/n10l/airauth'
              target='_blank'
              rel='noopener noreferrer'
              className='p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800'
            >
              <ExternalLink className='w-5 h-5 text-slate-600 dark:text-slate-400' />
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className='pt-16 flex'>
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 pt-16 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto transition-transform lg:translate-x-0 lg:static lg:inset-0',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <nav className='px-4 py-6'>
            <Link
              href='/'
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg'
            >
              <Home className='w-4 h-4' />
              Overview
            </Link>

            {/* Sections */}
            {docsSections.map(section => (
              <div key={section.id} className='mb-6'>
                <h3 className='flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
                  <section.icon className='w-4 h-4' />
                  {section.title}
                </h3>
                <ul className='mt-2 space-y-1'>
                  {section.items.map(item => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                            isActive
                              ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                          )}
                        >
                          <ChevronRight
                            className={cn('w-3 h-3 transition-transform', isActive && 'rotate-90')}
                          />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className='flex-1 min-w-0'>{children}</main>
      </div>
    </div>
  );
}
