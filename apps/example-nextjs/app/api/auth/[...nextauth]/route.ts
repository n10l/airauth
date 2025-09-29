import { NextAirAuth } from '@airauth/next';

// Placeholder configuration - will be implemented when providers are available
const { handlers, auth, signIn, signOut } = NextAirAuth({
  providers: [
    // Providers will be configured here once available
    // Example:
    // Google({ clientId: process.env.GOOGLE_CLIENT_ID! })
  ],

  // Callbacks will be configured once the library is fully implemented

  // Additional configuration will be added as features are implemented
});

// Export handlers for Next.js route
export const GET = handlers.GET;
export const POST = handlers.POST;

// Export auth functions
export { auth, signIn, signOut };

// Export with alias names for convenience
export { auth as getSession };
export { signIn as doSignIn };
export { signOut as doSignOut };
