import { Bike, Flag, Store } from "lucide-react";
import { cn } from "../../lib/cn";

/* Mapa ilustrativo (mesmo desenho do marketplace). Será trocado por um mapa real depois. */
export function MockMap({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn("mock-map", className)} role="img" aria-label={label ?? "Mapa ilustrativo da rota"}>
      <span className="map-road road-a" />
      <span className="map-road road-b" />
      <span className="map-road road-c" />
      <span className="map-pin map-pin--start"><Store size={18} /></span>
      <span className="map-pin map-pin--rider"><Bike size={20} /></span>
      <span className="map-pin map-pin--end"><Flag size={18} /></span>
      {label && <span className="mock-map__label mono">{label}</span>}
    </div>
  );
}
