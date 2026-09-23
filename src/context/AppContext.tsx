import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { CartItem, DeliveryLocation } from "@/types/marketplace";
import { useCatalog } from "@/context/CatalogContext";
type AppState = {
  cart: CartItem[];
  add: (skuId: string) => void;
  remove: (skuId: string) => void;
  clear: () => void;
  total: number;
  count: number;
  customer: { name: string; phone: string };
  setCustomer: (x: { name: string; phone: string }) => void;
  location: DeliveryLocation;
  setLocation: (x: DeliveryLocation) => void;
};
const C = createContext<AppState | undefined>(undefined);
const initial: DeliveryLocation = {
  id: "checkout-location",
  label: "Casa",
  address: "Rua das Flores, 128",
  complement: "Apto 42",
  reference: "Portaria azul",
  classification: "residência",
};
export function AppProvider({ children }: { children: ReactNode }) {
  const { skus } = useCatalog();
  // Carrinho e cliente começam vazios: o cardápio é montado pelo gestor e não há cadastro.
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [location, setLocation] = useState(initial);
  const add = (id: string) =>
    setCart((c) => {
      const x = c.find((i) => i.skuId === id);
      return x
        ? c.map((i) => (i.skuId === id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...c, { skuId: id, quantity: 1 }];
    });
  const remove = (id: string) =>
    setCart((c) =>
      c.flatMap((i) =>
        i.skuId === id ? (i.quantity > 1 ? [{ ...i, quantity: i.quantity - 1 }] : []) : [i],
      ),
    );
  const value = useMemo(
    () => ({
      cart,
      add,
      remove,
      clear: () => setCart([]),
      count: cart.reduce((a, b) => a + b.quantity, 0),
      total: cart.reduce(
        (a, b) => a + (skus.find((s) => s.id === b.skuId)?.price || 0) * b.quantity,
        0,
      ),
      customer,
      setCustomer,
      location,
      setLocation,
    }),
    [cart, customer, location, skus],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}
export function useApp() {
  const x = useContext(C);
  if (!x) throw new Error("AppProvider ausente");
  return x;
}
