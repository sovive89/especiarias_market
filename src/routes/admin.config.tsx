import { createFileRoute } from "@tanstack/react-router";
import { ConfigAdmin } from "@/components/admin/ConfigAdmin";

export const Route = createFileRoute("/admin/config")({
  head: () => ({ meta: [{ title: "Configuração — Gestor" }] }),
  component: ConfigAdmin,
});
