import { createFileRoute } from "@tanstack/react-router";
import { DashboardAdmin } from "@/components/admin/DashboardAdmin";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Início — Gestor Mercado Pronto" }] }),
  component: DashboardAdmin,
});
