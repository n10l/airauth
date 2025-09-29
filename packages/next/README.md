# @airauth/next

[![npm version](https://img.shields.io/npm/v/@airauth/next?style=flat-square&logo=npm)](https://www.npmjs.com/package/@airauth/next)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@airauth/next?style=flat-square)](https://bundlephobia.com/package/@airauth/next)
[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

Next.js integration for AirAuth - Modern authentication for Next.js applications.

## 📦 Installation

```bash
npm install @airauth/next @airauth/core
# or
yarn add @airauth/next @airauth/core
# or
pnpm add @airauth/next @airauth/core
```

## 🚀 Quick Start

### 1. Create your auth configuration

```typescript
// app/api/auth/[...nextauth]/route.ts
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

### 2. Add SessionProvider to your app

```typescript
// app/layout.tsx
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

### 3. Use authentication in your components

```typescript
"use client"
import { useSession, signIn, signOut } from "@airauth/next/react"

export default function Component() {
  const { data: session } = useSession()

  if (session) {
    return (
      <>
        Signed in as {session.user?.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
    </>
  )
}
```

## 🔒 Middleware Protection

```typescript
// middleware.ts
export { default } from '@airauth/next/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

## 📖 Documentation

Visit [airauth.dev/docs](https://airauth.dev/docs) for full documentation.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## 📝 License

MIT © [n10l](https://github.com/n10l)
