import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { PLACEHOLDER_IMAGE } from "@/lib/image";
import { availableUnits } from "@/services/catalog/rules";
import { useState } from "react";
import { Button, Surface } from "@/components/ui";
import { useApp } from "@/context/AppContext";
export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Produto — Mercado Pronto" },
      { name: "description", content: "Detalhes e apresentações do produto." },
      { property: "og:title", content: "Produto — Mercado Pronto" },
      { property: "og:description", content: "Escolha sua apresentação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});
function ProductPage() {
  const { id } = Route.useParams();
  const catalog = useCatalog();
  const { products, skus } = catalog;
  const p = products.find((x) => x.id === id);
  const variants = skus.filter((s) => s.baseProductId === p?.id && s.active);
  const [selected, setSelected] = useState("");
  const { add, cart } = useApp();
  const sku = variants.find((s) => s.id === selected) ?? variants[0];
  if (!p) {
    return (
      <div className="page-wrap max-w-xl pt-10 text-center">
        <h1 className="text-2xl font-extrabold">Produto não encontrado</h1>
        <Link to="/catalog" className="mt-4 inline-flex">
          <Button>Ver catálogo</Button>
        </Link>
      </div>
    );
  }
  const stock = sku ? availableUnits(catalog.snapshot, sku) : 0;
  const inCart = sku ? (cart.find((i) => i.skuId === sku.id)?.quantity ?? 0) : 0;
  return (
    <div className="page-wrap max-w-3xl pb-28">
      <Link to="/catalog" className="mb-4 inline-flex items-center gap-2 text-sm font-bold">
        <ArrowLeft size={17} />
        Voltar
      </Link>
      <div className="grid gap-6 md:grid-cols-2">
        <img
          src={p.image || PLACEHOLDER_IMAGE}
          alt={p.name}
          width={816}
          height={816}
          className="aspect-square w-full rounded-2xl object-cover"
        />
        <div>
          <span className="eyebrow">{p.category}</span>
          <h1 className="mt-2 text-3xl font-extrabold">{p.name}</h1>
          <p className="mt-2 text-muted">{p.description}</p>
          {variants.length === 1 && sku && (
            <p className="mt-5 text-2xl font-extrabold">
              R$ {sku.price.toFixed(2).replace(".", ",")}
              <span className="ml-1 text-sm font-semibold text-muted">/ {sku.unit}</span>
              {stock === 0 && (
                <span className="ml-2 text-sm text-warning-foreground">Esgotado</span>
              )}
            </p>
          )}
          {variants.length > 1 && (
            <h2 className="mt-6 text-sm font-bold">Escolha a apresentação</h2>
          )}
          <div className={variants.length > 1 ? "mt-2 grid gap-2" : "hidden"}>
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelected(v.id)}
                className={
                  "flex items-center justify-between rounded-xl border p-3 text-left " +
                  (sku?.id === v.id ? "border-primary bg-primary-soft" : "border-border bg-surface")
                }
              >
                <span>
                  <b className="block text-sm">{v.name}</b>
                  <small className="text-muted">
                    {v.unit}
                    {availableUnits(catalog.snapshot, v) === 0 && " · Esgotado"}
                  </small>
                </span>
                <b>R$ {v.price.toFixed(2).replace(".", ",")}</b>
              </button>
            ))}
          </div>
          {sku && (
            <Button className="mt-5 w-full" disabled={inCart >= stock} onClick={() => add(sku.id)}>
              <Plus size={18} />
              {stock === 0
                ? "Esgotado"
                : inCart >= stock
                  ? "Limite do estoque"
                  : "Adicionar ao carrinho"}
            </Button>
          )}
        </div>
      </div>
      <Surface className="mt-6">
        <h2 className="font-bold">Sobre este produto</h2>
        <p className="mt-2 text-sm text-muted">
          {p.description || "Preparado com ingredientes selecionados."}
        </p>
      </Surface>
    </div>
  );
}
