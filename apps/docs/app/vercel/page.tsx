'use client';

import { motion } from 'framer-motion';
import { Cloud, Check, Copy, ArrowRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function VercelPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    envVars: `# .env.local (for development)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# .env (for Vercel production - set via dashboard)
NEXTAUTH_URL=https://yourapp.vercel.app
NEXTAUTH_SECRET=production-secret-here

# Provider credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret`,

    vercelJson: `// vercel.json
{
  "functions": {
    "app/api/auth/[...nextauth]/route.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXTAUTH_URL": "https://yourapp.vercel.app"
  }
}`,

    deployScript: `// package.json scripts
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "deploy": "vercel --prod",
    "deploy:preview": "vercel"
  }
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl'>
            <Cloud className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Vercel Deployment</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Deploy your @airauth/next application to Vercel with best practices.
        </p>
      </motion.div>

      {/* Overview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>Overview</h2>
        <div className='prose prose-slate dark:prose-invert max-w-none'>
          <p className='text-slate-600 dark:text-slate-400'>
            Deploy your Next.js application with @airauth/next to Vercel with zero configuration.
            This guide covers environment setup, domain configuration, and production best practices
            for secure authentication in serverless environments.
          </p>
        </div>
      </motion.section>

      {/* Environment Variables */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Environment Variables Setup
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Configure your environment variables in Vercel dashboard:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.envVars, 'envVars')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'envVars' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.envVars}
          </SyntaxHighlighter>
        </div>
        <div className='mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
          <h4 className='font-semibold text-blue-900 dark:text-blue-400 mb-2'>
            Vercel Dashboard Steps:
          </h4>
          <ol className='text-sm text-blue-800 dark:text-blue-300 space-y-1'>
            <li>1. Go to your Vercel project settings</li>
            <li>2. Navigate to "Environment Variables"</li>
            <li>3. Add each variable for Production, Preview, and Development</li>
            <li>4. Redeploy your application</li>
          </ol>
        </div>
      </motion.section>

      {/* Deployment Steps */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Deployment Process
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3'>
              1. Connect Repository
            </h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Link your GitHub, GitLab, or Bitbucket repository to Vercel.
            </p>
          </div>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3'>
              2. Configure Settings
            </h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Set environment variables and build settings in Vercel dashboard.
            </p>
          </div>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3'>3. Deploy</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Push to your main branch or use Vercel CLI for manual deployment.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Production Best Practices */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Production Best Practices
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6'>
            <h3 className='font-semibold text-green-900 dark:text-green-400 mb-3'>✅ Security</h3>
            <ul className='space-y-2 text-sm text-green-800 dark:text-green-300'>
              <li>• Use strong NEXTAUTH_SECRET (32+ characters)</li>
              <li>• Enable HTTPS-only cookies</li>
              <li>• Configure secure redirect URLs</li>
              <li>• Set up custom domain with SSL</li>
            </ul>
          </div>
          <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6'>
            <h3 className='font-semibold text-blue-900 dark:text-blue-400 mb-3'>🚀 Performance</h3>
            <ul className='space-y-2 text-sm text-blue-800 dark:text-blue-300'>
              <li>• Use Edge Runtime when possible</li>
              <li>• Configure appropriate cache headers</li>
              <li>• Set function timeout limits</li>
              <li>• Monitor function execution time</li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Related Links */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Related Documentation
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <a
            href='/docs/installation'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Installation</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Get started with @airauth/next
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/configuration'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Configuration</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Configure your authentication
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
