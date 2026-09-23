import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock3 } from "lucide-react";
import { Button, Surface } from "@/components/ui";
export const Route = createFileRoute("/order-confirmed")({
  head: () => ({
    meta: [
      { title: "Pedido confirmado — Mercado Pronto" },
      { name: "description", content: "Pedido recebido e em preparação." },
      { property: "og:title", content: "Pedido confirmado" },
      { property: "og:description", content: "Acompanhe sua entrega." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  return (
    <div className="page-wrap max-w-xl pb-28 text-center">
      <div className="mx-auto grid size-20 place-items-center rounded-full bg-success-soft text-success">
        <Check size={38} />
      </div>
      <span className="eyebrow mt-5 inline-flex">Pedido #MP-2085</span>
      <h1 className="mt-2 text-3xl font-extrabold">Pedido confirmado!</h1>
      <p className="mt-2 text-muted">Já enviamos seu pedido para preparação.</p>
      <Surface className="mt-6 text-left">
        <div className="flex items-center gap-3">
          <Clock3 className="text-primary" />
          <div>
            <b>Previsão de entrega</b>
            <p className="text-sm text-muted">Hoje, entre 12:25 e 12:35</p>
          </div>
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <p className="section-label">Status atual</p>
          <b>Pagamento confirmado</b>
        </div>
      </Surface>
      <Link to="/tracking">
        <Button className="mt-5 w-full">Acompanhar pedido</Button>
      </Link>
    </div>
  );
}
