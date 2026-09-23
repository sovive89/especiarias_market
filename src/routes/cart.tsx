import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { products, skus } from "@/data/mock";
import { Button, Surface } from "@/components/ui";
export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Carrinho — Mercado Pronto" },
      { name: "description", content: "Revise produtos, quantidades e subtotal." },
      { property: "og:title", content: "Carrinho — Mercado Pronto" },
      { property: "og:description", content: "Revise seu pedido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Cart,
});
function Cart() {
  const { cart, add, remove, total } = useApp();
  return (
    <div className="page-wrap max-w-xl pb-32">
      <span className="eyebrow">Etapa 1 de 4</span>
      <h1 className="mt-2 text-3xl font-extrabold">Seu carrinho</h1>
      {cart.length === 0 ? (
        <Surface className="mt-6 text-center">
          <ShoppingBag className="mx-auto text-muted" />
          <h2 className="mt-2 font-bold">Seu carrinho está vazio</h2>
          <Link to="/catalog">
            <Button className="mt-4">Ver produtos</Button>
          </Link>
        </Surface>
      ) : (
        <>
          <div className="mt-5 grid gap-3">
            {cart.map((i) => {
              const s = skus.find((x) => x.id === i.skuId);
              const p = products.find((x) => x.id === s?.baseProductId);
              if (!s || !p) return null;
              return (
                <Surface key={i.skuId} className="flex gap-3">
                  <img
                    src={p.image}
                    alt=""
                    width={816}
                    height={816}
                    className="size-20 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <b className="block text-sm">{p.name}</b>
                    <p className="text-xs text-muted">
                      {s.name} · R$ {s.price.toFixed(2).replace(".", ",")}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="stepper">
                        <button onClick={() => remove(s.id)}>
                          <Minus size={15} />
                        </button>
                        <b>{i.quantity}</b>
                        <button onClick={() => add(s.id)}>
                          <Plus size={15} />
                        </button>
                      </div>
                      <b>R$ {(s.price * i.quantity).toFixed(2).replace(".", ",")}</b>
                    </div>
                  </div>
                </Surface>
              );
            })}
          </div>
          <Surface className="mt-4 flex justify-between">
            <span>Subtotal</span>
            <b>R$ {total.toFixed(2).replace(".", ",")}</b>
          </Surface>
          <Link to="/checkout/customer">
            <Button className="mt-4 w-full">Continuar</Button>
          </Link>
        </>
      )}
    </div>
  );
}
