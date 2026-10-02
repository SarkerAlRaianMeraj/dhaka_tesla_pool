import axios, { AxiosError } from "axios";

/**
 * The single axios instance the whole app uses. `fetch` is not used anywhere:
 * `frontend/rules.md` names axios as the only HTTP client.
 *
 * `withCredentials: true` is what makes the httpOnly session cookie work - the
 * browser only stores and sends it on cross-origin requests when this is set, and
 * the API only answers with `Access-Control-Allow-Credentials`.
 *
 * The base URL comes from `NEXT_PUBLIC_API_ENDPOINT` so no URL is ever hardcoded;
 * Next.js inlines `NEXT_PUBLIC_*` into the client bundle at build time, which is
 * why the container build takes it as a build argument.
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_ENDPOINT ?? "http://localhost:3000/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/** A message safe to show a user, extracted from whichever shape came back. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    if (Array.isArray(data?.message)) return data.message.join(" ");
    if (typeof data?.message === "string") return data.message;
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** 401 means the session is gone or expired, which is what drives sign-out. */
export function isUnauthorized(error: unknown): boolean {
  return (
    error instanceof AxiosError && error.response?.status === 401
  );
}