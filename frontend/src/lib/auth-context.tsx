'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  createContext,
  type ReactNode,
} from 'react';
import { ApiError, apiRequest } from './api';
import {
  clearSession,
  markValidated,
  setSession,
  useSession,
} from './session-store';
import type { AuthSession, LoginInput, RegisterInput, SessionUser } from './types';

/**
 * Client-side session.
 *
 * The JWT is kept in `localStorage` so a refresh does not sign the user out — a
 * deliberate MVP trade-off. A production deployment would prefer an httpOnly,
 * Secure cookie so the token cannot be read by injected script; that change is
 * local to `session-store.ts` and to the NestJS cookie strategy
 * (docs/decisions.md D14).
 */
type AuthContextValue = {
  user: SessionUser | null;
  token: string | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<SessionUser>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session, validated } = useSession();

  const token = session?.accessToken ?? null;
  const isLoading = token !== null && !validated;

  // Confirm a restored token with the API. An expired or tampered token is
  // cleared, which drops the app back to signed out. The check is asynchronous,
  // so it never blocks first paint of a signed-out visitor.
  useEffect(() => {
    if (!token || validated) return;

    let cancelled = false;
    const confirm = async () => {
      try {
        await apiRequest<SessionUser>('/auth/me', { token });
        if (!cancelled) markValidated();
      } catch (caught) {
        if (cancelled) return;
        if (caught instanceof ApiError && caught.statusCode === 401) {
          clearSession();
        } else {
          // The API is down rather than the token being bad: keep the session and
          // let the next request surface the problem, so a restart of the backend
          // does not sign everyone out.
          markValidated();
        }
      }
    };

    void confirm();
    return () => {
      cancelled = true;
    };
  }, [token, validated]);

  const login = useCallback(async (input: LoginInput) => {
    const session = await apiRequest<AuthSession>('/auth/login', {
      method: 'POST',
      body: input,
    });
    setSession(session);
    return session.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    await apiRequest<{ message: string }>('/auth/register', {
      method: 'POST',
      body: input,
    });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    router.push('/');
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, token, isLoading, login, register, logout }),
    [session, token, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}