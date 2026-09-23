/**
 * Envio de mensagens pela WhatsApp Cloud API oficial (Meta) — só o essencial para o bot
 * de NOTIFICAÇÕES automáticas (loja → cliente): "pedido confirmado", "saiu para entrega" etc.
 *
 * As funções daqui usam createServerFn: o código deste arquivo é importado normalmente pela
 * tela (WhatsAppAdmin, OrdersAdmin), mas o corpo delas só roda no servidor (vira uma Vercel
 * Function no deploy) — é o "backend mínimo" combinado, porque o token da Meta nunca pode
 * ficar no navegador. (Por isso este arquivo mora em src/lib e não em src/server: aqui o
 * import-protection do TanStack Start permite a importação do lado do cliente, porque é a
 * própria createServerFn que isola o corpo — em src/server/ qualquer import do cliente é
 * bloqueado de propósito.) O passo a passo completo de configuração está em docs/WHATSAPP.md.
 *
 * Por enquanto o app só ENVIA mensagens de template pré-aprovadas na Meta; não recebe nem
 * responde mensagem nenhuma (isso pediria um segundo endpoint de webhook, fora do escopo
 * de "só notificações").
 */
import { createServerFn } from "@tanstack/react-start";

const DEFAULT_API_VERSION = "v21.0";

interface WhatsAppCredentials {
  token: string;
  phoneNumberId: string;
  apiVersion: string;
}

/** Lê as variáveis de ambiente do servidor. null = bot ainda não configurado (não é erro). */
function readCredentials(): WhatsAppCredentials | null {
  const token = process.env["WHATSAPP_TOKEN"];
  const phoneNumberId = process.env["WHATSAPP_PHONE_NUMBER_ID"];
  if (!token || !phoneNumberId) return null;
  return {
    token,
    phoneNumberId,
    apiVersion: process.env["WHATSAPP_API_VERSION"] || DEFAULT_API_VERSION,
  };
}

/**
 * Telefone do cliente vem digitado livre no checkout (ex.: "(61) 99999-9999"). A Cloud API
 * espera só dígitos com DDI. Sem DDI, assume Brasil (55) — é o público deste app.
 */
function toWhatsAppPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

/** Diz pra tela se o bot está configurado, sem expor token nem phone number id. */
export const getWhatsAppStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { configured: readCredentials() !== null };
});

export interface SendWhatsAppTemplateInput {
  /** Telefone do destinatário, no formato livre que o cliente digitou no checkout. */
  to: string;
  templateName: string;
  languageCode: string;
  /** Nessa ordem preenchem {{1}}, {{2}}… do corpo do template (ex.: [nomeCliente, codigoPedido]). */
  bodyParams: string[];
}

/** Manda um template aprovado pela WhatsApp Cloud API. Lança erro com mensagem em português. */
export const sendWhatsAppTemplate = createServerFn({ method: "POST" })
  .validator((data: SendWhatsAppTemplateInput) => data)
  .handler(async ({ data }) => {
    const creds = readCredentials();
    if (!creds) {
      throw new Error(
        "WhatsApp Business ainda não configurado no servidor (faltam variáveis de ambiente). Veja docs/WHATSAPP.md.",
      );
    }
    const to = toWhatsAppPhone(data.to);
    if (to.length < 12) throw new Error(`Telefone do cliente parece inválido: "${data.to}".`);

    const res = await fetch(
      `https://graph.facebook.com/${creds.apiVersion}/${creds.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${creds.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: data.templateName,
            language: { code: data.languageCode },
            ...(data.bodyParams.length
              ? {
                  components: [
                    {
                      type: "body",
                      parameters: data.bodyParams.map((text) => ({ type: "text", text })),
                    },
                  ],
                }
              : {}),
          },
        }),
      },
    );

    const json = (await res.json().catch(() => null)) as {
      error?: { message?: string };
      messages?: { id: string }[];
    } | null;

    if (!res.ok) {
      throw new Error(json?.error?.message || `A Meta recusou o envio (HTTP ${res.status}).`);
    }
    return { messageId: json?.messages?.[0]?.id };
  });
