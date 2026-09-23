/**
 * Fonte de dados do catálogo e do estoque.
 *
 * As telas nunca falam direto com "o banco": falam com um CatalogRepository.
 * Hoje existe a versão "mock", que guarda tudo no navegador (localStorage).
 * Quando houver backend, basta usar VITE_DATA_SOURCE=http: a versão "http"
 * chama a API (contrato em docs/API.md) e nenhuma tela precisa mudar.
 */
import { inventory, operation } from "@/data/mock";
import { STORE_WHATSAPP_NUMBER } from "@/config/store";
import type { CatalogSnapshot, StoreBranding } from "@/types/marketplace";

export interface CatalogRepository {
  load(): Promise<CatalogSnapshot>;
  save(snapshot: CatalogSnapshot): Promise<void>;
}

/** Identidade padrão da loja até o gestor configurar a própria em /admin/config. */
export function defaultBranding(): StoreBranding {
  return {
    name: operation.name,
    message: operation.message,
    eta: operation.eta,
    logo: "",
    whatsappNumber: STORE_WHATSAPP_NUMBER,
  };
}

/*
 * v2 = cardápio começa zerado. Quem tinha dados na v1 mantém só o estoque
 * (insumos e histórico); os produtos antigos de exemplo são descartados.
 */
const STORAGE_KEY = "mercado-pronto:catalog:v2";
const LEGACY_KEY = "mercado-pronto:catalog:v1";

/** Ponto de partida: cardápio vazio e os insumos de exemplo no estoque. */
export function seedSnapshot(): CatalogSnapshot {
  return {
    products: [],
    skus: [],
    inventory: structuredClone(inventory),
    movements: [],
    orders: [],
    drivers: [],
    branding: defaultBranding(),
  };
}

function fromLegacy(): CatalogSnapshot | null {
  const old = normalize(JSON.parse(window.localStorage.getItem(LEGACY_KEY) ?? "null"));
  if (!old) return null;
  return {
    ...seedSnapshot(),
    inventory: old.inventory,
    movements: old.movements,
    drivers: old.drivers,
  };
}

/**
 * Aceita dados salvos por versões anteriores (sem "orders"/"drivers"/"branding")
 * para não apagar o catálogo de quem já cadastrou produtos: o que faltar entra
 * com o padrão de fábrica.
 */
function normalize(x: unknown): CatalogSnapshot | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  if (!["products", "skus", "inventory", "movements"].every((k) => Array.isArray(o[k])))
    return null;
  const branding =
    o["branding"] && typeof o["branding"] === "object"
      ? { ...defaultBranding(), ...(o["branding"] as Partial<StoreBranding>) }
      : defaultBranding();
  return {
    ...(o as unknown as CatalogSnapshot),
    orders: Array.isArray(o["orders"]) ? (o["orders"] as CatalogSnapshot["orders"]) : [],
    drivers: Array.isArray(o["drivers"]) ? (o["drivers"] as CatalogSnapshot["drivers"]) : [],
    branding,
  };
}

/** Guarda no navegador. Sobrevive a recarregar a página, mas cada navegador tem a sua cópia. */
export const localRepository: CatalogRepository = {
  async load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = normalize(raw ? JSON.parse(raw) : null);
      if (parsed) return parsed;
      const migrated = fromLegacy();
      if (migrated) return migrated;
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
    window.localStorage.removeItem(LEGACY_KEY);
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
      const data = normalize(await res.json());
      if (!data) throw new Error("A API devolveu um catálogo em formato inesperado.");
      return data;
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
