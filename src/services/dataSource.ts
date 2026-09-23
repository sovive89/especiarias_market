import type { Delivery, DeliveryEvent, DeliveryProblem, Driver, Route } from "../types/delivery";
import { httpApi } from "./httpApi";
import { mockApi } from "./mockApi";

/*
 * CONTRATO da fonte de dados.
 * Qualquer "backend" (o simulado ou o real) precisa oferecer exatamente estas funções.
 * O resto do app só conhece este contrato — não sabe se os dados vêm da memória ou de um banco.
 */
export interface DriverDataSource {
  getDriver(): Promise<Driver>;
  setAvailability(available: boolean): Promise<Driver>;
  getRoute(): Promise<Route>;
  startRoute(): Promise<Route>;
  finishRoute(): Promise<Route>;
  getDeliveries(): Promise<Delivery[]>;
  getEvents(): Promise<DeliveryEvent[]>;
  startDelivery(id: string): Promise<Delivery>;
  arrived(id: string): Promise<Delivery>;
  complete(id: string): Promise<Delivery>;
  problem(problem: DeliveryProblem): Promise<Delivery>;
}

/*
 * Chave que escolhe a fonte. Hoje: sempre "mock" (sem banco).
 * Para ligar o backend no futuro, basta criar um arquivo .env com:
 *   VITE_DATA_SOURCE=http
 *   VITE_API_URL=https://sua-api.com
 */
const source = import.meta.env.VITE_DATA_SOURCE === "http" ? "http" : "mock";

export const dataSource: DriverDataSource = source === "http" ? httpApi : mockApi;
export const isMockData = source === "mock";
