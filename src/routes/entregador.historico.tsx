import { createFileRoute } from "@tanstack/react-router";
import { HistoryPage } from "@/driver/pages/HistoryPage";

export const Route = createFileRoute("/entregador/historico")({
  head: () => ({ meta: [{ title: "Histórico — Entregador" }] }),
  component: HistoryPage,
});
