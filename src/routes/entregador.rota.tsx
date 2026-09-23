import { createFileRoute } from "@tanstack/react-router";
import { RoutePage } from "@/driver/pages/RoutePage";

export const Route = createFileRoute("/entregador/rota")({
  head: () => ({ meta: [{ title: "Rota do dia — Entregador" }] }),
  component: RoutePage,
});
