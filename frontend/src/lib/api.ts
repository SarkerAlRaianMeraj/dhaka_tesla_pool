/**
 * Single place where the browser talks to the API.
 *
 * The API is addressed directly on port 3000 rather than through a Next.js proxy:
 * for a development MVP that keeps one obvious path for a request, so the demo
 * and the network tab agree. Phase 8 introduces the reverse proxy for the
 * container build, and this file is the only thing that has to change.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export type ApiErrorBody = {
  statusCode: number;
  error: string;
  message: string | string[];
  requestId?: string;
};

export class ApiError extends Error {
  readonly statusCode: number;
  readonly fieldErrors: string[];

  constructor(statusCode: number, body: Partial<ApiErrorBody> | undefined) {
    const message = Array.isArray(body?.message)
      ? body.message.join(' ')
      : (body?.message ?? 'Something went wrong. Please try again.');
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.fieldErrors = Array.isArray(body?.message) ? body.message : [];
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  query?: Record<string, string | number | undefined>;
};

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, token, query }: RequestOptions = {},
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });

  if (!response.ok) {
    let parsed: ApiErrorBody | undefined;
    try {
      parsed = (await response.json()) as ApiErrorBody;
    } catch {
      // A proxy or crash can return HTML; the status code still tells the user
      // something useful, so the generic message stands.
    }
    throw new ApiError(response.status, parsed);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}