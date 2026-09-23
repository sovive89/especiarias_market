/**
 * O "cérebro" do bot conversacional: recebe uma mensagem que chegou pelo webhook da
 * Meta e decide o que responder, avançando o cliente pelos passos
 * menu → itens → localização → pagamento → concluído.
 *
 * Fica tudo em texto/interativo simples de propósito — sem IA, sem NLP: o cliente só
 * responde números do cardápio, manda a localização pelo botão nativo e escolhe um
 * botão de pagamento. Isso torna o fluxo previsível e fácil de revisar.
 */
import type { WhatsAppMenuItem } from "@/types/marketplace";
import {
  getCatalogMirror,
  getConversation,
  getCustomer,
  pushPendingOrder,
  saveConversation,
  saveCustomer,
  clearConversation,
} from "./kv";
import {
  readWhatsAppCredentials,
  sendButtons,
  sendLocationRequest,
  sendMenuImage,
  sendText,
} from "./send";
import type {
  CatalogMirror,
  ConversationCartLine,
  ConversationState,
  PendingWhatsAppOrder,
} from "./types";

interface IncomingMessage {
  from: string; // telefone, já no formato internacional que a Meta manda (ex.: "5561999999999")
  profileName?: string;
  text?: string;
  location?: { latitude: number; longitude: number };
  buttonReplyId?: string;
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    template,
  );
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function newState(): ConversationState {
  return { step: "menu", cart: [], updatedAt: new Date().toISOString() };
}

function findMenuItem(mirror: CatalogMirror, numberText: string): WhatsAppMenuItem | undefined {
  const clean = numberText.trim();
  return mirror.items.find((i) => i.number.trim() === clean);
}

/** Gera um código de pedido do bot distinto do sequencial do site (evita disputa de contador). */
function generateOrderCode(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `MPW-${rand}`;
}

/**
 * Ponto de entrada chamado pelo webhook (src/server.ts) a cada mensagem recebida.
 * Não lança erro para fora: qualquer problema é logado e a função simplesmente não
 * responde nada (a Meta não espera resposta síncrona a este envio).
 */
export async function handleIncomingMessage(msg: IncomingMessage): Promise<void> {
  const creds = readWhatsAppCredentials();
  if (!creds) {
    console.error("Bot de pedidos WhatsApp: credenciais da Meta não configuradas.");
    return;
  }

  const mirror = await getCatalogMirror();
  if (!mirror || !mirror.enabled) {
    // Bot desligado ou gestor ainda não configurou nada em /admin/whatsapp: não responde.
    return;
  }

  const state = (await getConversation(msg.from)) ?? newState();
  if (msg.profileName && !state.profileName) state.profileName = msg.profileName;

  // "fechar"/"finalizar" em qualquer ponto (menos já concluído) avança pra localização.
  const wantsToClose =
    !!msg.text && /^\s*(fechar|finalizar|concluir)\s*$/i.test(msg.text) && state.cart.length > 0;

  if (state.step === "menu") {
    await sendMenuImage(creds, msg.from, mirror.menuImageUrl, mirror.messages.boasVindas);
    state.step = "itens";
    await saveConversation(msg.from, state);
    return;
  }

  if (state.step === "itens") {
    if (wantsToClose) {
      state.step = "localizacao";
      await sendLocationRequest(creds, msg.from, mirror.messages.pedirLocalizacao);
      await saveConversation(msg.from, state);
      return;
    }
    const menuItem = msg.text ? findMenuItem(mirror, msg.text) : undefined;
    if (!menuItem) {
      await sendText(
        creds,
        msg.from,
        'Não entendi. Responda com o número do item do cardápio, ou "fechar" para finalizar.',
      );
      return;
    }
    const sku = mirror.skus.find((s) => s.id === menuItem.skuId);
    if (!sku) {
      await sendText(creds, msg.from, "Esse item não está mais disponível. Escolha outro número.");
      return;
    }
    const existing = state.cart.find((l) => l.skuId === sku.id);
    if (existing) existing.quantity += 1;
    else
      state.cart.push({ skuId: sku.id, productName: sku.name, unitPrice: sku.price, quantity: 1 });
    await sendText(
      creds,
      msg.from,
      fillTemplate(mirror.messages.itemAdicionado, { item: sku.name }),
    );
    await saveConversation(msg.from, state);
    return;
  }

  if (state.step === "localizacao") {
    if (!msg.location) {
      await sendText(
        creds,
        msg.from,
        "Preciso da sua localização pelo botão do WhatsApp (clipe 📎 → Localização) para continuar.",
      );
      return;
    }
    state.location = msg.location;
    state.step = "pagamento";
    await sendButtons(creds, msg.from, mirror.messages.pedirPagamento, [
      { id: "pix", title: "Pix" },
      { id: "cartao", title: "Cartão" },
      { id: "dinheiro", title: "Dinheiro" },
    ]);
    await saveConversation(msg.from, state);
    return;
  }

  if (state.step === "pagamento") {
    const paymentMap: Record<string, "Pix" | "Cartão" | "Dinheiro"> = {
      pix: "Pix",
      cartao: "Cartão",
      dinheiro: "Dinheiro",
    };
    const chosen = msg.buttonReplyId ? paymentMap[msg.buttonReplyId] : undefined;
    if (!chosen) {
      await sendText(creds, msg.from, "Escolha uma das opções de pagamento nos botões acima.");
      return;
    }
    state.paymentMethod = chosen;

    const order = await finalizeOrder(msg.from, state, mirror);
    await sendText(
      creds,
      msg.from,
      fillTemplate(mirror.messages.confirmacaoFinal, {
        codigo: order.code,
        total: formatBRL(order.total),
      }),
    );
    await clearConversation(msg.from);
    return;
  }

  // step "concluido" ou qualquer estado inesperado: começa uma conversa nova.
  await clearConversation(msg.from);
  await handleIncomingMessage(msg);
}

/**
 * Fecha o pedido: grava/atualiza o cliente (telefone é o ID) e enfileira o pedido no
 * KV para o navegador do gestor absorver (baixar estoque local, entrar em /admin/pedidos).
 */
async function finalizeOrder(
  phone: string,
  state: ConversationState,
  mirror: CatalogMirror,
): Promise<PendingWhatsAppOrder> {
  const existingCustomer = await getCustomer(phone);
  const name = existingCustomer?.name || state.profileName || "Cliente WhatsApp";
  const lastLocation = state.location ?? existingCustomer?.lastLocation;
  await saveCustomer({
    phone,
    name,
    ...(lastLocation ? { lastLocation } : {}),
    lastOrderAt: new Date().toISOString(),
    createdAt: existingCustomer?.createdAt ?? new Date().toISOString(),
  });

  const items = state.cart.map((line: ConversationCartLine) => {
    const skuName = mirror.skus.find((s) => s.id === line.skuId)?.name ?? line.productName;
    return {
      skuId: line.skuId,
      productName: skuName,
      unit: "un",
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    };
  });
  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const addressLabel = state.location
    ? `https://maps.google.com/?q=${state.location.latitude},${state.location.longitude}`
    : "Localização não informada";

  const order: PendingWhatsAppOrder = {
    id: `wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    code: generateOrderCode(),
    createdAt: new Date().toISOString(),
    items,
    total: Math.round(total * 100) / 100,
    customer: { name, phone },
    address: addressLabel,
    paymentMethod: state.paymentMethod ?? "Não informado",
  };
  await pushPendingOrder(JSON.stringify(order));
  return order;
}
