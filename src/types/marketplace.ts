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
/**
 * Registro de tudo que mexe no estoque de um insumo.
 * quantity é positiva quando entra e negativa quando sai.
 */
export type StockMovementType = "entrada" | "ajuste" | "venda" | "estorno";
export interface StockMovement {
  id: string;
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number;
  /** Custo por unidade do insumo; só existe nas entradas (compras). */
  unitCost?: number;
  note?: string;
  createdAt: string;
}
/**
 * Etapas do pedido no painel do gestor (mesma sequência dos apps de delivery):
 * novo → em preparo → pronto → saiu para entrega → entregue. Cancelado sai da fila.
 */
export type PlacedOrderStatus =
  "novo" | "preparo" | "pronto" | "entrega" | "entregue" | "cancelado";
/** Linha do pedido com nome e preço copiados no momento da compra (não muda se o produto mudar). */
export interface PlacedOrderItem {
  skuId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}
/** Pedido real feito pela loja (sem cadastro de cliente: só nome e telefone do pedido). */
export interface PlacedOrder {
  id: string;
  code: string;
  createdAt: string;
  items: PlacedOrderItem[];
  total: number;
  customer: { name: string; phone: string };
  address: string;
  paymentMethod: string;
  status: PlacedOrderStatus;
  updatedAt: string;
}
/**
 * Entregador cadastrado pelo gestor. O PIN é uma trava de organização local
 * (guardada no navegador, sem servidor) — não é segurança de verdade: quem abre
 * o devtools consegue ver. Serve para cada entregador logar no próprio celular
 * sem precisar de cadastro de usuário/senha completo.
 */
export interface StoreDriver {
  id: string;
  name: string;
  phone: string;
  pin: string;
  active: boolean;
  createdAt: string;
  /** Última posição de GPS enviada pelo próprio celular do entregador (opcional). */
  location?: DriverGpsPosition;
}
/** Posição de GPS do aparelho do entregador — não é rastreamento por rota, é a última posição conhecida. */
export interface DriverGpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  updatedAt: string;
}
/**
 * Identidade da loja no PWA: nome, mensagem, tempo de entrega, logo e o
 * telefone do WhatsApp que recebe os pedidos. Editável pelo gestor, sem
 * precisar redeployar — antes isso vinha fixo do código/variável de ambiente.
 */
export interface StoreBranding {
  name: string;
  message: string;
  eta: string;
  logo: string;
  whatsappNumber: string;
}
/**
 * Um template aprovado na Meta (Gerenciador de Negócios) para uma etapa do pedido.
 * O template precisa ter exatamente 2 variáveis de corpo: {{1}} nome do cliente, {{2}} código do pedido.
 * O nome e o idioma são os mesmos cadastrados na Meta — o app não cria templates, só os usa.
 */
export interface WhatsAppTemplate {
  name: string;
  language: string;
}
/**
 * Configuração do bot de notificações do WhatsApp Business (mensagens automáticas da loja
 * para o cliente). As credenciais (token, phone number id) NÃO ficam aqui — moram só em
 * variáveis de ambiente do servidor (Vercel), por segurança; isto aqui é só o "de-para"
 * de qual template mandar em cada etapa do pedido, editável pelo gestor.
 */
export interface WhatsAppBotConfig {
  enabled: boolean;
  templates: Partial<Record<PlacedOrderStatus, WhatsAppTemplate>>;
}
/** Uma "foto" completa do catálogo, do estoque e dos pedidos. É o que a fonte de dados carrega e salva. */
export interface CatalogSnapshot {
  products: BaseProduct[];
  skus: ProductSKU[];
  inventory: InventoryItem[];
  movements: StockMovement[];
  orders: PlacedOrder[];
  drivers: StoreDriver[];
  branding: StoreBranding;
  whatsappBot: WhatsAppBotConfig;
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
