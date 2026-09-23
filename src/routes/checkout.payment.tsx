import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { QrCode, CreditCard, Banknote } from "lucide-react";
import { useState } from "react";
import { Button, Surface } from "@/components/ui";
export const Route = createFileRoute("/checkout/payment")({
  head: () => ({
    meta: [
      { title: "Pagamento — Mercado Pronto" },
      { name: "description", content: "Escolha uma forma de pagamento simulada." },
      { property: "og:title", content: "Pagamento" },
      { property: "og:description", content: "Interface visual de pagamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
const PAYMENT_METHODS = [
  { method: "PIX", icon: QrCode, hint: "Aprovação rápida" },
  { method: "Cartão", icon: CreditCard, hint: "Crédito ou débito" },
  { method: "Dinheiro", icon: Banknote, hint: "Pague na entrega" },
] as const;

function Page() {
  const [m, setM] = useState<string>("PIX");
  const nav = useNavigate();
  return (
    <div className="page-wrap max-w-xl pb-28">
      <span className="eyebrow">Pagamento simulado</span>
      <h1 className="mt-2 text-3xl font-extrabold">Como deseja pagar?</h1>
      <p className="mt-2 text-sm text-muted">Nenhuma cobrança será realizada nesta demonstração.</p>
      <div className="mt-6 grid gap-3">
        {PAYMENT_METHODS.map(({ method: x, icon: I, hint: d }) => (
          <button
            key={x}
            onClick={() => setM(x)}
            className={
              "rounded-2xl border p-4 text-left " +
              (m === x ? "border-primary bg-primary-soft" : "border-border bg-surface")
            }
          >
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-muted-surface">
                <I />
              </span>
              <span>
                <b className="block">{x}</b>
                <small className="text-muted">{d}</small>
              </span>
            </div>
          </button>
        ))}
      </div>
      <Surface className="mt-4 text-sm text-muted">
        Gateway ainda não conectado. O botão abaixo apenas avança a demonstração.
      </Surface>
      <Button className="mt-5 w-full" onClick={() => nav({ to: "/order-confirmed" })}>
        Confirmar pedido
      </Button>
    </div>
  );
}
