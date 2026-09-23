import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";
import { Button, Field } from "@/components/ui";
export const Route = createFileRoute("/checkout/customer")({
  head: () => ({
    meta: [
      { title: "Identificação — Mercado Pronto" },
      { name: "description", content: "Informe seus dados para o pedido." },
      { property: "og:title", content: "Identificação" },
      { property: "og:description", content: "Dados do cliente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  const { customer, setCustomer } = useApp();
  const nav = useNavigate();
  return (
    <form
      className="page-wrap max-w-xl pb-28"
      onSubmit={(e) => {
        e.preventDefault();
        nav({ to: "/checkout/address" });
      }}
    >
      <span className="eyebrow">Etapa 2 de 4</span>
      <h1 className="mt-2 text-3xl font-extrabold">Quem vai receber?</h1>
      <p className="mt-2 text-muted">Usaremos estes dados somente para este pedido.</p>
      <div className="mt-6 grid gap-4">
        <Field
          label="Nome"
          required
          value={customer.name}
          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
        />
        <Field
          label="Telefone / WhatsApp"
          required
          value={customer.phone}
          onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
        />
      </div>
      <Button className="mt-6 w-full" type="submit">
        Continuar
      </Button>
    </form>
  );
}
