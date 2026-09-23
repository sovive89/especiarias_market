import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Plus, Minus, LoaderCircle, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";
import { products, skus } from "@/data/mock";
import { useApp } from "@/context/AppContext";
import { Button, Surface } from "@/components/ui";
export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Catálogo — Mercado Pronto" },
      { name: "description", content: "Produtos frescos por categoria e apresentação." },
      { property: "og:title", content: "Catálogo — Mercado Pronto" },
      { property: "og:description", content: "Escolha produtos e apresentações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Catalog,
});
function Catalog() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Tudo");
  const [state, setState] = useState<"ready" | "loading" | "error">("ready");
  const { cart, add, remove, total, count } = useApp();
  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          (cat === "Tudo" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [q, cat],
  );
  return (
    <div className="page-wrap pb-40">
      <div className="sticky-tools">
        <div className="search">
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar café, pão, frutas…"
          />
        </div>
        <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {["Tudo", "Café", "Padaria", "Frutas", "Bebidas"].map((c) => (
            <Button
              key={c}
              variant={cat === c ? "primary" : "secondary"}
              onClick={() => setCat(c)}
              className="min-h-9 shrink-0 py-1.5"
            >
              {c}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-6 flex items-end justify-between">
        <div>
          <span className="eyebrow">Catálogo</span>
          <h1 className="mt-1 text-2xl font-extrabold">Mais pedidos hoje</h1>
        </div>
        <button
          className="text-xs text-muted"
          onClick={() =>
            setState(state === "ready" ? "loading" : state === "loading" ? "error" : "ready")
          }
        >
          Estado: {state}
        </button>
      </div>
      {state === "loading" ? (
        <Surface className="mt-4 flex min-h-48 items-center justify-center gap-2">
          <LoaderCircle className="animate-spin" />
          Carregando produtos
        </Surface>
      ) : state === "error" ? (
        <Surface className="mt-4 text-center">
          <WifiOff className="mx-auto text-warning-foreground" />
          <h2 className="mt-2 font-bold">Não foi possível carregar</h2>
          <Button className="mt-4" onClick={() => setState("ready")}>
            Tentar novamente
          </Button>
        </Surface>
      ) : list.length === 0 ? (
        <Surface className="mt-4 text-center">
          <h2 className="font-bold">Nenhum produto encontrado</h2>
          <p className="mt-1 text-sm text-muted">Tente outro nome ou categoria.</p>
        </Surface>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {list.map((p) => {
            const sku = skus.find((s) => s.id === p.skuIds[0]);
            if (!sku) return null;
            const qty = cart.find((i) => i.skuId === sku.id)?.quantity || 0;
            return (
              <Surface key={p.id} className="overflow-hidden p-2.5">
                <Link to="/product/$id" params={{ id: p.id }}>
                  <img
                    className="aspect-square w-full rounded-xl object-cover"
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    width={816}
                    height={816}
                  />
                  <p className="mt-2 font-mono text-[10px] text-muted">{p.category}</p>
                  <h2 className="min-h-10 text-sm font-bold leading-tight">{p.name}</h2>
                </Link>
                <p className="text-xs text-muted">{sku.name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <b>R$ {sku.price.toFixed(2).replace(".", ",")}</b>
                  {qty ? (
                    <div className="stepper">
                      <button aria-label="Diminuir" onClick={() => remove(sku.id)}>
                        <Minus size={15} />
                      </button>
                      <b>{qty}</b>
                      <button aria-label="Aumentar" onClick={() => add(sku.id)}>
                        <Plus size={15} />
                      </button>
                    </div>
                  ) : (
                    <Button
                      aria-label="Adicionar"
                      onClick={() => add(sku.id)}
                      className="size-9 min-h-9 p-0"
                    >
                      <Plus size={18} />
                    </Button>
                  )}
                </div>
              </Surface>
            );
          })}
        </div>
      )}
      {count > 0 && (
        <div className="bottom-action">
          <div>
            <p className="font-mono text-[10px] text-muted">{count} itens no carrinho</p>
            <b className="text-lg">R$ {total.toFixed(2).replace(".", ",")}</b>
          </div>
          <Link to="/cart">
            <Button>Ver carrinho</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
