'use client';

import { motion } from 'framer-motion';
import { Shield, Github, Mail, Key, Check, Copy, ArrowRight, Globe } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function ProvidersPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    google: `import GoogleProvider from "@airauth/next/providers/google"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
}`,

    github: `import GithubProvider from "@airauth/next/providers/github"

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    })
  ],
}`,

    email: `import EmailProvider from "@airauth/next/providers/email"

export const authOptions = {
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    })
  ],
}`,

    credentials: `import CredentialsProvider from "@airauth/next/providers/credentials"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied
        const user = { id: "1", name: "J Smith", email: "jsmith@example.com" }

        if (user) {
          // Any object returned will be saved in 'user' property of the JWT
          return user
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null
        }
      }
    })
  ],
}`,

    multiple: `import GoogleProvider from "@airauth/next/providers/google"
import GithubProvider from "@airauth/next/providers/github"
import DiscordProvider from "@airauth/next/providers/discord"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
}`,

    customProvider: `import { OAuthConfig, OAuthUserConfig } from "@airauth/next/providers"

interface CustomProfile {
  sub: string
  name: string
  email: string
  picture: string
}

export default function CustomProvider<P extends CustomProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "custom",
    name: "Custom Provider",
    type: "oauth",
    authorization: "https://custom.com/oauth/authorize",
    token: "https://custom.com/oauth/token",
    userinfo: "https://custom.com/oauth/userinfo",
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      }
    },
    ...options,
  }
}`,
  };

  const popularProviders = [
    { name: 'Google', icon: '🔵', description: 'OAuth 2.0 provider by Google' },
    { name: 'GitHub', icon: '⚫', description: 'OAuth 2.0 provider by GitHub' },
    { name: 'Discord', icon: '🟣', description: 'OAuth 2.0 provider by Discord' },
    { name: 'Facebook', icon: '🔵', description: 'OAuth 2.0 provider by Facebook' },
    { name: 'Twitter', icon: '🟦', description: 'OAuth 2.0 provider by Twitter' },
    { name: 'LinkedIn', icon: '🔷', description: 'OAuth 2.0 provider by LinkedIn' },
    { name: 'Auth0', icon: '🟠', description: 'OAuth 2.0 provider by Auth0' },
    { name: 'Apple', icon: '⚫', description: 'OAuth 2.0 provider by Apple' },
  ];

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl'>
            <Shield className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Providers</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Configure authentication providers for OAuth, email, and credential-based authentication
          with @airauth/next.
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
            @airauth/next supports multiple authentication providers out of the box, including OAuth
            providers like Google and GitHub, email-based authentication, and custom credential
            providers. You can use multiple providers simultaneously to give users flexible sign-in
            options.
          </p>
        </div>

        {/* Provider Types */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-6'>
          <div className='p-4 bg-slate-100 dark:bg-slate-800 rounded-lg'>
            <Globe className='w-5 h-5 text-blue-600 mb-2' />
            <h3 className='font-semibold text-slate-900 dark:text-white mb-1'>OAuth Providers</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Google, GitHub, Discord, and 20+ more
            </p>
          </div>
          <div className='p-4 bg-slate-100 dark:bg-slate-800 rounded-lg'>
            <Mail className='w-5 h-5 text-green-600 mb-2' />
            <h3 className='font-semibold text-slate-900 dark:text-white mb-1'>Email Provider</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Magic link authentication via email
            </p>
          </div>
          <div className='p-4 bg-slate-100 dark:bg-slate-800 rounded-lg'>
            <Key className='w-5 h-5 text-purple-600 mb-2' />
            <h3 className='font-semibold text-slate-900 dark:text-white mb-1'>Credentials</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Username/password and custom auth
            </p>
          </div>
        </div>
      </motion.section>

      {/* Popular Providers */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-6'>
          Popular Providers
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          {popularProviders.map((provider, index) => (
            <motion.div
              key={provider.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className='p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-colors'
            >
              <div className='text-2xl mb-2'>{provider.icon}</div>
              <h3 className='font-medium text-slate-900 dark:text-white'>{provider.name}</h3>
              <p className='text-xs text-slate-600 dark:text-slate-400'>{provider.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Configuration Examples */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-6'>
          Configuration Examples
        </h2>

        <div className='space-y-8'>
          {/* Google Provider */}
          <div>
            <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2'>
              <div className='w-6 h-6 text-blue-600'>🔵</div>
              Google Provider
            </h3>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.google, 'google')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'google' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.google}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* GitHub Provider */}
          <div>
            <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2'>
              <Github className='w-6 h-6' />
              GitHub Provider
            </h3>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.github, 'github')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'github' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.github}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Email Provider */}
          <div>
            <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2'>
              <Mail className='w-6 h-6' />
              Email Provider
            </h3>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.email, 'email')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'email' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.email}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Credentials Provider */}
          <div>
            <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2'>
              <Key className='w-6 h-6' />
              Credentials Provider
            </h3>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.credentials, 'credentials')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'credentials' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.credentials}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Multiple Providers */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Multiple Providers
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          You can configure multiple providers to give users different sign-in options:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.multiple, 'multiple')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'multiple' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.multiple}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Custom Provider */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Custom Provider
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create a custom OAuth provider for services not included by default:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.customProvider, 'customProvider')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'customProvider' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.customProvider}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Key Features */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>Key Features</h2>
        <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
          <ul className='space-y-3'>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                20+ built-in OAuth providers
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Email magic link authentication
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Custom credential-based authentication
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Multiple providers simultaneously
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Easy custom provider creation
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                TypeScript support with full type safety
              </span>
            </li>
          </ul>
        </div>
      </motion.section>

      {/* Related Links */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Related Documentation
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <a
            href='/docs/oauth-flow'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>OAuth Flow</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Understanding OAuth authentication flow
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/credentials'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Credentials</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Custom credential authentication
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
                Advanced configuration options
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/sessions'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Sessions</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Managing user sessions</p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
