'use client';

/**
 * Sign In component
 */

import React from 'react';
import { useAuth } from '../hooks/use-auth';
import type { SignInProps } from '../types';

/**
 * Sign In button component
 *
 * @example
 * ```tsx
 * import { SignIn } from '@airauth/react'
 *
 * // Single provider
 * <SignIn provider="github" />
 *
 * // Multiple providers
 * <SignIn providers={['github', 'google', 'discord']} />
 *
 * // Custom children
 * <SignIn provider="github">
 *   <span>Login with GitHub</span>
 * </SignIn>
 * ```
 */
export function SignIn({
  provider,
  providers,
  callbackUrl,
  className = '',
  children,
  onSuccess,
  onError,
}: SignInProps) {
  const { signIn } = useAuth();

  const handleSignIn = async (providerId: string) => {
    try {
      await signIn(providerId, { callbackUrl });
      if (onSuccess) {
        // Note: onSuccess would be called after redirect/session update
        // This is a simplified version
      }
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
    }
  };

  // Single provider
  if (provider) {
    return (
      <button className={className} onClick={() => handleSignIn(provider)} type='button'>
        {children || `Sign in with ${provider}`}
      </button>
    );
  }

  // Multiple providers
  if (providers && providers.length > 0) {
    return (
      <div className={className}>
        {providers.map(providerId => (
          <button
            key={providerId}
            onClick={() => handleSignIn(providerId)}
            type='button'
            style={{ display: 'block', margin: '8px 0' }}
          >
            Sign in with {providerId}
          </button>
        ))}
      </div>
    );
  }

  // Default: show all providers
  return (
    <div className={className}>
      <button onClick={() => handleSignIn('github')} type='button'>
        Sign in with GitHub
      </button>
      <button onClick={() => handleSignIn('google')} type='button'>
        Sign in with Google
      </button>
    </div>
  );
}
