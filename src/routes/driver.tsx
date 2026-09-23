import { createFileRoute, redirect } from "@tanstack/react-router";

/* Endereço antigo da tela do entregador. Quem abrir /driver vai para /entregador. */
export const Route = createFileRoute("/driver")({
  beforeLoad: () => {
    throw redirect({ to: "/entregador", replace: true });
  },
});
