import { dataSource } from "./dataSource";

export const routeService = {
  get: () => dataSource.getRoute(),
  start: () => dataSource.startRoute(),
  finish: () => dataSource.finishRoute(),
};
