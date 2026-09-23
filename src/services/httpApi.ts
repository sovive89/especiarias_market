import { api } from "../lib/api";
import type { Delivery, DeliveryEvent, DeliveryProblem, Driver, Route } from "../types/delivery";
import type { DriverDataSource } from "./dataSource";

/*
 * Fonte de dados REAL (ainda não usada).
 * Cada função já aponta para o endpoint que o backend vai precisar ter.
 * A lista completa está em docs/API.md.
 */
export const httpApi: DriverDataSource = {
  getDriver: () => api.get<Driver>("/driver/me"),
  setAvailability: available => api.patch<Driver>("/driver/me/availability", { available }),
  getRoute: () => api.get<Route>("/driver/me/route"),
  startRoute: () => api.post<Route>("/driver/me/route/start"),
  finishRoute: () => api.post<Route>("/driver/me/route/finish"),
  getDeliveries: () => api.get<Delivery[]>("/driver/me/deliveries"),
  getEvents: () => api.get<DeliveryEvent[]>("/driver/me/events"),
  startDelivery: id => api.post<Delivery>(`/deliveries/${id}/start`),
  arrived: id => api.post<Delivery>(`/deliveries/${id}/arrived`),
  complete: id => api.post<Delivery>(`/deliveries/${id}/complete`),
  problem: (p: DeliveryProblem) => api.post<Delivery>(`/deliveries/${p.deliveryId}/problem`, { type: p.type, description: p.description })
};
