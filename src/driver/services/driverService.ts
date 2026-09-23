import { dataSource } from "./dataSource";

export const driverService = {
  get: () => dataSource.getDriver(),
  setAvailability: (available: boolean) => dataSource.setAvailability(available),
};
