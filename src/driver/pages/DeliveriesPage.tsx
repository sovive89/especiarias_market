import { useState } from "react";
import { PackageSearch } from "lucide-react";
import { DeliveryCard } from "../components/delivery/DeliveryCard";
import { Chips, EmptyState, PageHeader } from "../components/ui";
import { hasProblem, isDone, isOpen } from "../constants/delivery";
import { useDriver } from "../context/DriverContext";
import type { Delivery } from "../types/delivery";

/* Antes os filtros eram só visuais. Agora cada um tem uma regra de verdade. */
type Filter = "all" | "open" | "done" | "problem";

const FILTERS: Record<Filter, { label: string; test: (d: Delivery) => boolean }> = {
  all: { label: "Todas", test: () => true },
  open: { label: "Pendentes", test: isOpen },
  done: { label: "Concluídas", test: isDone },
  problem: { label: "Problemas", test: hasProblem },
};

export function DeliveriesPage() {
  const { deliveries, openDelivery } = useDriver();
  const [filter, setFilter] = useState<Filter>("all");
  const visible = deliveries.filter(FILTERS[filter].test);

  const options = (Object.keys(FILTERS) as Filter[]).map((key) => ({
    value: key,
    label: FILTERS[key].label,
    count: deliveries.filter(FILTERS[key].test).length,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Entregas"
        title="Suas entregas"
        subtitle={`${deliveries.length} entregas na rota de hoje`}
      />
      <Chips label="Filtrar entregas" options={options} value={filter} onChange={setFilter} />

      {visible.length ? (
        <div className="list">
          {visible.map((d) => (
            <DeliveryCard key={d.id} delivery={d} onOpen={() => openDelivery(d.id)} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<PackageSearch size={24} />}
          title="Nada por aqui"
          text="Nenhuma entrega com este filtro."
        />
      )}
    </>
  );
}
