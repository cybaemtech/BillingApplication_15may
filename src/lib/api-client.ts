const BASE = (() => {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (configured && configured.trim()) return configured.replace(/\/+$/, "");
  if (import.meta.env.DEV) return "http://localhost:5000/api";
  return "/api";
})();

function getToken(): string | null {
  return localStorage.getItem("bf_token");
}

export function setToken(token: string) {
  localStorage.setItem("bf_token", token);
}

export function clearToken() {
  localStorage.removeItem("bf_token");
}

function normalizeDates<T>(value: T): T {
  if (typeof value === "string") {
    return (/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(value) ? value.slice(0, 10) : value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeDates(entry)) as T;
  }

  if (value && typeof value === "object") {
    const normalizedEntries = Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, normalizeDates(entry)]);
    return Object.fromEntries(normalizedEntries) as T;
  }

  return value;
}

async function request<T>(method: string, path: string, body?: any): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const res = await fetch(`${BASE}${normalizedPath}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const rawText = await res.text();
  const hasJsonBody = rawText && rawText.trim().length > 0;
  let parsed: any = null;
  if (hasJsonBody) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }
  }

  if (!res.ok) {
    const err = parsed || { error: res.statusText };
    throw new Error(err.error || res.statusText);
  }

  return normalizeDates((parsed ?? {}) as T);
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: any) => request<T>("POST", path, body),
  put: <T>(path: string, body: any) => request<T>("PUT", path, body),
  patch: <T>(path: string, body: any) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
