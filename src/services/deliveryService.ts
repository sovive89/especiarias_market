import { mockApi } from "./mockApi";
export const deliveryService = {
  start: (id: string) => mockApi.startDelivery(id),
  arrived: (id: string) => mockApi.arrived(id),
  complete: (id: string) => mockApi.complete(id),
  problem: (id: string) => mockApi.problem(id)
};