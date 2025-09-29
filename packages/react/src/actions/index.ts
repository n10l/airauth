'use client';

/**
 * Standalone authentication actions
 * These functions can be used outside of React components
 */

import type { SignInOptions, SignOutOptions } from '../types';

/**
 * Sign in with provider
 */
export async function signIn(provider: string, options?: SignInOptions): Promise<void> {
  const { callbackUrl = window.location.href, redirect = true, ...credentials } = options || {};

  try {
    const params = new URLSearchParams({
      callbackUrl,
    });

    if (provider === 'credentials' || provider === 'email') {
      // Handle credentials and email sign-in
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          credentials,
        }),
      });

      if (!response.ok) {
        throw new Error('Sign in failed');
      }

      if (redirect) {
        window.location.href = callbackUrl;
      }
    } else {
      // OAuth and Email sign-in
      const signinParams = new URLSearchParams({
        provider,
        callbackUrl,
      });

      if (redirect) {
        window.location.href = `/api/auth/signin?${signinParams.toString()}`;
      } else {
        // Open in popup window for non-redirect flow
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        window.open(
          `/api/auth/signin?${signinParams.toString()}`,
          'Sign In',
          `width=${width},height=${height},left=${left},top=${top}`
        );
      }
    }
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function signOut(options?: SignOutOptions): Promise<void> {
  const { callbackUrl = '/', redirect = true } = options || {};

  try {
    const response = await fetch('/api/auth/signout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ callbackUrl }),
    });

    if (!response.ok) {
      throw new Error('Sign out failed');
    }

    if (redirect) {
      window.location.href = callbackUrl;
    }
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}
