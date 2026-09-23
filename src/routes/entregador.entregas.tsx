import { createFileRoute } from "@tanstack/react-router";
import { DeliveriesPage } from "@/driver/pages/DeliveriesPage";

export const Route = createFileRoute("/entregador/entregas")({
  head: () => ({ meta: [{ title: "Entregas — Entregador" }] }),
  component: DeliveriesPage,
});
