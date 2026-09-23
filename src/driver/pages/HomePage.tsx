import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Flag,
  LocateFixed,
  MapPin,
  Navigation,
  PackageCheck,
  PartyPopper,
  Power,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCatalog } from "@/context/CatalogContext";
import { DeliveryCard, StatusBadge } from "../components/delivery/DeliveryCard";
import { MockMap } from "../components/delivery/MockMap";
import { NextActionButton } from "../components/delivery/NextActionButton";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  SectionTitle,
  Stat,
  Surface,
} from "../components/ui";
import { isOpen } from "../constants/delivery";
import { useDriver } from "../context/DriverContext";
import { cn } from "../lib/cn";
import { formatKm, formatToday, greeting, pad2 } from "../lib/format";
import type { Delivery } from "../types/delivery";

function pickupText(status: Delivery["status"]) {
  if (status === "READY") return "Pedido pronto para retirada";
  if (status === "ASSIGNED") return "Aguardando separação na loja";
  return "Pedido coletado";
}

export function HomePage() {
  const {
    driver,
    stats,
    nextDelivery,
    deliveries,
    available,
    routeStarted,
    routeFinished,
    busy,
    sharingLocation,
    locationError,
    toggleAvailability,
    startRoute,
    finishRoute,
    openDelivery,
  } = useDriver();
  const { branding } = useCatalog();
  const progress = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const upcoming = deliveries.filter((d) => d.id !== nextDelivery?.id && isOpen(d)).slice(0, 2);

  return (
    <>
      <PageHeader
        eyebrow={formatToday()}
        title={`${greeting()}, ${driver?.name ?? ""}`}
        subtitle={
          routeFinished
            ? "Rota de hoje finalizada."
            : routeStarted
              ? "Rota em andamento."
              : "Sua rota de hoje está pronta."
        }
        action={
          <button
            type="button"
            onClick={toggleAvailability}
            disabled={busy}
            className={cn("power-btn", available && "is-on")}
            aria-pressed={available}
            aria-label={available ? "Pausar entregas" : "Ficar disponível"}
          >
            <Power size={22} />
          </button>
        }
      />

      <Surface className="availability">
        <div>
          <strong>{available ? "Disponível para entregas" : "Entregas pausadas"}</strong>
          <p className={cn("muted", "availability__gps", locationError && "text-warning")}>
            {locationError ? (
              <>
                <AlertTriangle size={14} aria-hidden /> {locationError}
              </>
            ) : sharingLocation ? (
              <>
                <LocateFixed size={14} aria-hidden /> Compartilhando sua localização em tempo real.
              </>
            ) : available ? (
              <>
                <LocateFixed size={14} aria-hidden /> Ativando GPS…
              </>
            ) : (
              "Fique disponível para compartilhar sua localização."
            )}
          </p>
        </div>
        <Badge tone={available ? "good" : "neutral"}>{available ? "Online" : "Pausado"}</Badge>
      </Surface>

      <Surface className="route-progress">
        <div className="route-progress__top">
          <div>
            <span className="section-label">Rota de hoje</span>
            <p className="route-progress__count">
              {stats.done}
              <span className="muted">/{stats.total} entregas</span>
            </p>
          </div>
          <span className="mono muted">{progress}%</span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="route-progress__meta mono muted">
          <span>{formatKm(stats.remainingKm)} restantes</span>
          <span>~{stats.remainingMin} min</span>
        </div>
        {routeStarted && stats.open === 0 && (
          <Button size="lg" block disabled={busy} onClick={finishRoute}>
            <Flag size={20} /> Finalizar rota
          </Button>
        )}
        {!routeStarted && !routeFinished && stats.open > 0 && (
          <Button size="lg" block disabled={busy || !available} onClick={startRoute}>
            <Navigation size={20} /> Iniciar rota
          </Button>
        )}
        {!available && !routeStarted && !routeFinished && (
          <p className="hint">Fique disponível para iniciar a rota.</p>
        )}
      </Surface>

      <div className="stats-grid">
        <Stat icon={<Clock3 size={18} />} value={stats.open} label="Pendentes" />
        <Stat icon={<CheckCircle2 size={18} />} value={stats.done} label="Concluídas" tone="good" />
        <Stat
          icon={<AlertTriangle size={18} />}
          value={stats.problems}
          label="Problemas"
          tone={stats.problems ? "danger" : "neutral"}
        />
      </div>

      <SectionTitle
        action={
          <Link to="/entregador/entregas" className="link">
            Ver todas
          </Link>
        }
      >
        Próxima entrega
      </SectionTitle>

      {nextDelivery ? (
        <Surface className="next-delivery">
          <button
            type="button"
            className="next-delivery__head"
            onClick={() => openDelivery(nextDelivery.id)}
          >
            <span>
              <span className="mono muted">
                Parada {pad2(nextDelivery.sequence)} · {nextDelivery.orderId}
              </span>
              <strong>{nextDelivery.customerName}</strong>
            </span>
            <StatusBadge status={nextDelivery.status} />
          </button>
          <div className="next-delivery__steps">
            <div>
              <PackageCheck size={20} className="text-primary" aria-hidden />
              <span>
                <strong>Coleta · {branding.name}</strong>
                <small className="muted">{pickupText(nextDelivery.status)}</small>
              </span>
            </div>
            <div>
              <MapPin size={20} className="text-primary" aria-hidden />
              <span>
                <strong>{nextDelivery.address}</strong>
                <small className="muted">
                  {nextDelivery.distanceKm !== undefined && formatKm(nextDelivery.distanceKm)} ·
                  cerca de {nextDelivery.etaMinutes ?? "--"} min
                </small>
              </span>
            </div>
          </div>
          <MockMap className="next-delivery__map" />
          {routeStarted && <NextActionButton delivery={nextDelivery} />}
        </Surface>
      ) : (
        <Surface>
          <EmptyState
            icon={<PartyPopper size={24} />}
            title={routeFinished ? "Rota finalizada!" : "Nenhuma entrega em aberto"}
            text={
              routeFinished
                ? "Bom trabalho. Até a próxima rota."
                : "Finalize a rota para encerrar o dia."
            }
          />
        </Surface>
      )}

      {upcoming.length > 0 && (
        <>
          <SectionTitle>Depois</SectionTitle>
          <div className="list">
            {upcoming.map((d) => (
              <DeliveryCard key={d.id} delivery={d} onOpen={() => openDelivery(d.id)} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
