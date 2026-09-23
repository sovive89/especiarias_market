export type OrderStatus =
  "Aguardando pagamento" | "Preparando" | "Pronto" | "Em rota" | "Entregue" | "Cancelado";
export interface BaseProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  skuIds: string[];
}
export interface ProductSKU {
  id: string;
  baseProductId: string;
  inventoryItemId: string;
  name: string;
  unit: string;
  packSize: number;
  price: number;
  active: boolean;
}
export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  current: number;
  minimum: number;
  averageCost: number;
}
export interface CartItem {
  skuId: string;
  quantity: number;
}
export interface Customer {
  id: string;
  name: string;
  phone: string;
}
export interface DeliveryLocation {
  id: string;
  orderId?: string;
  label: "Casa" | "Trabalho" | "Outro";
  address: string;
  complement: string;
  reference: string;
  classification: "residência" | "trabalho" | "estabelecimento" | "outro";
}
export type FinancialStatus =
  | "Pago"
  | "Aguardando pagamento"
  | "Pagamento pendente"
  | "Pagamento recusado"
  | "Pagamento expirado"
  | "Parcialmente pago"
  | "Estornado"
  | "Cancelado"
  | "Em aberto"
  | "Pagamento em atraso";
export interface Payment {
  id: string;
  orderId: string;
  method: "PIX" | "Cartão" | "Dinheiro";
  status: "Aguardando" | "Iniciado" | "Aprovado" | "Recusado";
  financialStatus?: FinancialStatus;
  amount: number;
  paidAmount?: number;
  dueAt?: string;
  gateway?: string;
  confirmedBy?: "gateway" | "administrador";
}
export interface OrderItem {
  skuId: string;
  quantity: number;
  unitPrice: number;
}
export interface Order {
  id: string;
  customer: Customer;
  items: OrderItem[];
  location: DeliveryLocation;
  payment: Payment;
  status: OrderStatus;
  total: number;
  createdAt: string;
  priorityScore: number;
  driver?: string;
}
export interface Driver {
  id: string;
  name: string;
  available: boolean;
  activeDeliveries: number;
  rating: number;
}
