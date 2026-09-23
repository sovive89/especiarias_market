/*
 * Cliente HTTP genérico. Só é usado quando VITE_DATA_SOURCE=http.
 * Centraliza: endereço base, cabeçalhos, token de login e tratamento de erro.
 */
const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Onde o token de login vai ficar quando a autenticação existir. */
let authToken: string | null = null;
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!BASE_URL) throw new ApiError(0, "VITE_API_URL não configurada.");

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text || `Erro ${res.status} em ${method} ${path}`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body)
};
