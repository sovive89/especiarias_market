import { CheckCircle2, MapPin, Navigation } from "lucide-react";
import { nextStepOf, type NextStep } from "../../constants/delivery";
import { useDriver } from "../../context/DriverContext";
import type { Delivery } from "../../types/delivery";
import { Button } from "../ui";

const ICONS: Record<NextStep, typeof Navigation> = { start: Navigation, arrived: MapPin, complete: CheckCircle2 };

/* O botão grande que avança a entrega: Iniciar → Cheguei → Confirmar. Usado na Home e no painel. */
export function NextActionButton({ delivery }: { delivery: Delivery }) {
  const { advance, busy } = useDriver();
  const next = nextStepOf(delivery.status);
  if (!next) return null;
  const Icon = ICONS[next.step];

  return (
    <Button size="lg" block disabled={busy} onClick={() => advance(delivery.id, next.step)}>
      <Icon size={20} aria-hidden />
      {next.label}
    </Button>
  );
}
