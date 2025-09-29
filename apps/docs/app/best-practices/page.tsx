'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle,
  Shield,
  Zap,
  AlertTriangle,
  Lock,
  Key,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function BestPracticesPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const securityExample = `// Security-first configuration
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  // Use secure session settings
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes for sensitive apps
  },
  
  // Strong JWT configuration
  jwt: {
    secret: process.env.NEXTAUTH_SECRET, // Generate with: openssl rand -base64 32
    maxAge: 15 * 60,
  },
  
  // Security callbacks
  callbacks: {
    async signIn({ user, account, profile }) {
      // Implement email domain whitelist
      const allowedDomains = ["company.com", "partner.com"]
      if (user.email && !allowedDomains.some(domain => user.email!.endsWith(\`@\${domain}\`))) {
        return false
      }
      return true
    },
    
    async session({ session, token }) {
      // Add user ID and role to session
      session.user.id = token.sub
      session.user.role = token.role
      return session
    },
    
    async jwt({ token, user }) {
      // Add custom claims
      if (user) {
        token.role = user.role || "user"
      }
      return token
    }
  },
  
  // Security events
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log security events
      console.log(\`Sign in: \${user.email} via \${account.provider}\`)
      
      // Alert on new user registrations
      if (isNewUser) {
        // Send notification to admin
        await notifyAdmin(\`New user registered: \${user.email}\`)
      }
    }
  }
}`;

  const bestPractices = [
    {
      category: 'Security',
      icon: Shield,
      color: 'from-red-500 to-pink-500',
      practices: [
        'Always use HTTPS in production',
        'Generate strong NEXTAUTH_SECRET (32+ characters)',
        'Set appropriate session expiration times',
        'Validate user permissions in callbacks',
        'Implement email domain whitelisting when needed',
        'Use database sessions for sensitive applications',
        'Enable CSRF protection',
        'Rotate secrets periodically',
      ],
    },
    {
      category: 'Performance',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      practices: [
        'Use JWT sessions for better performance',
        'Implement proper caching strategies',
        'Optimize database queries in adapters',
        'Use middleware efficiently with specific matchers',
        'Minimize session data size',
        'Use edge functions when possible',
        'Cache provider configurations',
        'Implement proper connection pooling',
      ],
    },
    {
      category: 'User Experience',
      icon: CheckCircle,
      color: 'from-blue-500 to-indigo-500',
      practices: [
        'Provide clear loading states',
        'Handle authentication errors gracefully',
        'Implement proper redirects after sign-in',
        'Show meaningful error messages',
        'Support multiple authentication methods',
        'Implement remember me functionality',
        'Provide easy sign-out options',
        'Handle expired sessions smoothly',
      ],
    },
    {
      category: 'Development',
      icon: Key,
      color: 'from-green-500 to-emerald-500',
      practices: [
        'Use TypeScript for type safety',
        'Implement comprehensive error handling',
        'Set up proper development/production configs',
        'Use environment variables for secrets',
        'Implement proper testing strategies',
        'Document custom configurations',
        'Use version control for configurations',
        'Monitor authentication metrics',
      ],
    },
  ];

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl'>
            <CheckCircle className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Best Practices</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Essential security, performance, and development best practices for @airauth/next
          implementations.
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
            Following these best practices will help you build secure, performant, and maintainable
            authentication systems with @airauth/next. These guidelines are based on real-world
            implementations and security recommendations.
          </p>
        </div>
      </motion.section>

      {/* Best Practices Categories */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-6'>
          Best Practices by Category
        </h2>

        <div className='space-y-6'>
          {bestPractices.map((category, index) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6'
            >
              <div className='flex items-center gap-3 mb-4'>
                <div className={`p-2 bg-gradient-to-br ${category.color} rounded-lg`}>
                  <category.icon className='w-5 h-5 text-white' />
                </div>
                <h3 className='text-xl font-semibold text-slate-900 dark:text-white'>
                  {category.category}
                </h3>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {category.practices.map((practice, practiceIndex) => (
                  <div key={practiceIndex} className='flex items-start gap-3'>
                    <div className='w-5 h-5 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mt-0.5'>
                      <Check className='w-3 h-3 text-green-600 dark:text-green-400' />
                    </div>
                    <span className='text-sm text-slate-700 dark:text-slate-300'>{practice}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Security-First Example */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Security-First Configuration
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Here's an example of a security-focused @airauth/next configuration:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(securityExample, 'security')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'security' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <svg
                className='w-4 h-4 text-slate-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                />
              </svg>
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {securityExample}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Critical Security Warnings */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Critical Security Considerations
        </h2>

        <div className='space-y-4'>
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='w-5 h-5 text-red-600 dark:text-red-400 mt-0.5' />
              <div>
                <h3 className='font-semibold text-red-900 dark:text-red-400 mb-2'>
                  Production Environment
                </h3>
                <ul className='text-sm text-red-800 dark:text-red-300 space-y-1'>
                  <li>• Never use HTTP in production - always HTTPS</li>
                  <li>• Set NEXTAUTH_URL to your production domain</li>
                  <li>• Use strong, unique secrets for NEXTAUTH_SECRET</li>
                  <li>• Enable secure cookie settings</li>
                </ul>
              </div>
            </div>
          </div>

          <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4'>
            <div className='flex items-start gap-3'>
              <Lock className='w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5' />
              <div>
                <h3 className='font-semibold text-amber-900 dark:text-amber-400 mb-2'>
                  Data Protection
                </h3>
                <ul className='text-sm text-amber-800 dark:text-amber-300 space-y-1'>
                  <li>• Never store sensitive data in JWT payloads</li>
                  <li>• Use database sessions for sensitive applications</li>
                  <li>• Implement proper session cleanup</li>
                  <li>• Follow GDPR/privacy regulations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Testing Recommendations */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Testing Strategies
        </h2>
        <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
          <ul className='space-y-3'>
            <li className='flex items-center gap-3'>
              <Check className='w-5 h-5 text-green-600 dark:text-green-400' />
              <span className='text-slate-700 dark:text-slate-300'>
                Test authentication flows in different browsers
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <Check className='w-5 h-5 text-green-600 dark:text-green-400' />
              <span className='text-slate-700 dark:text-slate-300'>
                Verify session expiration and renewal
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <Check className='w-5 h-5 text-green-600 dark:text-green-400' />
              <span className='text-slate-700 dark:text-slate-300'>
                Test error scenarios and edge cases
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <Check className='w-5 h-5 text-green-600 dark:text-green-400' />
              <span className='text-slate-700 dark:text-slate-300'>
                Validate middleware protection
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <Check className='w-5 h-5 text-green-600 dark:text-green-400' />
              <span className='text-slate-700 dark:text-slate-300'>
                Test provider configurations
              </span>
            </li>
          </ul>
        </div>
      </motion.section>

      {/* Related Links */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Related Documentation
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
            href='/docs/common-issues'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Common Issues</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Troubleshooting guide</p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/protected-routes'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Protected Routes</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Route security implementation
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/monitoring'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Monitoring</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Monitoring and observability
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
