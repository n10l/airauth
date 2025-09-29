/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the @airauth packages
  transpilePackages: ['@airauth/core', '@airauth/next'],

  // Environment variables to expose to client-side
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },

  // Image domains for OAuth providers
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/u/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'graph.microsoft.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Redirects for auth routes
  async redirects() {
    return [
      {
        source: '/auth',
        destination: '/api/auth/signin',
        permanent: false,
      },
      {
        source: '/login',
        destination: '/api/auth/signin',
        permanent: false,
      },
      {
        source: '/logout',
        destination: '/api/auth/signout',
        permanent: false,
      },
    ];
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // TypeScript configuration
  typescript: {
    // Enable type checking in production builds
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Enable ESLint during builds
    ignoreDuringBuilds: false,
  },

  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Output configuration for deployment
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,

  // PoweredByHeader
  poweredByHeader: false,

  // Compression
  compress: true,

  // Generate ETags for static files
  generateEtags: true,

  // Trailing slash configuration
  trailingSlash: false,
};

module.exports = nextConfig;
