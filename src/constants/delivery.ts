import type { Delivery, DeliveryEventType, DeliveryProblemType, DeliveryStatus } from "../types/delivery";

/* Tudo o que é "texto que depende do status" fica aqui, num lugar só. */

export type Tone = "neutral" | "good" | "warning" | "info" | "danger";

export const STATUS_META: Record<DeliveryStatus, { label: string; tone: Tone }> = {
  ASSIGNED: { label: "Aguardando", tone: "neutral" },
  READY: { label: "Pronta p/ coleta", tone: "warning" },
  IN_ROUTE: { label: "A caminho", tone: "info" },
  ARRIVED: { label: "No local", tone: "info" },
  DELIVERED_BY_DRIVER: { label: "Entregue", tone: "good" },
  CONFIRMED_BY_CUSTOMER: { label: "Confirmada", tone: "good" },
  PROBLEM: { label: "Problema", tone: "danger" },
  CANCELLED: { label: "Cancelada", tone: "neutral" }
};

const DONE: DeliveryStatus[] = ["DELIVERED_BY_DRIVER", "CONFIRMED_BY_CUSTOMER"];
const CLOSED: DeliveryStatus[] = [...DONE, "CANCELLED", "PROBLEM"];

export const isDone = (d: Delivery) => DONE.includes(d.status);
export const isOpen = (d: Delivery) => !CLOSED.includes(d.status);
export const hasProblem = (d: Delivery) => d.status === "PROBLEM";

/** Qual é o próximo passo de uma entrega? Usado no botão principal. */
export type NextStep = "start" | "arrived" | "complete";

export function nextStepOf(status: DeliveryStatus): { step: NextStep; label: string } | null {
  switch (status) {
    case "ASSIGNED":
    case "READY":
      return { step: "start", label: "Iniciar entrega" };
    case "IN_ROUTE":
      return { step: "arrived", label: "Cheguei no local" };
    case "ARRIVED":
      return { step: "complete", label: "Confirmar entrega" };
    default:
      return null;
  }
}

export const PROBLEM_OPTIONS: { type: DeliveryProblemType; label: string }[] = [
  { type: "CUSTOMER_NOT_FOUND", label: "Cliente não encontrado" },
  { type: "INCORRECT_ADDRESS", label: "Endereço incorreto" },
  { type: "CUSTOMER_UNRESPONSIVE", label: "Cliente não responde" },
  { type: "PAYMENT_PROBLEM", label: "Problema de pagamento" },
  { type: "PRODUCT_PROBLEM", label: "Problema com produto" },
  { type: "ACCIDENT_OR_UNFORESEEN", label: "Acidente / imprevisto" },
  { type: "OTHER", label: "Outro problema" }
];

export const EVENT_LABEL: Record<DeliveryEventType, string> = {
  ROUTE_STARTED: "Rota iniciada",
  ROUTE_FINISHED: "Rota finalizada",
  DELIVERY_STARTED: "Saiu para entrega",
  DELIVERY_ARRIVED: "Chegou no local",
  DELIVERY_COMPLETED: "Entrega concluída",
  DELIVERY_PROBLEM: "Problema registrado"
};

export function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
