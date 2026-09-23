import { Check, ChevronRight } from "lucide-react";
import { hasProblem, isDone } from "../../constants/delivery";
import { cn } from "../../lib/cn";
import { pad2 } from "../../lib/format";
import type { Delivery } from "../../types/delivery";
import { StatusBadge } from "./DeliveryCard";

/* Lista de paradas em formato de linha do tempo (bolinha + linha ligando uma à outra). */
export function RouteStops({ deliveries, currentId, onOpen }: { deliveries: Delivery[]; currentId?: string; onOpen: (id: string) => void }) {
  return (
    <ol className="stops surface">
      {deliveries.map(d => (
        <li key={d.id} className={cn("stop", isDone(d) && "is-done", hasProblem(d) && "is-problem", d.id === currentId && "is-current")}>
          <span className="stop__dot mono">{isDone(d) ? <Check size={14} /> : pad2(d.sequence)}</span>
          <button type="button" className="stop__main" onClick={() => onOpen(d.id)}>
            <span className="stop__info">
              <strong>{d.customerName}</strong>
              <small className="muted">{d.address}</small>
            </span>
            <StatusBadge status={d.status} />
            <ChevronRight size={18} className="muted" aria-hidden />
          </button>
        </li>
      ))}
    </ol>
  );
}
