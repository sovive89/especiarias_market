import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";
import { operation, products, skus } from "@/data/mock";
import { Button, Surface } from "@/components/ui";
export const Route = createFileRoute("/checkout/review")({
  head: () => ({
    meta: [
      { title: "Revisão — Mercado Pronto" },
      { name: "description", content: "Confira todos os dados do pedido." },
      { property: "og:title", content: "Revisão do pedido" },
      { property: "og:description", content: "Confira antes de confirmar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  const { cart, total, customer, location } = useApp();
  const final = total + operation.deliveryFee;
  return (
    <div className="page-wrap max-w-xl pb-28">
      <span className="eyebrow">Etapa 4 de 4</span>
      <h1 className="mt-2 text-3xl font-extrabold">Revise seu pedido</h1>
      <div className="mt-5 grid gap-3">
        <Surface>
          <p className="section-label">Cliente</p>
          <b>{customer.name}</b>
          <p className="text-sm text-muted">{customer.phone}</p>
        </Surface>
        <Surface>
          <p className="section-label">Entrega · {location.label}</p>
          <b>{location.address}</b>
          <p className="text-sm text-muted">
            {location.complement} · {location.reference}
          </p>
        </Surface>
        <Surface>
          <p className="section-label">Produtos</p>
          <div className="mt-2 grid gap-2">
            {cart.map((i) => {
              const s = skus.find((x) => x.id === i.skuId);
              const p = products.find((x) => x.id === s?.baseProductId);
              return (
                <div key={i.skuId} className="flex justify-between text-sm">
                  <span>
                    {i.quantity}× {p?.name} · {s?.name}
                  </span>
                  <b>R$ {((s?.price || 0) * i.quantity).toFixed(2).replace(".", ",")}</b>
                </div>
              );
            })}
          </div>
          <div className="mt-4 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <b>R$ {total.toFixed(2).replace(".", ",")}</b>
            </div>
            <div className="mt-2 flex justify-between">
              <span>Taxa de entrega</span>
              <b>R$ {operation.deliveryFee.toFixed(2).replace(".", ",")}</b>
            </div>
            <div className="mt-3 flex justify-between text-lg">
              <b>Total</b>
              <b>R$ {final.toFixed(2).replace(".", ",")}</b>
            </div>
          </div>
        </Surface>
      </div>
      <Link to="/checkout/payment">
        <Button className="mt-4 w-full">Escolher pagamento</Button>
      </Link>
    </div>
  );
}
