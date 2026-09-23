/**
 * Tipos usados só no servidor pelo bot conversacional do WhatsApp (fora do bundle do
 * navegador). Os tipos "oficiais" do catálogo (PlacedOrder etc.) continuam em
 * src/types/marketplace.ts — aqui é só o que existe apenas durante a conversa.
 */
import type { WhatsAppMenuItem } from "@/types/marketplace";

/** Em que ponto da conversa o cliente está. Avança em ordem; "fechando" volta pra "itens" se ele mandar mais um número. */
export type ConversationStep =
  | "menu" // acabou de escrever, ainda não recebeu o cardápio
  | "itens" // vendo o cardápio, respondendo números
  | "localizacao" // já disse "fechar", esperando o botão de localização
  | "pagamento" // localização recebida, esperando escolher Pix/Cartão/Dinheiro
  | "concluido"; // pedido criado, conversa encerrada (mensagem nova reabre do zero)

export interface ConversationCartLine {
  skuId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface ConversationState {
  step: ConversationStep;
  cart: ConversationCartLine[];
  /** Nome do cliente, se a Meta mandar no perfil do WhatsApp (nem sempre vem). */
  profileName?: string;
  location?: { latitude: number; longitude: number };
  paymentMethod?: "Pix" | "Cartão" | "Dinheiro";
  updatedAt: string;
}

/**
 * Cliente identificado pelo telefone (é o ID — não tem cadastro/login). Guarda nome e
 * última localização conhecida para agilizar o próximo pedido.
 */
export interface WhatsAppCustomerRecord {
  phone: string;
  name: string;
  /**
   * lat/long "cru", sem endereço formatado — de propósito: fica pronto pra um dia
   * plugar Geocoding/Routes API (reverse geocoding, cálculo de rota) sem reescrever
   * este registro. Por enquanto a entrega usa só o link do mapa (lat,long).
   */
  lastLocation?: { latitude: number; longitude: number };
  lastOrderAt?: string;
  createdAt: string;
}

/**
 * "Foto" do cardápio + config do bot que o navegador do gestor empurra pro KV a cada
 * alteração em /admin/whatsapp, pra o servidor (que não tem acesso ao localStorage)
 * saber o que responder.
 */
export interface CatalogMirror {
  enabled: boolean;
  menuImageUrl: string;
  items: WhatsAppMenuItem[];
  messages: {
    boasVindas: string;
    itemAdicionado: string;
    pedirLocalizacao: string;
    pedirPagamento: string;
    confirmacaoFinal: string;
  };
  /** Preço e nome de cada SKU no momento do espelhamento — o bot não acessa o catálogo direto. */
  skus: { id: string; name: string; price: number }[];
  updatedAt: string;
}

/** Pedido criado pelo bot, serializado pra entrar na fila do KV até o navegador do gestor puxar. */
export interface PendingWhatsAppOrder {
  id: string;
  code: string;
  createdAt: string;
  items: {
    skuId: string;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
  }[];
  total: number;
  customer: { name: string; phone: string };
  address: string;
  /** Lat/long recebidos pelo botão nativo de localização do WhatsApp — mesmo campo que PlacedOrder.location. */
  location?: { latitude: number; longitude: number };
  paymentMethod: string;
}
