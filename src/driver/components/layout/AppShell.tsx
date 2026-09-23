import { AlertTriangle, LoaderCircle, Package, X } from "lucide-react";
import { Link, Outlet } from "@tanstack/react-router";
import { useCatalog } from "@/context/CatalogContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useDriver } from "../../context/DriverContext";
import { DeliveryDetailSheet } from "../delivery/DeliveryDetailSheet";
import { ProblemSheet } from "../delivery/ProblemSheet";
import { NAV_ITEMS } from "./navItems";

/*
 * Moldura da área do entregador: cabeçalho (igual ao da loja), conteúdo da página e navegação inferior.
 * A classe "driver-app" isola o CSS do entregador para ele não vazar para a loja.
 */
export function AppShell() {
  const { driver, available, stats, selected, sheet, loading, error, dismissError } = useDriver();
  const { branding } = useCatalog();

  return (
    <div className="driver-app">
      <div className="app">
        <header className="topbar">
          <div className="topbar__inner">
            <Link to="/entregador" className="logo" aria-label="Início">
              {branding.logo ? (
                <img src={branding.logo} alt={branding.name} />
              ) : (
                branding.name.charAt(0)
              )}
            </Link>
            <div className="topbar__brand">
              <p>{branding.name}</p>
              <p className="mono muted">
                entregador ·{" "}
                <span className={available ? "text-success" : undefined}>
                  {available ? "online" : "pausado"}
                </span>
              </p>
            </div>

            <nav className="topbar__nav" aria-label="Principal">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="nav-pill"
                  activeProps={{ className: "is-active" }}
                  activeOptions={{ exact: item.to === "/entregador" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <ThemeToggle className="!size-9" />
            <Link
              to="/entregador/entregas"
              className="topbar__counter"
              aria-label={`${stats.open} entregas pendentes`}
            >
              <Package size={19} aria-hidden />
              {stats.open > 0 && <span className="topbar__badge">{stats.open}</span>}
            </Link>
            <Link to="/entregador/perfil" className="avatar" aria-label="Perfil">
              {driver?.name.charAt(0) ?? "?"}
            </Link>
          </div>
        </header>

        <main className="page">
          {error && (
            <div className="alert" role="alert">
              <AlertTriangle size={18} aria-hidden />
              <span>{error}</span>
              <button
                type="button"
                className="icon-btn"
                aria-label="Fechar aviso"
                onClick={dismissError}
              >
                <X size={18} />
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading" role="status">
              <LoaderCircle size={28} className="spin" aria-hidden />
              Carregando sua rota…
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        <nav className="bottom-nav" aria-label="Principal">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="bottom-nav__item"
              activeProps={{ className: "is-active" }}
              activeOptions={{ exact: to === "/entregador" }}
            >
              <Icon size={20} aria-hidden />
              {label}
            </Link>
          ))}
        </nav>

        {selected && sheet === "detail" && <DeliveryDetailSheet delivery={selected} />}
        {selected && sheet === "problem" && <ProblemSheet delivery={selected} />}
      </div>
    </div>
  );
}
