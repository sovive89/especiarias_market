export interface CatalogService {
  listProducts(): Promise<unknown[]>;
}
export interface PaymentGateway {
  createPayment(orderId: string, amount: number): Promise<{ externalId: string }>;
}
export interface MapsProvider {
  estimateRoute(
    origin: string,
    destination: string,
  ): Promise<{ distanceKm: number; minutes: number }>;
}
export interface MessagingProvider {
  sendTemplate(to: string, template: string, variables: Record<string, string>): Promise<void>;
}
export const integrationStatus = {
  catalog: "mock",
  payments: "not-connected",
  maps: "not-connected",
  whatsapp: "not-connected",
} as const;
