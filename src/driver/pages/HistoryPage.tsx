import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Flag,
  History,
  MapPin,
  Navigation,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { EmptyState, PageHeader, Stat, Surface } from "../components/ui";
import { EVENT_LABEL } from "../constants/delivery";
import { useDriver } from "../context/DriverContext";
import { cn } from "../lib/cn";
import { formatTime } from "../lib/format";
import type { DeliveryEventType } from "../types/delivery";

const EVENT_ICON: Record<DeliveryEventType, LucideIcon> = {
  ROUTE_STARTED: Navigation,
  ROUTE_FINISHED: Flag,
  DELIVERY_STARTED: Truck,
  DELIVERY_ARRIVED: MapPin,
  DELIVERY_COMPLETED: CheckCircle2,
  DELIVERY_PROBLEM: AlertTriangle,
};

/* Antes o histórico era texto fixo. Agora mostra os eventos reais da sessão. */
export function HistoryPage() {
  const { events, deliveries, stats } = useDriver();
  const nameOf = (id: string) => deliveries.find((d) => d.id === id)?.customerName;

  return (
    <>
      <PageHeader
        eyebrow="Histórico"
        title="Atividade de hoje"
        subtitle="Tudo o que aconteceu na sua rota."
      />

      <div className="stats-grid stats-grid--2">
        <Stat
          icon={<CheckCircle2 size={18} />}
          value={stats.done}
          label="Entregas concluídas"
          tone="good"
        />
        <Stat icon={<Clock3 size={18} />} value={events.length} label="Eventos registrados" />
      </div>

      {events.length ? (
        <Surface as="section" className="timeline">
          <ol>
            {events.map((ev) => {
              const Icon = EVENT_ICON[ev.type];
              const name = nameOf(ev.deliveryId);
              return (
                <li
                  key={ev.id}
                  className={cn(
                    "timeline__item",
                    ev.type === "DELIVERY_PROBLEM" && "is-problem",
                    ev.type === "DELIVERY_COMPLETED" && "is-done",
                  )}
                >
                  <span className="timeline__icon">
                    <Icon size={16} />
                  </span>
                  <span className="timeline__text">
                    <strong>{EVENT_LABEL[ev.type]}</strong>
                    {name && <small className="muted">{name}</small>}
                  </span>
                  <time className="mono muted" dateTime={ev.createdAt}>
                    {formatTime(ev.createdAt)}
                  </time>
                </li>
              );
            })}
          </ol>
        </Surface>
      ) : (
        <Surface>
          <EmptyState
            icon={<History size={24} />}
            title="Sem atividade ainda"
            text="Inicie a rota e cada etapa aparece aqui."
          />
        </Surface>
      )}
    </>
  );
}
