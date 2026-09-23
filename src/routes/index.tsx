import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock3, ShieldCheck } from "lucide-react";
import { Button, Surface } from "@/components/ui";
import { useCatalog } from "@/context/CatalogContext";
import { PLACEHOLDER_IMAGE } from "@/lib/image";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mercado Pronto — seu pedido sem complicação" },
      { name: "description", content: "Escolha produtos frescos e acompanhe sua entrega." },
      { property: "og:title", content: "Mercado Pronto" },
      { property: "og:description", content: "Seu pedido sem complicação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});
function HomePage() {
  const { products, skus, branding } = useCatalog();
  const visible = products.filter((p) => skus.some((s) => s.baseProductId === p.id && s.active));
  return (
    <div className="page-wrap pb-28">
      <section className="pt-8 md:pt-14">
        <span className="eyebrow">Aberto agora · entrega hoje</span>
        <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-tight md:text-6xl">
          {branding.name}
        </h1>
        <p className="mt-3 max-w-lg text-lg text-muted">{branding.message}</p>
        <Link to="/catalog" className="mt-7 inline-flex">
          <Button className="min-w-48">
            Ver produtos <ArrowRight size={18} />
          </Button>
        </Link>
      </section>
      {visible.length === 0 && (
        <Surface className="mt-8 text-center">
          <b>Cardápio em montagem</b>
          <p className="mt-1 text-sm text-muted">
            Os itens aparecem aqui assim que forem cadastrados.
          </p>
        </Surface>
      )}
      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {visible.map((p, i) => (
          <Link key={p.id} to="/product/$id" params={{ id: p.id }} className="product-tile">
            <img
              src={p.image || PLACEHOLDER_IMAGE}
              alt={p.name}
              width={816}
              height={816}
              loading={i ? "lazy" : "eager"}
            />
            <div className="p-3">
              <p className="text-sm font-bold">{p.name}</p>
              <p className="mt-1 text-xs text-muted">{p.category}</p>
            </div>
          </Link>
        ))}
      </section>
      <Surface className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="flex gap-3">
          <Clock3 className="text-primary" />
          <div>
            <b>Entrega previsível</b>
            <p className="text-sm text-muted">Acompanhe cada etapa do pedido.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <ShieldCheck className="text-primary" />
          <div>
            <b>Compra simples</b>
            <p className="text-sm text-muted">Revise tudo antes de confirmar.</p>
          </div>
        </div>
      </Surface>
    </div>
  );
}
