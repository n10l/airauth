[!IMPORTANT]
🚀 AirAuth is evolving into something much bigger!

We're officially moving beyond AirAuth to build something ambitious: a next-generation, enterprise-grade frontend ecosystem.

Our mission? To redefine how the frontend industry builds, scales, and innovates.

We're building an ecosystem focused on:

🏗️ Engineering at Scale: Reinventing how we architect and build highly complex, large-scale frontend applications.
💎 Engineering Excellence: Bringing industry-leading practices, robust architecture, performance, security, and maintainability to the forefront.
🌍 More Opportunities for Everyone: Creating an ecosystem that helps bring frontend opportunities back to the market, empowers developers, and opens new doors for talent.
🤝 Shared Success: Building a place where developers, contributors, innovators, and businesses all have an opportunity to grow and succeed together.

We believe the future of frontend engineering deserves something better. Not just another framework, library, or boilerplate, but an entire ecosystem built for the next generation of software.

AirAuth will no longer receive active development as we shift our focus entirely toward this vision.

🔥 Something BIG is coming.

We're working hard behind the scenes, and we're excited to bring you along on this journey.

Launching this week. Stay tuned!

The next chapter of frontend engineering starts here.

There will be a place for everyone in this ecosystem. Let's build the future together. ❤️

---

# AirAuth 🔐

Modern, TypeScript-first authentication library for Next.js (Beta) and React Router V7 (Upcoming).

[![npm version](https://img.shields.io/npm/v/@airauth/next?style=flat-square&logo=npm)](https://www.npmjs.com/package/@airauth/next)
[![npm downloads](https://img.shields.io/npm/dm/@airauth/next?style=flat-square&logo=npm)](https://www.npmjs.com/package/@airauth/next)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@airauth/next?style=flat-square)](https://bundlephobia.com/package/@airauth/next)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/n10l/airauth/blob/main/CONTRIBUTING.md)
[![GitHub Stars](https://img.shields.io/github/stars/n10l/airauth?style=flat-square&logo=github)](https://github.com/n10l/airauth)
[![Twitter Follow](https://img.shields.io/twitter/follow/_n10l_?style=flat-square&logo=twitter)](https://twitter.com/_n10l_)

> ⚠️ **Warning**
> This project is on its first release. I'm still trying out the idea. It has not been used in production.

![AirAuth Landing Page](./web-screenshot.jpg)

## 🚀 Features

- **TypeScript First**: Built from the ground up with TypeScript for excellent type safety
- **Next.js 14/15 Support**: Full App Router and Server Components support
- **Multiple Providers**: OAuth (Google, GitHub, etc.), Credentials, Email/Password
- **JWT & Session Management**: Secure token handling with refresh capabilities
- **Database Adapters**: Prisma, MongoDB, PostgreSQL, MySQL support
- **Middleware Protection**: Route protection with Next.js middleware
- **React Router V7 Ready**: Coming soon - full support for React Router

## 📦 Packages

| Package                                                | Version      | Description                 |
| ------------------------------------------------------ | ------------ | --------------------------- |
| [@airauth/core](./packages/core)                       | 1.0.0-beta.0 | Core authentication library |
| [@airauth/next](./packages/next)                       | 1.0.0-beta.0 | Next.js integration         |
| [@airauth/react](./packages/react)                     | 1.0.0-beta.0 | React hooks and components  |
| [@airauth/adapter-prisma](./packages/adapter-prisma)   | 1.0.0-beta.0 | Prisma database adapter     |
| [@airauth/react-router-v7](./packages/react-router-v7) | Coming Soon  | React Router V7 integration |

## 🏃‍♂️ Quick Start

### Installation

```bash
npm install @airauth/next @airauth/core
# or
yarn add @airauth/next @airauth/core
# or
pnpm add @airauth/next @airauth/core
```

### Basic Setup

1. **Create your auth configuration** (`app/api/auth/[...nextauth]/route.ts`):

```typescript
import { AirAuth } from '@airauth/next';
import GoogleProvider from '@airauth/next/providers/google';

const handler = AirAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
});

export { handler as GET, handler as POST };
```

2. **Wrap your app with SessionProvider** (`app/layout.tsx`):

```typescript
import { SessionProvider } from "@airauth/next/react"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
```

3. **Use authentication in your components**:

```typescript
"use client"

import { useSession, signIn, signOut } from "@airauth/next/react"

export default function Component() {
  const { data: session, status } = useSession()

  if (status === "authenticated") {
    return (
      <>
        <p>Signed in as {session.user?.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }

  return <button onClick={() => signIn()}>Sign in</button>
}
```

## 📖 Documentation

Visit [airauth.dev](https://airauth.dev) for full documentation, including:

- [Getting Started](https://airauth.dev/docs/installation)
- [Configuration](https://airauth.dev/docs/configuration)
- [Providers](https://airauth.dev/docs/providers)
- [Database Adapters](https://airauth.dev/docs/database-adapters)
- [API Reference](https://airauth.dev/docs/api-routes)

### 📺 Tutorials (Coming Soon!)

We're working on comprehensive video tutorials and guides to help you get started:

- Step-by-step integration guide
- Building a complete auth system
- Advanced authentication patterns
- Best practices and security tips

Stay tuned for updates!

## 🎯 Examples

Check out our examples in the apps directory:

- [Next.js Example](./apps/example-nextjs) - Complete Next.js App Router example
- React Router Example (Coming Soon)

## 🛠️ Development

[![Build Status](https://img.shields.io/github/actions/workflow/status/n10l/airauth/ci.yml?style=flat-square)](https://github.com/n10l/airauth/actions)
[![Test Coverage](https://img.shields.io/codecov/c/github/n10l/airauth?style=flat-square)](https://codecov.io/gh/n10l/airauth)
[![Code Quality](https://img.shields.io/codacy/grade/n10l/airauth?style=flat-square)](https://www.codacy.com/gh/n10l/airauth)

This is a monorepo managed with [Turbo](https://turbo.build/) and [pnpm](https://pnpm.io/).

### Setup

```bash
# Clone the repository
git clone https://github.com/n10l/airauth.git
cd airauth

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start development mode
pnpm dev
```

### Project Structure

```
airauth/
├── packages/
│   ├── core/          # Core authentication library
│   ├── next/          # Next.js integration
│   ├── react/         # React hooks and components
│   └── adapter-*/     # Database adapters
├── apps/
│   ├── docs/             # Documentation site
│   └── example-nextjs/    # Example Next.js app
└── turbo.json         # Turbo configuration
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Disable Next.js telemetry
NEXT_TELEMETRY_DISABLED=1

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## 🤝 Contributing

We love contributions and encourage you to experiment with AirAuth! Whether you're fixing bugs, adding features, improving documentation, or sharing ideas - every contribution matters.

### How You Can Help

- 🐛 **Report bugs** and help us improve stability
- 💡 **Suggest features** that would make authentication better
- 📝 **Improve documentation** to help others get started
- 🧪 **Experiment freely** - try new approaches and share what you learn
- 🌍 **Add translations** to make AirAuth accessible globally
- ⭐ **Star the repo** to show your support

### Getting Started

1. Fork the repository and clone it locally
2. Create your feature branch (`git checkout -b feature/amazing-idea`)
3. Make your changes and test thoroughly
4. Commit with clear messages (`git commit -m 'Add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-idea`)
6. Open a Pull Request and tell us about your changes!

Don't hesitate to open an issue or discussion if you have questions. We're here to help and excited to see what you build!

See our [Contributing Guide](CONTRIBUTING.md) for detailed guidelines.

## 📝 License

MIT © [n10l](https://github.com/n10l)

## 🙏 Acknowledgments

AirAuth is inspired by the excellent work of the [NextAuth.js](https://github.com/nextauthjs/next-auth) team and its contributors, particularly [Balázs Orbán](https://github.com/balazsorban44) and the entire NextAuth.js community. Their pioneering work in creating a flexible authentication solution for Next.js has set the standard for developer-friendly auth libraries.

While AirAuth is built from the ground up with a focus on TypeScript-first design and modern Next.js features, we deeply appreciate the patterns and developer experience principles established by NextAuth.js. We aim to build upon these foundations while exploring new approaches to authentication in the evolving Javascript ecosystem.

## 🔗 Links

- [Website](https://airauth.dev)
- [Documentation](https://airauth.dev/docs)
- [GitHub](https://github.com/n10l/airauth)
- [npm](https://www.npmjs.com/org/airauth)

---

**AirAuth** - Modern authentication for modern applications.
