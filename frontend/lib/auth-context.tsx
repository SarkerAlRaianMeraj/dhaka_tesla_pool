"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiClient, getErrorMessage, isUnauthorized } from "./apiClient";
import type { LoginData, RegisterData } from "./schemas";
import type { LoginResponse, RegisterResponse, SessionUser } from "./types";

/**
 * Client-side session state.
 *
 * There is deliberately nothing stored in `localStorage`: the JWT is an httpOnly
 * cookie that JavaScript cannot read (D15), so "am I signed in?" is answered by
 * asking the API. That costs one `GET /auth/me` on load and buys the fact that
 * no token is ever reachable by injected script.
 *
 * `isLoading` is true on the server render and on the first client render alike,
 * so the markup matches during hydration and no signed-out flash appears.
 */
type AuthContextValue = {
  user: SessionUser | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<SessionUser>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchSession = async (): Promise<void> => {
      try {
        const response = await apiClient.get<SessionUser>("/auth/me");
        if (!cancelled) setUser(response.data);
      } catch (error) {
        // 401 simply means signed out, which is the normal case on a first visit.
        // A network failure is also tolerated: the user simply appears signed out
        // and the next request surfaces the real problem.
        if (!cancelled && !isUnauthorized(error)) {
          console.error(getErrorMessage(error, "Session check failed"));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (data: LoginData): Promise<SessionUser> => {
    const response = await apiClient.post<LoginResponse>("/auth/login", data);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<void> => {
    await apiClient.post<RegisterResponse>("/auth/register", data);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      // The local state is cleared even if the request fails: the user asked to
      // leave, and the cookie expires on its own regardless.
      setUser(null);
      router.push("/");
    }
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
};