/**
 * Fila de pedidos do gestor, no formato dos apps de delivery:
 * colunas Novos → Em preparo → Prontos → Em entrega, e um botão para avançar.
 * No celular as colunas viram abas. Cancelar devolve os insumos ao estoque.
 */
import { useEffect, useState } from "react";
import { ChevronRight, Clock, MapPin, MessageCircle, Phone, X } from "lucide-react";
import { Button } from "@/components/ui";
import { useCatalog } from "@/context/CatalogContext";
import { nextStatus } from "@/services/catalog/rules";
import type { PlacedOrder, PlacedOrderStatus } from "@/types/marketplace";
import { brl, ErrorNote } from "./controls";
import { cn } from "@/lib/utils";

export const STATUS_LABEL: Record<PlacedOrderStatus, string> = {
  novo: "Novos",
  preparo: "Em preparo",
  pronto: "Prontos",
  entrega: "Em entrega",
  entregue: "Entregues",
  cancelado: "Cancelados",
};

const ADVANCE_LABEL: Partial<Record<PlacedOrderStatus, string>> = {
  novo: "Aceitar e preparar",
  preparo: "Marcar como pronto",
  pronto: "Saiu para entrega",
  entrega: "Confirmar entrega",
};

const COLUMNS: PlacedOrderStatus[] = ["novo", "preparo", "pronto", "entrega"];
const HISTORY: PlacedOrderStatus[] = ["entregue", "cancelado"];

/** "há 5 min", recalculado a cada 30 s. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}
function ago(iso: string, now: number) {
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `há ${h} h` : new Date(iso).toLocaleDateString("pt-BR");
}

export function OrdersAdmin() {
  const { orders, setOrderStatus } = useCatalog();
  const [tab, setTab] = useState<PlacedOrderStatus>("novo");
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");
  const now = useNow();

  const byStatus = (s: PlacedOrderStatus) => orders.filter((o) => o.status === s);

  const move = (o: PlacedOrder, status: PlacedOrderStatus) => {
    setError("");
    if (
      status === "cancelado" &&
      !window.confirm(`Cancelar o pedido ${o.code}? Os insumos voltam para o estoque.`)
    )
      return;
    try {
      setOrderStatus(o.id, status);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  if (orders.length === 0) {
    return (
      <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
        <b className="text-lg">Nenhum pedido ainda</b>
        <p className="max-w-sm text-sm text-muted">
          Quando um cliente confirmar o pagamento na loja, o pedido aparece aqui em “Novos” e o
          estoque já é descontado.
        </p>
      </div>
    );
  }

  const columns = showHistory ? HISTORY : COLUMNS;

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="hide-scrollbar -mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 md:hidden">
          {columns.map((s) => (
            <button key={s} onClick={() => setTab(s)} className={cn("chip", tab === s && "active")}>
              {STATUS_LABEL[s]}
              <b>{byStatus(s).length}</b>
            </button>
          ))}
        </div>
        <button
          className="chip ml-auto"
          onClick={() => {
            setShowHistory((h) => !h);
            setTab(showHistory ? "novo" : "entregue");
          }}
        >
          {showHistory ? "Ver fila" : "Histórico"}
        </button>
      </div>
      <ErrorNote message={error} />

      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          showHistory ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4",
        )}
      >
        {columns.map((s) => (
          <section
            key={s}
            className={cn(
              "grid min-w-0 grid-cols-1 content-start gap-3",
              tab !== s && "max-md:hidden",
            )}
          >
            <h2 className="hidden items-center gap-2 text-sm font-extrabold md:flex">
              <span
                className={cn(
                  "size-2 rounded-full",
                  s === "novo" ? "bg-accent" : s === "cancelado" ? "bg-border" : "bg-primary",
                )}
              />
              {STATUS_LABEL[s]}
              <span className="text-muted">{byStatus(s).length}</span>
            </h2>
            {byStatus(s).length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted">
                Nada aqui
              </p>
            ) : (
              byStatus(s).map((o) => (
                <OrderCard key={o.id} order={o} now={now} onMove={(st) => move(o, st)} />
              ))
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function OrderCard({
  order: o,
  now,
  onMove,
}: {
  order: PlacedOrder;
  now: number;
  onMove: (s: PlacedOrderStatus) => void;
}) {
  const next = nextStatus(o.status);
  const phone = o.customer.phone.replace(/\D/g, "");
  const open = o.status !== "entregue" && o.status !== "cancelado";
  return (
    <article
      className={cn(
        "grid gap-3 rounded-2xl border bg-surface-strong p-3",
        o.status === "novo" ? "border-accent" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <b className="font-mono">#{o.code}</b>
          <p className="text-sm font-semibold">{o.customer.name || "Cliente"}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted">
          <Clock size={12} /> {ago(o.createdAt, now)}
        </span>
      </div>
      <ul className="grid gap-1 text-sm">
        {o.items.map((i) => (
          <li key={i.skuId} className="flex justify-between gap-2">
            <span className="min-w-0">
              <b>{i.quantity}x</b> {i.productName}
              <span className="text-xs text-muted"> · {i.unit}</span>
            </span>
            <span className="shrink-0 text-muted">{brl(i.unitPrice * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
        <span className="text-xs text-muted">{o.paymentMethod}</span>
        <b>{brl(o.total)}</b>
      </div>
      {o.address && (
        <p className="flex items-start gap-1.5 text-xs text-muted">
          <MapPin size={13} className="mt-0.5 shrink-0" /> {o.address}
        </p>
      )}
      {open && next && (
        <Button className="min-h-10 w-full text-xs" onClick={() => onMove(next)}>
          {ADVANCE_LABEL[o.status]} <ChevronRight size={16} />
        </Button>
      )}
      <div className="flex gap-2">
        {phone && (
          <a
            href={`https://wa.me/55${phone.replace(/^55/, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="card-action flex-1 justify-center border border-border"
          >
            <MessageCircle size={15} /> WhatsApp
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="card-action border border-border"
            aria-label="Ligar para o cliente"
          >
            <Phone size={15} />
          </a>
        )}
        {open && (
          <button
            className="card-action border border-border"
            onClick={() => onMove("cancelado")}
            aria-label={`Cancelar pedido ${o.code}`}
          >
            <X size={15} /> Cancelar
          </button>
        )}
      </div>
    </article>
  );
}
