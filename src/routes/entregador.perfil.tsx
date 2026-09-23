import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/driver/pages/ProfilePage";

export const Route = createFileRoute("/entregador/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Entregador" }] }),
  component: ProfilePage,
});
