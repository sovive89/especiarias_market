import { createFileRoute } from "@tanstack/react-router";
import { StockAdmin } from "@/components/admin/StockAdmin";

export const Route = createFileRoute("/admin/estoque")({
  head: () => ({ meta: [{ title: "Estoque — Gestor Mercado Pronto" }] }),
  component: StockAdmin,
});
