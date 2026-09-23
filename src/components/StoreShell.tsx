import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, Home, Package, LayoutDashboard, Truck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { operation } from "@/data/mock";
/*
 * O entregador (/entregador) e o gestor (/admin) têm moldura própria,
 * então a loja não desenha cabeçalho nem menu nessas áreas.
 */
export function StoreShell({ children }: { children: React.ReactNode }) {
  const { count } = useApp();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path.startsWith("/entregador") || path.startsWith("/admin")) return <>{children}</>;
  const checkout = path.includes("checkout") || path === "/cart";
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-surface-strong backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="grid size-10 place-items-center rounded-xl bg-primary font-extrabold text-primary-foreground"
          >
            {operation.name.charAt(0)}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold leading-none">{operation.name}</p>
            <p className="font-mono text-[10px] text-muted">entrega em {operation.eta}</p>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            <Link to="/catalog" className="nav-pill">
              Catálogo
            </Link>
            <Link to="/tracking" className="nav-pill">
              Acompanhar
            </Link>
            <Link to="/admin" className="nav-pill">
              Operação
            </Link>
            <Link to="/entregador" className="nav-pill">
              Entregador
            </Link>
          </nav>
          <Link
            to="/cart"
            aria-label="Carrinho"
            className="relative grid size-10 place-items-center rounded-xl bg-muted-surface"
          >
            <ShoppingBag size={19} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-accent text-[10px] font-extrabold">
                {count}
              </span>
            )}
          </Link>
        </div>
        {checkout && (
          <div className="mx-auto max-w-xl px-4 pb-3">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className={
                    "h-1 flex-1 rounded-full " +
                    (n <=
                    Math.min(
                      4,
                      [
                        "/cart",
                        "/checkout/customer",
                        "/checkout/address",
                        "/checkout/review",
                        "/checkout/payment",
                      ].findIndex((x) => path.startsWith(x)) + 1,
                    )
                      ? "bg-primary"
                      : "bg-primary/20")
                  }
                />
              ))}
            </div>
          </div>
        )}
      </header>
      <main>{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-surface-strong px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
        <Link to="/" className="mobile-nav">
          <Home size={18} />
          Início
        </Link>
        <Link to="/catalog" className="mobile-nav">
          <Package size={18} />
          Comprar
        </Link>
        <Link to="/tracking" className="mobile-nav">
          <Truck size={18} />
          Pedido
        </Link>
        <Link to="/admin" className="mobile-nav">
          <LayoutDashboard size={18} />
          Operação
        </Link>
      </nav>
    </div>
  );
}
