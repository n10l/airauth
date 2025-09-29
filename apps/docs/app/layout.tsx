import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { BackgroundPatterns } from '@/components/background-patterns';
import { Toaster } from 'sonner';
import DocsLayout from './docs-layout';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AirAuth Documentation',
  description:
    'Comprehensive documentation for AirAuth - Modern authentication library for Next.js applications.',
  keywords: ['authentication', 'nextjs', 'oauth', 'jwt', 'security', 'typescript', 'documentation'],
  authors: [{ name: 'n10l' }],
  openGraph: {
    title: 'AirAuth Documentation',
    description:
      'Comprehensive documentation for AirAuth - Modern authentication library for Next.js applications.',
    url: 'https://docs.airauth.dev',
    siteName: 'AirAuth Docs',
    images: [
      {
        url: 'https://docs.airauth.dev/og.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AirAuth Documentation',
    description:
      'Comprehensive documentation for AirAuth - Modern authentication library for Next.js applications.',
    images: ['https://docs.airauth.dev/og.png'],
    creator: '@_n10l_',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jakarta.variable} ${jetbrains.variable} font-jakarta antialiased`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <BackgroundPatterns />
          <DocsLayout>{children}</DocsLayout>
          <Toaster position='bottom-right' />
        </ThemeProvider>
      </body>
    </html>
  );
}
