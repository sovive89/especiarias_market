import { createFileRoute } from "@tanstack/react-router";
import { WhatsAppAdmin } from "@/components/admin/WhatsAppAdmin";

export const Route = createFileRoute("/admin/whatsapp")({
  head: () => ({ meta: [{ title: "WhatsApp Business — Gestor" }] }),
  component: WhatsAppAdmin,
});
