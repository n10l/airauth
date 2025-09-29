# @airauth NextJS Example Application

A complete example demonstrating @airauth authentication integration with Next.js App Router.

## Features

- ✅ **Multiple Auth Providers**
  - Google OAuth
  - GitHub OAuth
  - Email/Password (Credentials)

- ✅ **Modern Next.js Features**
  - App Router with React Server Components
  - TypeScript support
  - Tailwind CSS styling
  - Middleware route protection

- ✅ **Authentication Features**
  - Session management
  - Protected routes
  - Sign in/out functionality
  - Session state updates
  - Automatic redirects

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Environment Setup

Copy the environment example file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OAuth provider credentials:

```env
# Required
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here-change-this-in-production

# Google OAuth (Get from https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (Get from https://github.com/settings/developers)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 3. OAuth Provider Setup

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized origins: `http://localhost:3000`
7. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
8. Copy the Client ID and Client Secret

#### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and Client Secret

### 4. Run the Application

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
nextjs-example/
├── app/
│   ├── api/auth/[...nextauth]/
│   │   └── route.ts              # AirAuth configuration
│   ├── dashboard/
│   │   └── page.tsx              # Protected dashboard route
│   ├── globals.css               # Global styles with Tailwind
│   ├── layout.tsx                # Root layout with SessionProvider
│   └── page.tsx                  # Home page with auth UI
├── middleware.ts                 # Route protection middleware
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── .env.example                  # Environment variables template
└── package.json                  # Dependencies and scripts
```

## Code Examples

### Basic Authentication Setup

```typescript
// app/api/auth/[...nextauth]/route.ts
import { AirAuth } from '@airauth/next';
import GoogleProvider from '@airauth/next/providers/google';
import GitHubProvider from '@airauth/next/providers/github';

const handler = AirAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
```

### Root Layout with SessionProvider

```tsx
// app/layout.tsx
import { SessionProvider } from '@airauth/next/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

### Using Authentication in Components

```tsx
'use client';

import { useSession, signIn, signOut } from '@airauth/next/react';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <p>Loading...</p>;

  if (session) {
    return (
      <>
        <p>Signed in as {session.user?.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }

  return (
    <>
      <p>Not signed in</p>
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
}
```

### Protected Server Component

```tsx
// app/dashboard/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div>
      <h1>Welcome {session.user?.name}</h1>
      <p>Email: {session.user?.email}</p>
    </div>
  );
}
```

### Middleware Protection

```typescript
// middleware.ts
export { default } from '@airauth/next/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

### Custom Sign In Page

```tsx
// app/auth/signin/page.tsx
'use client';

import { signIn } from '@airauth/next/react';

export default function SignInPage() {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <h1 className='text-3xl font-bold mb-8'>Sign In</h1>
      <div className='space-y-4'>
        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className='px-4 py-2 bg-blue-500 text-white rounded'
        >
          Sign in with Google
        </button>
        <button
          onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          className='px-4 py-2 bg-gray-800 text-white rounded'
        >
          Sign in with GitHub
        </button>
      </div>
    </div>
  );
}
```

### Protected API Route

```typescript
// app/api/protected/route.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'This is protected data',
    user: session.user,
  });
}
```

### Custom Credentials Provider

```typescript
// In your auth configuration
import CredentialsProvider from '@airauth/next/providers/credentials';

CredentialsProvider({
  name: 'credentials',
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(credentials) {
    // Add your authentication logic here
    if (credentials?.email === 'user@example.com' && credentials?.password === 'password') {
      return {
        id: '1',
        email: 'user@example.com',
        name: 'Demo User',
      };
    }
    return null;
  },
});
```

### Session Management Hook

```tsx
'use client';

import { useSession } from '@airauth/next/react';

export function UserProfile() {
  const { data: session, status, update } = useSession();

  const handleUpdateName = async (newName: string) => {
    await update({
      user: {
        ...session?.user,
        name: newName,
      },
    });
  };

  if (status === 'loading') return <p>Loading...</p>;
  if (!session) return <p>Not signed in</p>;

  return (
    <div>
      <p>Name: {session.user?.name}</p>
      <button onClick={() => handleUpdateName('New Name')}>Update Name</button>
    </div>
  );
}
```

## Authentication Flow

1. **Sign In**: Users can sign in via Google, GitHub, or email/password
2. **Session Creation**: AirAuth creates secure JWT tokens
3. **Route Protection**: Middleware protects `/dashboard` routes
4. **Session Access**: Components access session via `useSession` hook
5. **Sign Out**: Users can sign out with automatic cleanup

## Demo Credentials

For the email/password provider, you can use:

- **Email**: user@example.com
- **Password**: password

> ⚠️ **Security Note**: This is for demo purposes only. In production, implement proper password validation and database storage.

## Development Features

- **Hot Reload**: Automatic reloading during development
- **Type Safety**: Full TypeScript support with AirAuth types
- **Debugging**: Comprehensive error handling and logging
- **Session Updates**: Real-time session state management

## Production Deployment

1. Set `NODE_ENV=production`
2. Update `NEXTAUTH_URL` to your production domain
3. Use a secure `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
4. Update OAuth redirect URIs in provider settings
5. Configure your database/session store
6. Enable HTTPS for security

## Troubleshooting

### Common Issues

1. **OAuth Redirect Mismatch**
   - Verify redirect URIs in provider settings
   - Check `NEXTAUTH_URL` matches your domain

2. **Session Not Persisting**
   - Verify `NEXTAUTH_SECRET` is set
   - Check browser cookies are enabled

3. **TypeScript Errors**
   - Run `npm run type-check`
   - Ensure all AirAuth packages are installed

4. **Styling Issues**
   - Run `npm run build` to check for CSS conflicts
   - Verify Tailwind configuration

### Debug Mode

Enable debug logging in development:

```env
DEBUG=1
```

This will show detailed authentication flow logs in the console.

## Learn More

- [AirAuth Documentation](https://airauth.dev)
- [Next.js App Router](https://nextjs.org/docs/app)
- [@airauth/next on npm](https://www.npmjs.com/package/@airauth/next)

## License

This example is open source and available under the [MIT License](LICENSE).
