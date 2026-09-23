import { AlertTriangle, MapPin, Navigation, Phone, StickyNote } from "lucide-react";
import { isOpen, mapsUrl } from "../../constants/delivery";
import { useDriver } from "../../context/DriverContext";
import { formatKm, pad2 } from "../../lib/format";
import type { Delivery } from "../../types/delivery";
import { Button, Sheet } from "../ui";
import { StatusBadge } from "./DeliveryCard";
import { NextActionButton } from "./NextActionButton";

export function DeliveryDetailSheet({ delivery }: { delivery: Delivery }) {
  const { closeSheet, openProblem } = useDriver();

  return (
    <Sheet eyebrow={`Parada ${pad2(delivery.sequence)} · pedido ${delivery.orderId}`} title={delivery.customerName} onClose={closeSheet}>
      <div className="sheet__status">
        <StatusBadge status={delivery.status} />
        <span className="mono muted">
          {delivery.distanceKm !== undefined && formatKm(delivery.distanceKm)} · {delivery.etaMinutes ?? "--"} min
        </span>
      </div>

      <div className="info-box">
        <MapPin size={20} aria-hidden />
        <div>
          <strong>{delivery.address}</strong>
          {delivery.complement && <span className="muted">{delivery.complement}</span>}
        </div>
      </div>

      {delivery.notes && (
        <div className="info-box info-box--note">
          <StickyNote size={20} aria-hidden />
          <div>
            <span className="section-label">Observação</span>
            <span>{delivery.notes}</span>
          </div>
        </div>
      )}

      <div className="sheet__quick">
        <a className="btn btn--secondary" href={`tel:${delivery.customerPhone}`}>
          <Phone size={18} aria-hidden /> Ligar
        </a>
        <a className="btn btn--secondary" href={mapsUrl(delivery.address)} target="_blank" rel="noreferrer">
          <Navigation size={18} aria-hidden /> Navegar
        </a>
      </div>

      <div className="sheet__actions">
        <NextActionButton delivery={delivery} />
        {isOpen(delivery) && (
          <Button variant="danger" block onClick={openProblem}>
            <AlertTriangle size={18} aria-hidden /> Registrar problema
          </Button>
        )}
      </div>
    </Sheet>
  );
}
