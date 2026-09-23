import { createFileRoute } from "@tanstack/react-router";
import { OrdersAdmin } from "@/components/admin/OrdersAdmin";

export const Route = createFileRoute("/admin/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — Gestor Mercado Pronto" }] }),
  component: OrdersAdmin,
});
