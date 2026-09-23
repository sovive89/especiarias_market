import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button, Field, Surface } from "@/components/ui";
export const Route = createFileRoute("/checkout/address")({
  head: () => ({
    meta: [
      { title: "Local de entrega — Mercado Pronto" },
      { name: "description", content: "Defina o local deste pedido." },
      { property: "og:title", content: "Local de entrega" },
      { property: "og:description", content: "Defina onde receber." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  const { location, setLocation } = useApp();
  const nav = useNavigate();
  return (
    <form
      className="page-wrap max-w-xl pb-28"
      onSubmit={(e) => {
        e.preventDefault();
        nav({ to: "/checkout/review" });
      }}
    >
      <span className="eyebrow">Etapa 3 de 4</span>
      <h1 className="mt-2 text-3xl font-extrabold">Onde entregar?</h1>
      <Surface className="mt-4 flex gap-3">
        <MapPin className="shrink-0 text-primary" />
        <p className="text-sm text-muted">
          Este local ficará vinculado ao pedido e não altera automaticamente seu endereço principal.
        </p>
      </Surface>
      <div className="mt-5 grid gap-4">
        <div>
          <p className="mb-2 text-sm font-bold">Identifique o local</p>
          <div className="grid grid-cols-3 gap-2">
            {["Casa", "Trabalho", "Outro"].map((x) => (
              <Button
                key={x}
                type="button"
                variant={location.label === x ? "primary" : "secondary"}
                onClick={() =>
                  setLocation({
                    ...location,
                    label: x as typeof location.label,
                    classification:
                      x === "Casa" ? "residência" : x === "Trabalho" ? "trabalho" : "outro",
                  })
                }
              >
                {x}
              </Button>
            ))}
          </div>
        </div>
        <Field
          label="Endereço"
          required
          value={location.address}
          onChange={(e) => setLocation({ ...location, address: e.target.value })}
        />
        <Field
          label="Complemento"
          value={location.complement}
          onChange={(e) => setLocation({ ...location, complement: e.target.value })}
        />
        <Field
          label="Referência"
          value={location.reference}
          onChange={(e) => setLocation({ ...location, reference: e.target.value })}
        />
        <Button type="button" variant="secondary" disabled>
          Usar localização do dispositivo · em breve
        </Button>
      </div>
      <Button className="mt-6 w-full" type="submit">
        Revisar pedido
      </Button>
    </form>
  );
}
