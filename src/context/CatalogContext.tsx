/**
 * Guarda o catálogo e o estoque em memória para todas as telas (loja e admin)
 * e salva cada alteração na fonte de dados (hoje: o navegador).
 *
 * Cada ação chama uma regra de services/catalog/rules.ts, troca o estado
 * pelo resultado e salva. Se a regra recusar (ex.: preço negativo), a ação
 * lança o erro com a mensagem em português para a tela mostrar.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, CatalogSnapshot } from "@/types/marketplace";
import * as rules from "@/services/catalog/rules";
import {
  getCatalogRepository,
  resetLocalCatalog,
  seedSnapshot,
} from "@/services/catalog/repository";

type CatalogState = CatalogSnapshot & {
  loaded: boolean;
  saveError: string | null;
  createProduct: (input: rules.ProductInput, variants: rules.SkuInput[]) => string;
  updateProduct: (id: string, input: rules.ProductInput) => void;
  deleteProduct: (id: string) => void;
  createSku: (productId: string, input: rules.SkuInput) => void;
  updateSku: (id: string, input: rules.SkuInput) => void;
  deleteSku: (id: string) => void;
  createInventoryItem: (input: rules.InventoryInput) => string;
  updateInventoryItem: (id: string, input: { name: string; unit: string; minimum: number }) => void;
  deleteInventoryItem: (id: string) => void;
  addStockEntry: (id: string, quantity: number, unitCost: number, note?: string) => void;
  adjustStock: (id: string, counted: number, note?: string) => void;
  deductSale: (cart: CartItem[], orderRef: string) => void;
  resetDemo: () => void;
  /** Aplica várias regras de uma vez: se qualquer uma recusar, nada é gravado. */
  transaction: (fn: (s: CatalogSnapshot) => CatalogSnapshot) => void;
  snapshot: CatalogSnapshot;
};

const C = createContext<CatalogState | undefined>(undefined);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => getCatalogRepository(), []);
  // Começa com os dados de exemplo (igual no servidor e no navegador, para a página não "piscar");
  // depois de montar, troca pelo que estiver salvo.
  const [snapshot, setSnapshot] = useState<CatalogSnapshot>(seedSnapshot);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const latest = useRef(snapshot);

  useEffect(() => {
    let alive = true;
    repo
      .load()
      .then((s) => {
        if (alive) {
          latest.current = s;
          setSnapshot(s);
        }
      })
      .catch((e: unknown) => setSaveError(e instanceof Error ? e.message : String(e)))
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [repo]);

  /** Aplica uma regra sobre o estado mais recente e salva. Erros de regra sobem para a tela. */
  const apply = useCallback(
    (fn: (s: CatalogSnapshot) => CatalogSnapshot) => {
      const next = fn(latest.current);
      latest.current = next;
      setSnapshot(next);
      repo
        .save(next)
        .then(() => setSaveError(null))
        .catch((e: unknown) => setSaveError(e instanceof Error ? e.message : String(e)));
    },
    [repo],
  );

  const value = useMemo<CatalogState>(
    () => ({
      ...snapshot,
      snapshot,
      loaded,
      saveError,
      createProduct: (input, variants) => {
        if (!variants.length)
          throw new rules.CatalogError("Adicione pelo menos uma apresentação com preço.");
        // Valida tudo antes de gravar: ou entra o produto completo, ou nada.
        let createdId = "";
        apply((s) => {
          const { snapshot: withProduct, product } = rules.createProduct(s, input);
          createdId = product.id;
          return variants.reduce((acc, v) => rules.createSku(acc, product.id, v), withProduct);
        });
        return createdId;
      },
      updateProduct: (id, input) => apply((s) => rules.updateProduct(s, id, input)),
      deleteProduct: (id) => apply((s) => rules.deleteProduct(s, id)),
      createSku: (productId, input) => apply((s) => rules.createSku(s, productId, input)),
      updateSku: (id, input) => apply((s) => rules.updateSku(s, id, input)),
      deleteSku: (id) => apply((s) => rules.deleteSku(s, id)),
      createInventoryItem: (input) => {
        let createdId = "";
        apply((s) => {
          const r = rules.createInventoryItem(s, input);
          createdId = r.item.id;
          return r.snapshot;
        });
        return createdId;
      },
      updateInventoryItem: (id, input) => apply((s) => rules.updateInventoryItem(s, id, input)),
      deleteInventoryItem: (id) => apply((s) => rules.deleteInventoryItem(s, id)),
      addStockEntry: (id, q, cost, note) => apply((s) => rules.addStockEntry(s, id, q, cost, note)),
      adjustStock: (id, counted, note) => apply((s) => rules.adjustStock(s, id, counted, note)),
      deductSale: (cart, ref) => apply((s) => rules.deductSale(s, cart, ref)),
      transaction: (fn) => apply(fn),
      resetDemo: () => {
        resetLocalCatalog();
        apply(() => seedSnapshot());
      },
    }),
    [snapshot, loaded, saveError, apply],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useCatalog() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useCatalog precisa estar dentro de <CatalogProvider>.");
  return ctx;
}
