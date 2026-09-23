/**
 * Início do gestor: números do dia calculados dos pedidos reais, fila atual,
 * insumos para repor e mais vendidos. Tudo vem do mesmo CatalogSnapshot.
 */
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronRight, ClipboardList, Plus, UtensilsCrossed } from "lucide-react";
import { useMemo } from "react";
import { Surface } from "@/components/ui";
import { useCatalog } from "@/context/CatalogContext";
import { brl, num } from "./controls";
import { STATUS_LABEL } from "./OrdersAdmin";

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

export function DashboardAdmin() {
  const { orders, inventory, products } = useCatalog();

  const stats = useMemo(() => {
    const today = orders.filter((o) => isToday(o.createdAt) && o.status !== "cancelado");
    const revenue = today.reduce((s, o) => s + o.total, 0);
    const counts = new Map<string, number>();
    for (const o of orders.filter((x) => x.status !== "cancelado"))
      for (const i of o.items)
        counts.set(i.productName, (counts.get(i.productName) ?? 0) + i.quantity);
    const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      revenue,
      count: today.length,
      ticket: today.length ? revenue / today.length : 0,
      open: orders.filter((o) => ["novo", "preparo", "pronto", "entrega"].includes(o.status)),
      top,
    };
  }, [orders]);

  const low = inventory.filter((i) => i.current < i.minimum);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="kpi-grid">
        <Kpi label="Vendas hoje" value={brl(stats.revenue)} />
        <Kpi label="Pedidos hoje" value={String(stats.count)} />
        <Kpi label="Ticket médio" value={brl(stats.ticket)} />
        <Kpi label="Na fila agora" value={String(stats.open.length)} />
      </div>

      {products.length === 0 && (
        <Link
          to="/admin/cardapio"
          className="flex items-center gap-3 rounded-2xl border border-primary bg-primary-soft p-4"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Plus />
          </span>
          <span className="flex-1">
            <b className="block">Monte seu cardápio</b>
            <small className="text-muted">Crie os itens que o cliente vai ver na loja.</small>
          </span>
          <ChevronRight className="text-primary" />
        </Link>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface>
          <Header icon={ClipboardList} title="Pedidos em andamento" to="/admin/pedidos" />
          {stats.open.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nenhum pedido em andamento.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {stats.open.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">
                    <b className="font-mono">#{o.code}</b> · {o.customer.name || "Cliente"}
                  </span>
                  <span className="shrink-0 rounded-full bg-muted-surface px-2 py-0.5 text-[11px] font-bold">
                    {STATUS_LABEL[o.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <Surface>
          <Header icon={AlertTriangle} title="Insumos para repor" to="/admin/estoque" />
          {low.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Tudo acima do mínimo.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {low.map((i) => (
                <li key={i.id} className="flex justify-between gap-2 text-sm">
                  <span className="truncate">{i.name}</span>
                  <b className="shrink-0 text-warning-foreground">
                    {num(i.current)} / {num(i.minimum)} {i.unit}
                  </b>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <Surface className="lg:col-span-2">
          <Header icon={UtensilsCrossed} title="Mais vendidos" to="/admin/cardapio" />
          {stats.top.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Aparece depois das primeiras vendas.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {stats.top.map(([name, qty]) => {
                const max = stats.top[0]?.[1] ?? 1;
                return (
                  <li key={name} className="grid gap-1 text-sm">
                    <div className="flex justify-between">
                      <span className="truncate">{name}</span>
                      <b>{qty}</b>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted-surface">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(qty / max) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Surface>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Surface>
      <p className="section-label">{label}</p>
      <b className="mt-2 block text-2xl">{value}</b>
    </Surface>
  );
}

function Header({
  icon: I,
  title,
  to,
}: {
  icon: typeof ClipboardList;
  title: string;
  to: "/admin/pedidos" | "/admin/estoque" | "/admin/cardapio";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 font-bold">
        <I size={18} className="text-primary" /> {title}
      </span>
      <Link to={to} className="text-xs font-bold text-primary">
        Ver tudo
      </Link>
    </div>
  );
}
