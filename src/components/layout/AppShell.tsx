import { AlertTriangle, LoaderCircle, Package, X } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useDriver } from "../../context/DriverContext";
import { cn } from "../../lib/cn";
import { DeliveryDetailSheet } from "../delivery/DeliveryDetailSheet";
import { ProblemSheet } from "../delivery/ProblemSheet";
import { NAV_ITEMS } from "./navItems";

/* Moldura do app: cabeçalho (igual ao do marketplace), conteúdo da página e navegação inferior. */
export function AppShell() {
  const { driver, available, stats, selected, sheet, loading, error, dismissError } = useDriver();

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <Link to="/" className="logo" aria-label="Início">E</Link>
          <div className="topbar__brand">
            <p>Especiarias</p>
            <p className="mono muted">
              entregador · <span className={available ? "text-success" : undefined}>{available ? "online" : "pausado"}</span>
            </p>
          </div>

          <nav className="topbar__nav" aria-label="Principal">
            {NAV_ITEMS.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => cn("nav-pill", isActive && "is-active")}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Link to="/entregas" className="topbar__counter" aria-label={`${stats.open} entregas pendentes`}>
            <Package size={19} aria-hidden />
            {stats.open > 0 && <span className="topbar__badge">{stats.open}</span>}
          </Link>
          <Link to="/perfil" className="avatar" aria-label="Perfil">
            {driver?.name.charAt(0) ?? "?"}
          </Link>
        </div>
      </header>

      <main className="page">
        {error && (
          <div className="alert" role="alert">
            <AlertTriangle size={18} aria-hidden />
            <span>{error}</span>
            <button type="button" className="icon-btn" aria-label="Fechar aviso" onClick={dismissError}>
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
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => cn("bottom-nav__item", isActive && "is-active")}>
            <Icon size={20} aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      {selected && sheet === "detail" && <DeliveryDetailSheet delivery={selected} />}
      {selected && sheet === "problem" && <ProblemSheet delivery={selected} />}
    </div>
  );
}
