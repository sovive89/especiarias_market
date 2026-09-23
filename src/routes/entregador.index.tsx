import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/driver/pages/HomePage";

export const Route = createFileRoute("/entregador/")({
  head: () => ({ meta: [{ title: "Início — Entregador" }] }),
  component: HomePage,
});
