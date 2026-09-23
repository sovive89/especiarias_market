import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/driver/components/layout/AppShell";
import { DriverProvider } from "@/driver/context/DriverContext";
import { DriverAuthProvider, useDriverAuth } from "@/driver/context/DriverAuthContext";
import { LoginPage } from "@/driver/pages/LoginPage";
import driverCss from "@/driver/styles/driver.css?url";

/*
 * Rota "pai" da área do entregador. Tudo em /entregador/... passa por aqui:
 * carrega o CSS do entregador, exige login (telefone + PIN cadastrados pelo
 * gestor em /admin/entregadores) e, só depois, liga o contexto de entregas e
 * desenha a moldura. Cada página filha aparece no <Outlet /> dentro do AppShell.
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
    <DriverAuthProvider>
      <DriverGate />
    </DriverAuthProvider>
  );
}

/** Só deixa passar quem logou; enquanto isso não decide nada (evita "piscar" a tela de login). */
function DriverGate() {
  const { ready, identity } = useDriverAuth();
  if (!ready) return null;
  if (!identity) return <LoginPage />;
  return (
    <DriverProvider identity={identity}>
      <AppShell />
    </DriverProvider>
  );
}
