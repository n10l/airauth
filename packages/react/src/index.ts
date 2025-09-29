/**
 * @airauth/react
 * React hooks and components for AirAuth
 */

// Providers
export { SessionProvider, useSessionContext } from './providers/session-provider';

// Hooks
export { useSession } from './hooks/use-session';
export { useAuth } from './hooks/use-auth';

// Actions (standalone functions)
export { signIn, signOut } from './actions';

// Components
export { SignIn } from './components/sign-in';
export { SignOut } from './components/sign-out';
export { AuthGuard } from './components/auth-guard';

// Types
export type {
  SessionProviderProps,
  SessionContextValue,
  UseSessionOptions,
  UseSessionReturn,
  UseAuthReturn,
  SignInProps,
  SignOutProps,
  AuthGuardProps,
} from './types';
