import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { PROBLEM_OPTIONS } from "../../constants/delivery";
import { useDriver } from "../../context/DriverContext";
import { cn } from "../../lib/cn";
import type { Delivery, DeliveryProblemType } from "../../types/delivery";
import { Button, Sheet } from "../ui";

/*
 * Antes: o tipo e o texto do problema eram escolhidos, mas nunca enviados.
 * Agora vão juntos para deliveryService.reportProblem().
 * O estado do formulário fica aqui dentro, e zera sozinho quando o painel fecha.
 */
export function ProblemSheet({ delivery }: { delivery: Delivery }) {
  const { reportProblem, openDelivery, busy } = useDriver();
  const [type, setType] = useState<DeliveryProblemType | null>(null);
  const [description, setDescription] = useState("");

  const needsText = type === "OTHER";
  const canSave = type !== null && (!needsText || description.trim().length > 0);

  return (
    <Sheet
      eyebrow="Ocorrência"
      title="Registrar problema"
      onClose={() => openDelivery(delivery.id)}
    >
      <p className="muted sheet__lead">O que aconteceu na entrega de {delivery.customerName}?</p>

      <div className="problem-grid" role="radiogroup" aria-label="Tipo de problema">
        {PROBLEM_OPTIONS.map((o) => (
          <button
            key={o.type}
            type="button"
            role="radio"
            aria-checked={type === o.type}
            className={cn("problem-option", type === o.type && "is-active")}
            onClick={() => setType(o.type)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <label className="field">
        <span>Detalhes {needsText ? "(obrigatório)" : "(opcional)"}</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o que aconteceu"
          rows={3}
        />
      </label>

      <div className="sheet__actions">
        <Button
          size="lg"
          block
          disabled={!canSave || busy}
          onClick={() => type && reportProblem(delivery.id, type, description.trim())}
        >
          <AlertTriangle size={20} aria-hidden /> Salvar ocorrência
        </Button>
      </div>
    </Sheet>
  );
}
