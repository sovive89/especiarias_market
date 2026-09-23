import { ChevronRight, Clock3, MapPin, Navigation } from "lucide-react";
import { STATUS_META, mapsUrl } from "../../constants/delivery";
import { formatKm, pad2 } from "../../lib/format";
import type { Delivery } from "../../types/delivery";
import { Badge } from "../ui";

export function StatusBadge({ status }: { status: Delivery["status"] }) {
  const meta = STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

/*
 * Card de entrega. Antes era um <article> com onClick e um botão dentro
 * (botão dentro de área clicável confunde leitores de tela e o teclado).
 * Agora são dois elementos lado a lado: o card (botão) e o link de navegação.
 */
export function DeliveryCard({ delivery, onOpen }: { delivery: Delivery; onOpen: () => void }) {
  return (
    <div className="delivery-card surface">
      <button type="button" className="delivery-card__main" onClick={onOpen}>
        <span className="seq mono">{pad2(delivery.sequence)}</span>
        <span className="delivery-card__body">
          <span className="delivery-card__head">
            <strong>{delivery.customerName}</strong>
            <StatusBadge status={delivery.status} />
          </span>
          <span className="delivery-card__address">
            <MapPin size={14} aria-hidden />
            {delivery.address}
          </span>
          <span className="delivery-card__meta mono">
            <span>
              <Clock3 size={13} aria-hidden />
              {delivery.etaMinutes ?? "--"} min
            </span>
            <span>
              {delivery.distanceKm !== undefined ? formatKm(delivery.distanceKm) : "-- km"}
            </span>
          </span>
        </span>
        <ChevronRight size={18} className="muted" aria-hidden />
      </button>
      <a
        className="icon-btn icon-btn--soft"
        href={mapsUrl(delivery.address)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Navegar até ${delivery.customerName}`}
      >
        <Navigation size={18} />
      </a>
    </div>
  );
}
