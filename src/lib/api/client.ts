// Centralised, typed API client (Frontend PRD §7).
// Adds base URL, sends auth cookies, and normalises errors so the UI
// can map them consistently to toasts / inline messages.

import { getAccessToken, getRefreshToken, updateAccessToken, clearTokens } from "@/lib/utils/token-storage";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string; // Optional access token for authenticated requests
}

/**
 * The access token is short-lived (15m) by design — a 401 mid-session is the
 * normal, expected way to find out it expired, not proof the session is
 * dead. Every caller routes through this so a refresh only ever happens
 * once even if several requests 401 at the same moment.
 */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;

      const json = await res.json();
      const { accessToken, expiresIn } = json.data ?? json;
      if (!accessToken) return null;

      updateAccessToken(accessToken, expiresIn);
      return accessToken as string;
    } catch {
      return null;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * A 401 that survives a refresh attempt means the session is genuinely
 * dead (refresh token itself expired/revoked) — only then do we clear
 * tokens and redirect to login. A 401 with no token to begin with (e.g. a
 * bad-credentials login attempt) is left alone.
 */
function handleUnauthorized(hadToken: boolean) {
  if (!hadToken || typeof window === "undefined") return;
  clearTokens();

  if (typeof (window as unknown as { toast?: { error: (msg: string) => void } }).toast?.error === "function") {
    (window as unknown as { toast: { error: (msg: string) => void } }).toast.error("Session expired. Please log in again.");
  }

  const currentPath = window.location.pathname;
  if (!currentPath.startsWith("/login")) {
    window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
  }
}

async function doFetch(
  path: string,
  options: RequestOptions,
  accessToken: string | null,
): Promise<Response> {
  const { body, headers, ...rest } = options;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  return fetch(`${BASE_URL}${path}`, {
    ...rest,
    credentials: "include", // send httpOnly session cookie
    headers: {
      ...(body !== undefined && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
  });
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token } = options;
  let accessToken = token ?? getAccessToken();

  let res = await doFetch(path, options, accessToken);

  // Don't try to refresh a login/refresh call itself — an infinite loop
  // waiting to happen — only a request that was actually carrying a token.
  if (res.status === 401 && accessToken && !token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      accessToken = newToken;
      res = await doFetch(path, options, accessToken);
    }
  }

  if (!res.ok) {
    let message = res.statusText;
    let details: unknown;
    try {
      const data = await res.json();
      message = data?.message ?? message;
      details = data;
    } catch {
      // non-JSON error body — keep statusText
    }

    if (res.status === 401) handleUnauthorized(!!accessToken);

    throw new ApiError(res.status, message, details);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type BlobFetchResult = {
  blob: Blob;
  fileName: string | null;
  headers: Headers;
};

/**
 * Same auth/refresh behaviour as apiFetch, but returns a binary body
 * (e.g. ZIP bulk download) instead of JSON.
 */
export async function apiFetchBlob(
  path: string,
  options: RequestOptions = {},
): Promise<BlobFetchResult> {
  const { token } = options;
  let accessToken = token ?? getAccessToken();

  let res = await doFetch(path, options, accessToken);

  if (res.status === 401 && accessToken && !token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      accessToken = newToken;
      res = await doFetch(path, options, accessToken);
    }
  }

  if (!res.ok) {
    let message = res.statusText;
    let details: unknown;
    try {
      const data = await res.json();
      message = data?.message ?? message;
      details = data;
    } catch {
      // non-JSON error body
    }

    if (res.status === 401) handleUnauthorized(!!accessToken);

    throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : String(message), details);
  }

  const disposition = res.headers.get('Content-Disposition') ?? '';
  const fileNameMatch =
    /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i.exec(
      disposition,
    );
  const fileName = fileNameMatch
    ? decodeURIComponent(
        (fileNameMatch[1] || fileNameMatch[2] || fileNameMatch[3] || '').trim(),
      )
    : null;

  return {
    blob: await res.blob(),
    fileName,
    headers: res.headers,
  };
}

/**
 * API client with axios-like interface
 * Wraps apiFetch to provide a familiar API
 */
export const apiClient = {
  get: async <T>(url: string, options?: { params?: Record<string, unknown> }) => {
    const queryString = options?.params
      ? "?" + new URLSearchParams(
          Object.entries(options.params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : "";
    
    const data = await apiFetch<T>(url + queryString, { method: "GET" });
    return { data };
  },

  post: async <T>(url: string, data?: unknown, options?: RequestOptions) => {
    const responseData = await apiFetch<T>(url, {
      method: "POST",
      body: data,
      ...options,
    });
    return { data: responseData };
  },

  postBlob: async (url: string, data?: unknown, options?: RequestOptions) => {
    return apiFetchBlob(url, {
      method: "POST",
      body: data,
      ...options,
    });
  },

  patch: async <T>(url: string, data?: unknown, options?: RequestOptions) => {
    const responseData = await apiFetch<T>(url, {
      method: "PATCH",
      body: data,
      ...options,
    });
    return { data: responseData };
  },

  put: async <T>(url: string, data?: unknown, options?: RequestOptions) => {
    const responseData = await apiFetch<T>(url, {
      method: "PUT",
      body: data,
      ...options,
    });
    return { data: responseData };
  },

  delete: async <T>(url: string, options?: RequestOptions) => {
    const responseData = await apiFetch<T>(url, {
      method: "DELETE",
      ...options,
    });
    return { data: responseData };
  },
};
