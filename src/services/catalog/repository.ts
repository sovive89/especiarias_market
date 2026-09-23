/**
 * Fonte de dados do catálogo e do estoque.
 *
 * As telas nunca falam direto com "o banco": falam com um CatalogRepository.
 * Hoje existe a versão "mock", que guarda tudo no navegador (localStorage).
 * Quando houver backend, basta usar VITE_DATA_SOURCE=http: a versão "http"
 * chama a API (contrato em docs/API.md) e nenhuma tela precisa mudar.
 */
import { inventory, products, skus } from "@/data/mock";
import type { CatalogSnapshot } from "@/types/marketplace";

export interface CatalogRepository {
  load(): Promise<CatalogSnapshot>;
  save(snapshot: CatalogSnapshot): Promise<void>;
}

const STORAGE_KEY = "mercado-pronto:catalog:v1";

export function seedSnapshot(): CatalogSnapshot {
  return {
    products: structuredClone(products),
    skus: structuredClone(skus),
    inventory: structuredClone(inventory),
    movements: [],
  };
}

function isSnapshot(x: unknown): x is CatalogSnapshot {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return ["products", "skus", "inventory", "movements"].every((k) => Array.isArray(o[k]));
}

/** Guarda no navegador. Sobrevive a recarregar a página, mas cada navegador tem a sua cópia. */
export const localRepository: CatalogRepository = {
  async load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (isSnapshot(parsed)) return parsed;
    } catch {
      /* navegador sem storage (aba anônima, bloqueio): segue com os dados de exemplo */
    }
    return seedSnapshot();
  },
  async save(snapshot) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      throw new Error(
        "Não foi possível salvar no navegador. Se você enviou fotos muito grandes, tente uma menor.",
      );
    }
  },
};

export function resetLocalCatalog() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignora */
  }
}

/** Versão para o backend real. */
export function httpRepository(baseUrl: string): CatalogRepository {
  return {
    async load() {
      const res = await fetch(`${baseUrl}/catalog`);
      if (!res.ok) throw new Error(`Falha ao carregar o catálogo (${res.status}).`);
      return (await res.json()) as CatalogSnapshot;
    },
    async save(snapshot) {
      const res = await fetch(`${baseUrl}/catalog`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      if (!res.ok) throw new Error(`Falha ao salvar o catálogo (${res.status}).`);
    },
  };
}

export function getCatalogRepository(): CatalogRepository {
  const source = import.meta.env.VITE_DATA_SOURCE;
  const url = import.meta.env.VITE_API_URL;
  if (source === "http" && url) return httpRepository(url);
  return localRepository;
}
