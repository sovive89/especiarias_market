/**
 * Endpoint HTTP cru do webhook da Meta (WhatsApp Cloud API), chamado de src/server.ts
 * ANTES do handler normal do TanStack Start — esta versão do framework não tem rota
 * de API tipo createServerFileRoute, então interceptamos aqui pela URL. Ver docs/WHATSAPP.md
 * para o passo a passo de configurar isso no app da Meta.
 *
 * GET  = handshake de verificação (a Meta manda hub.challenge + hub.verify_token).
 * POST = evento de mensagem recebida.
 */
import { handleIncomingMessage } from "./conversation";

export const WHATSAPP_WEBHOOK_PATH = "/api/whatsapp/webhook";

export function isWhatsAppWebhookRequest(url: URL): boolean {
  return url.pathname === WHATSAPP_WEBHOOK_PATH;
}

function verifyToken(): string | undefined {
  return process.env["WHATSAPP_WEBHOOK_VERIFY_TOKEN"];
}

function handleVerification(url: URL): Response {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = verifyToken();
  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Verificação falhou.", { status: 403 });
}

/** Formato do payload de webhook da Meta (só os campos que usamos). */
interface MetaWebhookPayload {
  entry?: {
    changes?: {
      value?: {
        contacts?: { profile?: { name?: string } }[];
        messages?: {
          from?: string;
          type?: string;
          text?: { body?: string };
          location?: { latitude?: number; longitude?: number };
          interactive?: { button_reply?: { id?: string } };
        }[];
      };
    }[];
  }[];
}

async function handleEvent(request: Request): Promise<Response> {
  // Responde 200 imediatamente por regra da Meta (senão ela reenvia); processa depois.
  let payload: MetaWebhookPayload;
  try {
    payload = (await request.json()) as MetaWebhookPayload;
  } catch {
    return new Response("ok", { status: 200 });
  }

  const tasks: Promise<void>[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const profileName = value?.contacts?.[0]?.profile?.name;
      for (const message of value?.messages ?? []) {
        if (!message.from) continue;
        const location =
          message.location?.latitude != null && message.location?.longitude != null
            ? { latitude: message.location.latitude, longitude: message.location.longitude }
            : undefined;
        tasks.push(
          handleIncomingMessage({
            from: message.from,
            ...(profileName ? { profileName } : {}),
            ...(message.text?.body ? { text: message.text.body } : {}),
            ...(location ? { location } : {}),
            ...(message.interactive?.button_reply?.id
              ? { buttonReplyId: message.interactive.button_reply.id }
              : {}),
          }).catch((e: unknown) => console.error("Erro processando mensagem do WhatsApp:", e)),
        );
      }
    }
  }
  await Promise.all(tasks);
  return new Response("ok", { status: 200 });
}

export async function handleWhatsAppWebhook(request: Request, url: URL): Promise<Response> {
  if (request.method === "GET") return handleVerification(url);
  if (request.method === "POST") return handleEvent(request);
  return new Response("Método não permitido.", { status: 405 });
}
