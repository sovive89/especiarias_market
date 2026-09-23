/**
 * Ponte entre a tela (que só tem localStorage) e o servidor (que fala com o Vercel KV)
 * para o bot conversacional do WhatsApp.
 *
 * Este arquivo mora em src/lib (não em src/server) igual a whatsappBot.ts: é importado
 * normalmente pelo CatalogContext (lado do cliente), mas createServerFn garante que o
 * corpo de cada função só roda no servidor. Dentro do handler, o import de
 * src/server/whatsapp/** é feito com `await import(...)` (nunca `import` estático no
 * topo do arquivo) para esse código nunca entrar no bundle do navegador — é a regra
 * de segurança deste projeto (credenciais da Meta e do KV nunca podem viajar pro cliente).
 */
import { createServerFn } from "@tanstack/react-start";
import type { WhatsAppOrderingConfig } from "@/types/marketplace";

export interface CatalogMirrorInput {
  ordering: WhatsAppOrderingConfig;
  skus: { id: string; name: string; price: number }[];
}

/**
 * Chamado pelo navegador do gestor toda vez que o catálogo é salvo: manda pro KV uma
 * "foto" do cardápio numerado + config do bot, pro servidor conseguir responder o
 * webhook sem depender do localStorage de ninguém.
 */
export const syncWhatsAppCatalogMirror = createServerFn({ method: "POST" })
  .validator((data: CatalogMirrorInput) => data)
  .handler(async ({ data }) => {
    const { isKvConfigured, saveCatalogMirror } = await import("@/server/whatsapp/kv");
    if (!isKvConfigured()) return { synced: false };
    await saveCatalogMirror({
      enabled: data.ordering.enabled,
      menuImageUrl: data.ordering.menuImageUrl,
      items: data.ordering.items,
      messages: data.ordering.messages,
      skus: data.skus,
      updatedAt: new Date().toISOString(),
    });
    return { synced: true };
  });

/**
 * Puxado periodicamente pelo navegador do gestor (enquanto a tela do admin estiver
 * aberta): busca pedidos que o bot criou desde a última vez e esvazia a fila do KV.
 * O CatalogContext absorve cada um com rules.absorbWhatsAppOrder (baixa estoque local
 * e entra na fila de /admin/pedidos) — idempotente, então não duplica se chamado 2x.
 */
export const pullWhatsAppOrders = createServerFn({ method: "GET" }).handler(async () => {
  const { isKvConfigured, drainPendingOrders } = await import("@/server/whatsapp/kv");
  if (!isKvConfigured()) return { orders: [] as string[] };
  const orders = await drainPendingOrders();
  return { orders };
});
