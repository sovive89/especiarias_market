export type DriverStatus = "AVAILABLE" | "BUSY" | "OFFLINE";
export type DeliveryStatus =
  | "ASSIGNED"
  | "READY"
  | "IN_ROUTE"
  | "ARRIVED"
  | "DELIVERED_BY_DRIVER"
  | "CONFIRMED_BY_CUSTOMER"
  | "PROBLEM"
  | "CANCELLED";
export type RouteStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type DeliveryProblemType =
  | "CUSTOMER_NOT_FOUND"
  | "INCORRECT_ADDRESS"
  | "CUSTOMER_UNRESPONSIVE"
  | "PAYMENT_PROBLEM"
  | "PRODUCT_PROBLEM"
  | "ACCIDENT_OR_UNFORESEEN"
  | "OTHER";

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
}
export interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  routeId: string;
  sequence: number;
  status: DeliveryStatus;
  customerName: string;
  customerPhone: string;
  address: string;
  complement?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  trackingEnabled: boolean;
  trackingToken?: string;
  distanceKm?: number;
  etaMinutes?: number;
}
export interface Route {
  id: string;
  driverId: string;
  status: RouteStatus;
  startedAt?: string;
  finishedAt?: string;
  totalStops: number;
}
export interface RouteStop {
  deliveryId: string;
  sequence: number;
}
export type DeliveryEventType =
  | "ROUTE_STARTED"
  | "ROUTE_FINISHED"
  | "DELIVERY_STARTED"
  | "DELIVERY_ARRIVED"
  | "DELIVERY_COMPLETED"
  | "DELIVERY_PROBLEM";
export interface DeliveryEvent {
  id: string;
  deliveryId: string;
  driverId: string;
  type: DeliveryEventType;
  createdAt: string;
  latitude?: number;
  longitude?: number;
}
export interface DeliveryProblem {
  deliveryId: string;
  type: DeliveryProblemType;
  description: string;
}
export interface TrackingPosition {
  deliveryId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}
