import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/driver/components/layout/AppShell";
import { DriverProvider } from "@/driver/context/DriverContext";
import driverCss from "@/driver/styles/driver.css?url";

/*
 * Rota "pai" da área do entregador. Tudo em /entregador/... passa por aqui:
 * carrega o CSS do entregador, liga o contexto (estado e ações) e desenha a moldura.
 * Cada página filha aparece no <Outlet /> dentro do AppShell.
 */
export const Route = createFileRoute("/entregador")({
  head: () => ({
    meta: [
      { title: "Entregador — Mercado Pronto" },
      { name: "description", content: "Rotas e entregas atribuídas ao entregador." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "stylesheet", href: driverCss }],
  }),
  component: DriverLayout,
});

function DriverLayout() {
  return (
    <DriverProvider>
      <AppShell />
    </DriverProvider>
  );
}
