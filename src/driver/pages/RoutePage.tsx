import { Flag, Navigation } from "lucide-react";
import { MockMap } from "../components/delivery/MockMap";
import { RouteStops } from "../components/delivery/RouteStops";
import { Button, PageHeader, SectionTitle, Surface } from "../components/ui";
import { useDriver } from "../context/DriverContext";
import { formatKm } from "../lib/format";

export function RoutePage() {
  const {
    deliveries,
    stats,
    routeStarted,
    routeFinished,
    nextDelivery,
    available,
    busy,
    startRoute,
    finishRoute,
    openDelivery,
  } = useDriver();

  return (
    <>
      <PageHeader
        eyebrow="Rota do dia"
        title={
          routeFinished ? "Rota finalizada" : routeStarted ? "Em andamento" : "Rota não iniciada"
        }
        subtitle={`${stats.total} paradas · ${stats.done} concluídas`}
      />

      <MockMap className="route-map" label="Brasília · rota atual" />

      <Surface className="summary">
        <div>
          <strong>{stats.open}</strong>
          <span className="section-label">Paradas</span>
        </div>
        <div>
          <strong>{formatKm(stats.remainingKm)}</strong>
          <span className="section-label">Distância</span>
        </div>
        <div>
          <strong>{stats.remainingMin} min</strong>
          <span className="section-label">Tempo</span>
        </div>
      </Surface>

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

      <SectionTitle action={<span className="mono muted">{deliveries.length} paradas</span>}>
        Sequência
      </SectionTitle>
      <RouteStops
        deliveries={deliveries}
        currentId={routeStarted ? nextDelivery?.id : undefined}
        onOpen={openDelivery}
      />
    </>
  );
}
