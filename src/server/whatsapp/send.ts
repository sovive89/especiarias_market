/**
 * Envio de mensagens da Cloud API da Meta para o bot CONVERSACIONAL (pedido feito
 * dentro do WhatsApp). Diferente de src/lib/whatsappBot.ts (que só manda templates
 * aprovados para notificação de status): aqui o cliente já iniciou a conversa, então
 * dentro da janela de 24h a Meta deixa mandar texto livre e mensagens interativas
 * (botão de pedir localização, botões de forma de pagamento, imagem do cardápio).
 *
 * Mora em src/server/whatsapp porque usa as credenciais direto — nunca pode ser
 * importado por uma tela.
 */
const DEFAULT_API_VERSION = "v21.0";

interface Credentials {
  token: string;
  phoneNumberId: string;
  apiVersion: string;
}

export function readWhatsAppCredentials(): Credentials | null {
  const token = process.env["WHATSAPP_TOKEN"];
  const phoneNumberId = process.env["WHATSAPP_PHONE_NUMBER_ID"];
  if (!token || !phoneNumberId) return null;
  return {
    token,
    phoneNumberId,
    apiVersion: process.env["WHATSAPP_API_VERSION"] || DEFAULT_API_VERSION,
  };
}

async function callGraphApi(creds: Credentials, body: Record<string, unknown>) {
  const res = await fetch(
    `https://graph.facebook.com/${creds.apiVersion}/${creds.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
    },
  );
  const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  if (!res.ok) {
    console.error(
      "Falha ao enviar mensagem do bot de pedidos WhatsApp:",
      json?.error ?? res.status,
    );
  }
  return res.ok;
}

export async function sendText(creds: Credentials, to: string, body: string): Promise<boolean> {
  return callGraphApi(creds, { to, type: "text", text: { body } });
}

/** Botão nativo "Enviar localização" — é o único jeito aceito de coletar o endereço da entrega. */
export async function sendLocationRequest(
  creds: Credentials,
  to: string,
  body: string,
): Promise<boolean> {
  return callGraphApi(creds, {
    to,
    type: "interactive",
    interactive: {
      type: "location_request_message",
      body: { text: body },
      action: { name: "send_location" },
    },
  });
}

/** Até 3 botões de resposta rápida — usado para Pix / Cartão / Dinheiro. */
export async function sendButtons(
  creds: Credentials,
  to: string,
  body: string,
  buttons: { id: string; title: string }[],
): Promise<boolean> {
  return callGraphApi(creds, {
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: buttons.map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  });
}

/**
 * Sobe a imagem do cardápio (data URL salva pelo gestor em /admin/whatsapp) para a
 * Media API da Meta e devolve o media id, para ser referenciado no envio.
 */
async function uploadMenuImage(creds: Credentials, dataUrl: string): Promise<string | null> {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  const mimeType = match?.[1];
  const base64 = match?.[2];
  if (!mimeType || !base64) return null;
  const bytes = Buffer.from(base64, "base64");
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("file", new Blob([new Uint8Array(bytes)], { type: mimeType }), "cardapio.jpg");

  const res = await fetch(
    `https://graph.facebook.com/${creds.apiVersion}/${creds.phoneNumberId}/media`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${creds.token}` },
      body: form,
    },
  );
  const json = (await res.json().catch(() => null)) as { id?: string; error?: unknown } | null;
  if (!res.ok || !json?.id) {
    console.error("Falha ao subir a imagem do cardápio para a Meta:", json?.error ?? res.status);
    return null;
  }
  return json.id;
}

/** Manda a imagem do cardápio numerado com uma legenda. */
export async function sendMenuImage(
  creds: Credentials,
  to: string,
  menuImageDataUrl: string,
  caption: string,
): Promise<boolean> {
  const mediaId = await uploadMenuImage(creds, menuImageDataUrl);
  if (!mediaId) return sendText(creds, to, caption);
  return callGraphApi(creds, {
    to,
    type: "image",
    image: { id: mediaId, caption },
  });
}
