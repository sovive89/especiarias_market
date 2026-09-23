import { createFileRoute } from "@tanstack/react-router";
import { DriversAdmin } from "@/components/admin/DriversAdmin";

export const Route = createFileRoute("/admin/entregadores")({
  head: () => ({ meta: [{ title: "Entregadores — Gestor" }] }),
  component: DriversAdmin,
});
