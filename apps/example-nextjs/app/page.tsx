'use client';

// TODO: Uncomment when @airauth/next package is fully implemented
// import { useSession, signIn, signOut } from '@airauth/next'
import Link from 'next/link';
import { useState } from 'react';

export default function HomePage() {
  // Mock session for demo purposes
  const [mockSession, setMockSession] = useState<any>(null);

  const mockSignIn = () => {
    const session = {
      user: {
        name: 'Demo User',
        email: 'demo@example.com',
        image: 'https://avatars.githubusercontent.com/u/1?v=4',
      },
    };
    setMockSession(session);
    // Store in localStorage for dashboard access
    localStorage.setItem('mockSession', JSON.stringify(session));
  };

  const mockSignOut = () => {
    setMockSession(null);
    localStorage.removeItem('mockSession');
  };

  if (mockSession) {
    return (
      <div className='px-4 py-6 sm:px-0'>
        <div className='max-w-3xl mx-auto'>
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='px-4 py-5 sm:p-6'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                Welcome back, {mockSession.user?.name}!
              </h2>
              <div className='space-y-4'>
                <div className='flex items-center space-x-4'>
                  {mockSession.user?.image && (
                    <img
                      src={mockSession.user.image}
                      alt={mockSession.user.name}
                      className='h-16 w-16 rounded-full'
                    />
                  )}
                  <div>
                    <p className='text-sm text-gray-600'>Signed in as</p>
                    <p className='font-medium text-gray-900'>{mockSession.user?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className='p-6 border-t border-gray-200'>
              <div className='space-y-4'>
                <Link href='/dashboard'>
                  <button className='w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'>
                    Go to Dashboard
                  </button>
                </Link>
                <button
                  onClick={mockSignOut}
                  className='w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          <div className='mt-8 bg-white overflow-hidden shadow rounded-lg'>
            <div className='px-4 py-5 sm:p-6'>
              <h3 className='text-lg font-medium text-gray-900'>Session Details</h3>
            </div>
            <div className='p-6'>
              <pre className='text-sm bg-gray-50 p-4 rounded-lg overflow-auto'>
                {JSON.stringify(mockSession, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='px-4 py-6 sm:px-0'>
      <div className='max-w-6xl mx-auto'>
        {/* Hero Section */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl'>
            Welcome to <span className='text-blue-600'>AirAuth</span>
          </h1>
          <p className='mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl'>
            Modern, TypeScript-first authentication for Next.js applications
          </p>
        </div>

        {/* Demo Sign In Card */}
        <div className='max-w-md mx-auto mb-12'>
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='px-4 py-5 sm:p-6'>
              <h2 className='text-xl font-semibold text-gray-900'>Demo Sign In</h2>
              <p className='text-sm text-gray-600 mt-2'>
                This is a demo of the @airauth/next authentication flow
              </p>
            </div>
            <div className='p-6 space-y-4'>
              <button
                onClick={mockSignIn}
                className='w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
              >
                <svg className='w-5 h-5 mr-2' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>Sign in with Demo Account</span>
              </button>

              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-gray-300'></div>
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='px-2 bg-white text-gray-500'>Coming soon</span>
                </div>
              </div>

              <button
                disabled
                className='w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white opacity-50 cursor-not-allowed'
              >
                Sign in with Google
              </button>
              <button
                disabled
                className='w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white opacity-50 cursor-not-allowed'
              >
                Sign in with GitHub
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-6'>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4'>
                <svg
                  className='w-6 h-6 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-gray-900'>Secure by Default</h3>
              <p className='mt-2 text-sm text-gray-600'>
                Built-in CSRF protection, secure cookies, and JWT handling
              </p>
            </div>
          </div>

          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-6'>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4'>
                <svg
                  className='w-6 h-6 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-gray-900'>TypeScript Native</h3>
              <p className='mt-2 text-sm text-gray-600'>
                Full TypeScript support with comprehensive type definitions
              </p>
            </div>
          </div>

          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-6'>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4'>
                <svg
                  className='w-6 h-6 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 10V3L4 14h7v7l9-11h-7z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-gray-900'>Easy Integration</h3>
              <p className='mt-2 text-sm text-gray-600'>
                Simple setup with Next.js App Router and Server Components
              </p>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className='mt-12 bg-white overflow-hidden shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <h3 className='text-lg font-medium text-gray-900'>Quick Start</h3>
          </div>
          <div className='p-6'>
            <pre className='text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto'>
              <code>{`import { AirAuth } from "@airauth/next"
import GoogleProvider from "@airauth/next/providers/google"

export const { auth, signIn, signOut } = AirAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ]
})`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}