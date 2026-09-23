import type {
  Delivery,
  DeliveryEvent,
  DeliveryEventType,
  DeliveryProblem,
  DeliveryStatus,
  Driver,
  Route,
} from "../types/delivery";
import type { DriverDataSource } from "./dataSource";

/*
 * "Backend de mentira": guarda os dados em memória e responde como se fosse uma API.
 * Todas as funções devolvem CÓPIAS, para a interface nunca alterar estes objetos diretamente.
 * Quando o backend real existir, basta trocar VITE_DATA_SOURCE para "http" (ver dataSource.ts).
 */

const driver: Driver = {
  id: "driver-001",
  name: "Ricardo",
  phone: "+5561999999999",
  status: "AVAILABLE",
};

const deliveries: Delivery[] = [
  {
    id: "del-001",
    orderId: "ord-001",
    driverId: driver.id,
    routeId: "route-001",
    sequence: 1,
    status: "READY",
    customerName: "Marina Costa",
    customerPhone: "+5561991111111",
    address: "SQN 210, Bloco C — Asa Norte, Brasília",
    complement: "Apto 302",
    notes: "Interfone 302",
    trackingEnabled: false,
    distanceKm: 3.2,
    etaMinutes: 9,
  },
  {
    id: "del-002",
    orderId: "ord-002",
    driverId: driver.id,
    routeId: "route-001",
    sequence: 2,
    status: "ASSIGNED",
    customerName: "João Pereira",
    customerPhone: "+5561992222222",
    address: "SQS 308, Bloco B — Asa Sul, Brasília",
    complement: "Bloco B, apto 104",
    notes: "",
    trackingEnabled: false,
    distanceKm: 5.1,
    etaMinutes: 15,
  },
  {
    id: "del-003",
    orderId: "ord-003",
    driverId: driver.id,
    routeId: "route-001",
    sequence: 3,
    status: "ASSIGNED",
    customerName: "Ana Ribeiro",
    customerPhone: "+5561993333333",
    address: "SHIS QI 11, Conjunto 4 — Lago Sul, Brasília",
    complement: "Casa 14",
    notes: "Portão lateral",
    trackingEnabled: false,
    distanceKm: 7.4,
    etaMinutes: 22,
  },
];

const route: Route = {
  id: "route-001",
  driverId: driver.id,
  status: "PENDING",
  totalStops: deliveries.length,
};

const events: DeliveryEvent[] = [];
const problems: DeliveryProblem[] = [];

const clone = <T>(value: T): T => structuredClone(value);
const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

function findDelivery(id: string) {
  const delivery = deliveries.find((d) => d.id === id);
  if (!delivery) throw new Error(`Entrega ${id} não encontrada.`);
  return delivery;
}

function logEvent(type: DeliveryEventType, deliveryId = "") {
  events.unshift({
    id: `evt-${events.length + 1}`,
    deliveryId,
    driverId: driver.id,
    type,
    createdAt: new Date().toISOString(),
  });
}

async function setStatus(id: string, status: DeliveryStatus, event: DeliveryEventType) {
  await wait();
  const delivery = findDelivery(id);
  delivery.status = status;
  if (status === "IN_ROUTE") {
    delivery.trackingEnabled = true;
    delivery.trackingToken = `mock-token-${id}`;
  }
  logEvent(event, id);
  return clone(delivery);
}

export const mockApi: DriverDataSource = {
  async getDriver() {
    return clone(driver);
  },
  async getRoute() {
    return clone(route);
  },
  async getDeliveries() {
    return clone(deliveries);
  },
  async getEvents() {
    return clone(events);
  },

  async setAvailability(available: boolean) {
    driver.status = available ? (route.status === "IN_PROGRESS" ? "BUSY" : "AVAILABLE") : "OFFLINE";
    return clone(driver);
  },

  async startRoute() {
    await wait();
    route.status = "IN_PROGRESS";
    route.startedAt = new Date().toISOString();
    driver.status = "BUSY";
    logEvent("ROUTE_STARTED");
    return clone(route);
  },

  async finishRoute() {
    await wait();
    if (deliveries.some((d) => ["ASSIGNED", "READY", "IN_ROUTE", "ARRIVED"].includes(d.status))) {
      throw new Error("Ainda há entregas em aberto nesta rota.");
    }
    route.status = "COMPLETED";
    route.finishedAt = new Date().toISOString();
    driver.status = driver.status === "OFFLINE" ? "OFFLINE" : "AVAILABLE";
    logEvent("ROUTE_FINISHED");
    return clone(route);
  },

  startDelivery: (id: string) => setStatus(id, "IN_ROUTE", "DELIVERY_STARTED"),
  arrived: (id: string) => setStatus(id, "ARRIVED", "DELIVERY_ARRIVED"),
  complete: (id: string) => setStatus(id, "DELIVERED_BY_DRIVER", "DELIVERY_COMPLETED"),

  async problem(problem: DeliveryProblem) {
    problems.push({ ...problem });
    return setStatus(problem.deliveryId, "PROBLEM", "DELIVERY_PROBLEM");
  },
};
