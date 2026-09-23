import type { DeliveryProblem } from "../types/delivery";
import { dataSource } from "./dataSource";

export const deliveryService = {
  list: () => dataSource.getDeliveries(),
  events: () => dataSource.getEvents(),
  start: (id: string) => dataSource.startDelivery(id),
  arrived: (id: string) => dataSource.arrived(id),
  complete: (id: string) => dataSource.complete(id),
  reportProblem: (problem: DeliveryProblem) => dataSource.problem(problem)
};
