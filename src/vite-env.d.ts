/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "mock" (padrão, dados simulados) ou "http" (backend real) */
  readonly VITE_DATA_SOURCE?: "mock" | "http";
  /** Endereço da API real, ex.: https://api.especiarias.com */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
