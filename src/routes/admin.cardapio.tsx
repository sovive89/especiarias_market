import { createFileRoute } from "@tanstack/react-router";
import { MenuAdmin } from "@/components/admin/MenuAdmin";

export const Route = createFileRoute("/admin/cardapio")({
  head: () => ({ meta: [{ title: "Cardápio — Gestor Mercado Pronto" }] }),
  component: MenuAdmin,
});
