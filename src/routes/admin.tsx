import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useCatalog } from "@/context/CatalogContext";
import { ThemeToggle } from "@/components/ThemeToggle";

/*
 * Rota "pai" do painel do gestor. Cada aba é uma rota filha (/admin, /admin/pedidos,
 * /admin/cardapio, /admin/estoque) que aparece no <Outlet />. Assim cada tela tem
 * endereço próprio: dá para favoritar, voltar no navegador e abrir em outra aba.
 */
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Gestor — Mercado Pronto" },
      { name: "description", content: "Pedidos, cardápio e estoque da loja." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Início", icon: LayoutDashboard },
  { to: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/admin/estoque", label: "Estoque", icon: Boxes },
  { to: "/admin/entregadores", label: "Entregadores", icon: Truck },
] as const;

/** Fora do menu principal (não cabe na barra do celular) mas ainda precisa de título no topo. */
const EXTRA_TITLES: Record<string, string> = {
  "/admin/config": "Configuração",
  "/admin/whatsapp": "WhatsApp Business",
};

function AdminLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname.replace(/\/$/, "") });
  const { orders, inventory } = useCatalog();
  const newOrders = orders.filter((o) => o.status === "novo").length;
  const lowStock = inventory.filter((i) => i.current < i.minimum).length;
  const badge = (to: string) =>
    to === "/admin/pedidos" ? newOrders : to === "/admin/estoque" ? lowStock : 0;
  // O Link do router já marca o item ativo (classe "active"); aqui só pegamos o título.
  const currentTitle = NAV.find((n) => n.to === path)?.label ?? EXTRA_TITLES[path] ?? NAV[0].label;

  // Data só no navegador: no servidor o fuso pode ser outro e a página "pisca" ao carregar.
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }),
    );
  }, []);

  return (
    <div className="gestor">
      <aside className="gestor-side">
        <Link to="/admin" className="flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-lg font-black text-primary-foreground">
            M
          </span>
          <span className="leading-tight">
            <b className="block">Mercado Pronto</b>
            <small className="text-muted">Gestor da loja</small>
          </span>
        </Link>
        <nav className="mt-8 grid gap-1">
          {NAV.map(({ to, label, icon: I }) => (
            <Link
              key={to}
              to={to}
              className="gestor-link"
              activeOptions={{ exact: to === "/admin" }}
            >
              <I size={19} />
              <span className="flex-1">{label}</span>
              {badge(to) > 0 && <span className="gestor-count">{badge(to)}</span>}
            </Link>
          ))}
        </nav>
        <Link to="/admin/whatsapp" className="gestor-link mt-auto" activeOptions={{ exact: true }}>
          <MessageCircle size={19} />
          WhatsApp Business
        </Link>
        <Link to="/admin/config" className="gestor-link" activeOptions={{ exact: true }}>
          <Settings size={19} />
          Configuração
        </Link>
        <a href="/" className="gestor-link" target="_blank" rel="noreferrer">
          <ExternalLink size={19} />
          Ver loja
        </a>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="gestor-top">
          <div className="min-w-0">
            <p className="first-letter:uppercase font-mono text-[10px] text-muted">
              {today || " "}
            </p>
            <h1 className="truncate text-xl font-extrabold">{currentTitle}</h1>
          </div>
          <ThemeToggle />
          <Link
            to="/admin/whatsapp"
            aria-label="WhatsApp Business"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted-surface text-foreground md:hidden"
          >
            <MessageCircle size={19} />
          </Link>
          <Link
            to="/admin/config"
            aria-label="Configuração da loja"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted-surface text-foreground md:hidden"
          >
            <Settings size={19} />
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold md:hidden"
          >
            <ExternalLink size={14} /> Loja
          </a>
        </header>
        <main className="gestor-main">
          <Outlet />
        </main>
      </div>

      <nav className="gestor-tabbar" aria-label="Menu do gestor">
        {NAV.map(({ to, label, icon: I }) => (
          <Link key={to} to={to} activeOptions={{ exact: to === "/admin" }}>
            <span className="relative">
              <I size={21} />
              {badge(to) > 0 && <span className="gestor-dot">{badge(to)}</span>}
            </span>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
