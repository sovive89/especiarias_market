/**
 * Acesso ao Vercel KV — a "memória" do bot conversacional do WhatsApp.
 *
 * Por que KV e não localStorage aqui: o webhook da Meta chama o servidor direto
 * (não passa pelo navegador de ninguém), então não existe "localStorage" nesse
 * momento — precisa de um lugar no servidor para guardar em que passo da conversa
 * cada cliente está entre uma mensagem e outra. É a ÚNICA parte do sistema que usa
 * um banco de verdade; o resto do app (cardápio, estoque, pedidos feitos pelo site)
 * continua 100% em localStorage, sem servidor. Ver docs/WHATSAPP.md.
 *
 * Este arquivo só pode ser importado por outros arquivos de src/server/whatsapp/**
 * e por src/server.ts — nunca por uma tela (o vite.config.ts bloqueia isso).
 */
import { kv } from "@vercel/kv";
import type { CatalogMirror, ConversationState, WhatsAppCustomerRecord } from "./types";

/** true = as variáveis de ambiente da Vercel KV (KV_REST_API_URL/TOKEN) estão presentes. */
export function isKvConfigured(): boolean {
  return Boolean(process.env["KV_REST_API_URL"] && process.env["KV_REST_API_TOKEN"]);
}

const CONVO_TTL_SECONDS = 60 * 60 * 6; // 6h sem responder = conversa esquecida, começa do zero

function conversationKey(phone: string) {
  return `wa:conversation:${phone}`;
}
function customerKey(phone: string) {
  return `wa:customer:${phone}`;
}
const CATALOG_MIRROR_KEY = "wa:catalog-mirror";
const PENDING_ORDERS_KEY = "wa:pending-orders";

export async function getConversation(phone: string): Promise<ConversationState | null> {
  return (await kv.get<ConversationState>(conversationKey(phone))) ?? null;
}

export async function saveConversation(phone: string, state: ConversationState): Promise<void> {
  await kv.set(conversationKey(phone), state, { ex: CONVO_TTL_SECONDS });
}

export async function clearConversation(phone: string): Promise<void> {
  await kv.del(conversationKey(phone));
}

/** Telefone é o ID do cliente: mesmo registro é reaproveitado em pedidos futuros. */
export async function getCustomer(phone: string): Promise<WhatsAppCustomerRecord | null> {
  return (await kv.get<WhatsAppCustomerRecord>(customerKey(phone))) ?? null;
}

export async function saveCustomer(record: WhatsAppCustomerRecord): Promise<void> {
  await kv.set(customerKey(record.phone), record);
}

/** "Foto" do cardápio numerado, empurrada pelo navegador do gestor a cada alteração. */
export async function getCatalogMirror(): Promise<CatalogMirror | null> {
  return (await kv.get<CatalogMirror>(CATALOG_MIRROR_KEY)) ?? null;
}

export async function saveCatalogMirror(mirror: CatalogMirror): Promise<void> {
  await kv.set(CATALOG_MIRROR_KEY, mirror);
}

/**
 * Pedidos criados pelo bot esperando o navegador do gestor puxar (baixar estoque
 * local e entrar na fila de /admin/pedidos). Fila simples em uma lista KV.
 */
export async function pushPendingOrder(orderJson: string): Promise<void> {
  await kv.rpush(PENDING_ORDERS_KEY, orderJson);
}

export async function drainPendingOrders(): Promise<string[]> {
  const all = await kv.lrange<string>(PENDING_ORDERS_KEY, 0, -1);
  if (all.length) await kv.del(PENDING_ORDERS_KEY);
  return all;
}
