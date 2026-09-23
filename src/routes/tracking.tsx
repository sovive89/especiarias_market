import { createFileRoute } from "@tanstack/react-router";
import { Bike, Home, MapPin, PackageCheck } from "lucide-react";
import { Badge, Surface } from "@/components/ui";
export const Route = createFileRoute("/tracking")({
  head: () => ({
    meta: [
      { title: "Acompanhar pedido — Mercado Pronto" },
      { name: "description", content: "Veja a previsão e o status da entrega." },
      { property: "og:title", content: "Acompanhar pedido" },
      { property: "og:description", content: "Sua entrega em tempo real futuramente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  return (
    <div className="page-wrap max-w-3xl pb-28">
      <div className="flex items-start justify-between">
        <div>
          <span className="eyebrow">Pedido #MP-2085</span>
          <h1 className="mt-2 text-3xl font-extrabold">A caminho de você</h1>
        </div>
        <Badge tone="good">Em rota</Badge>
      </div>
      <div className="mock-map mt-5">
        <span className="map-road road-a" />
        <span className="map-road road-b" />
        <span className="map-road road-c" />
        <span className="map-pin start">
          <PackageCheck />
        </span>
        <span className="map-pin rider">
          <Bike />
        </span>
        <span className="map-pin end">
          <Home />
        </span>
      </div>
      <Surface className="mt-4">
        <div className="flex justify-between">
          <span>
            <b>Chega em 18 min</b>
            <p className="text-sm text-muted">Rafael está com seu pedido</p>
          </span>
          <MapPin className="text-primary" />
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted-surface">
          <div className="h-full w-2/3 rounded-full bg-primary" />
        </div>
      </Surface>
      <div className="mt-4 grid gap-2">
        {["Pedido confirmado", "Preparação concluída", "Saiu para entrega", "Entregue"].map(
          (x, i) => (
            <div key={x} className="flex items-center gap-3 py-2">
              <span
                className={
                  "grid size-7 place-items-center rounded-full text-xs font-bold " +
                  (i < 3 ? "bg-primary text-primary-foreground" : "bg-muted-surface text-muted")
                }
              >
                {i < 3 ? "✓" : 4}
              </span>
              <span className={i < 3 ? "font-bold" : "text-muted"}>{x}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
