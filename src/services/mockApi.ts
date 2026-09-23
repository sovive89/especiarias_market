import type { Delivery, Driver, Route } from "../types/delivery";

const driver: Driver = { id: "driver-001", name: "Ricardo", phone: "+5561999999999", status: "AVAILABLE" };
const deliveries: Delivery[] = [
  { id: "del-001", orderId: "ord-001", driverId: driver.id, routeId: "route-001", sequence: 1, status: "READY", customerName: "Cliente 01", customerPhone: "+5561991111111", address: "Asa Norte, Brasília - DF", complement: "Apto 302", notes: "Interfone 302", trackingEnabled: false, distanceKm: 3.2, etaMinutes: 9 },
  { id: "del-002", orderId: "ord-002", driverId: driver.id, routeId: "route-001", sequence: 2, status: "ASSIGNED", customerName: "Cliente 02", customerPhone: "+5561992222222", address: "Asa Sul, Brasília - DF", complement: "Bloco B", notes: "", trackingEnabled: false, distanceKm: 5.1, etaMinutes: 15 },
  { id: "del-003", orderId: "ord-003", driverId: driver.id, routeId: "route-001", sequence: 3, status: "ASSIGNED", customerName: "Cliente 03", customerPhone: "+5561993333333", address: "Lago Sul, Brasília - DF", complement: "Casa 14", notes: "Portão lateral", trackingEnabled: false, distanceKm: 7.4, etaMinutes: 22 }
];
const route: Route = { id: "route-001", driverId: driver.id, status: "PENDING", totalStops: deliveries.length };

export const mockApi = {
  getDeliveriesSync() { return deliveries.map(d => ({ ...d })); },
  async getDriver() { return driver; },
  async getRoute() { return route; },
  async getDeliveries() { return deliveries; },
  async startRoute() { route.status = "IN_PROGRESS"; driver.status = "BUSY"; return route; },
  async startDelivery(id: string) { const d = deliveries.find(x => x.id === id)!; d.status = "IN_ROUTE"; d.trackingEnabled = true; d.trackingToken = `mock-token-${id}`; return d; },
  async arrived(id: string) { const d = deliveries.find(x => x.id === id)!; d.status = "ARRIVED"; return d; },
  async complete(id: string) { const d = deliveries.find(x => x.id === id)!; d.status = "DELIVERED_BY_DRIVER"; return d; },
  async problem(id: string) { const d = deliveries.find(x => x.id === id)!; d.status = "PROBLEM"; return d; }
};