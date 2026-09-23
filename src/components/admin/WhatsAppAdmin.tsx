/**
 * Configuração do bot de notificações do WhatsApp Business: qual template (aprovado na Meta)
 * mandar em cada etapa do pedido, e um botão para testar o envio.
 *
 * O token e o phone number id NÃO se configuram aqui — moram só em variáveis de ambiente
 * do servidor (Vercel). Esta tela só lê se estão configurados (getWhatsAppStatus) e guarda o
 * "de-para" de templates no catálogo local, como o resto do app. Passo a passo completo
 * (criar conta Meta, app, número, templates) em docs/WHATSAPP.md.
 */
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Save, Send, XCircle } from "lucide-react";
import { Button, Surface } from "@/components/ui";
import { useCatalog } from "@/context/CatalogContext";
import { getWhatsAppStatus, sendWhatsAppTemplate } from "@/lib/whatsappBot";
import type { PlacedOrderStatus, WhatsAppBotConfig } from "@/types/marketplace";
import { ErrorNote, TextInput } from "./controls";

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

const STEPS: { status: PlacedOrderStatus; label: string; hint: string }[] = [
  { status: "preparo", label: "Pedido aceito (em preparo)", hint: 'Ex.: "Recebemos seu pedido!"' },
  { status: "pronto", label: "Pedido pronto", hint: "Opcional — muitas lojas pulam esta etapa." },
  { status: "entrega", label: "Saiu para entrega", hint: 'Ex.: "Seu pedido saiu para entrega!"' },
  { status: "cancelado", label: "Pedido cancelado", hint: 'Ex.: "Seu pedido foi cancelado."' },
];

export function WhatsAppAdmin() {
  const catalog = useCatalog();
  const saved = catalog.whatsappBot;
  const [enabled, setEnabled] = useState(saved.enabled);
  const [templates, setTemplates] = useState(saved.templates);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  // O catálogo carrega do localStorage de forma assíncrona (useEffect no CatalogContext),
  // então no primeiro render `saved` ainda é o padrão vazio. Sem isto, o formulário ficaria
  // em branco mesmo com dados salvos, até o usuário editar algo. Refaz o estado local quando
  // o carregamento termina (loaded muda de false para true).
  useEffect(() => {
    if (!catalog.loaded) return;
    setEnabled(saved.enabled);
    setTemplates(saved.templates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.loaded]);

  const [status, setStatus] = useState<"loading" | "configured" | "not-configured">("loading");
  useEffect(() => {
    getWhatsAppStatus()
      .then((r) => setStatus(r.configured ? "configured" : "not-configured"))
      .catch(() => setStatus("not-configured"));
  }, []);

  const setField = (
    status_: PlacedOrderStatus,
    patch: Partial<{ name: string; language: string }>,
  ) => {
    setTemplates((t) => ({
      ...t,
      [status_]: { name: "", language: "pt_BR", ...t[status_], ...patch },
    }));
  };

  const save = () => {
    setError("");
    setOk(false);
    try {
      catalog.updateWhatsAppBotConfig({ enabled, templates });
      setOk(true);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <div className="grid max-w-2xl gap-4 max-md:pb-16">
      <div>
        <h2 className="text-lg font-bold">WhatsApp Business — bot de notificações</h2>
        <p className="text-sm text-muted">
          Manda mensagens automáticas pro cliente (pelo número oficial da loja) quando o pedido muda
          de etapa. Não substitui o WhatsApp do checkout — é um aviso a mais.
        </p>
      </div>

      <Surface className="flex items-center gap-3">
        {status === "loading" ? (
          <Loader2 size={18} className="animate-spin text-muted" />
        ) : status === "configured" ? (
          <CheckCircle2 size={18} className="text-success" />
        ) : (
          <XCircle size={18} className="text-warning-foreground" />
        )}
        <div className="flex-1">
          <b className="block text-sm">
            {status === "loading"
              ? "Verificando conexão…"
              : status === "configured"
                ? "Conectado à WhatsApp Cloud API"
                : "Ainda não configurado no servidor"}
          </b>
          <p className="text-xs text-muted">
            {status === "not-configured" &&
              "Faltam as variáveis de ambiente no Vercel (token e phone number id). Veja docs/WHATSAPP.md."}
            {status === "configured" && "Token e número verificados no servidor."}
          </p>
        </div>
      </Surface>

      <ErrorNote message={error} />
      {ok && !error && (
        <p className="rounded-xl bg-success-soft px-3 py-2 text-sm font-semibold text-success">
          Salvo. Os templates já valem para os próximos pedidos.
        </p>
      )}

      <Surface className="grid gap-4">
        <label className="flex items-center justify-between gap-2 text-sm font-semibold">
          <span>
            Bot ligado
            <p className="mt-0.5 text-xs font-normal text-muted">
              Com o bot desligado, nada é mandado mesmo com templates preenchidos.
            </p>
          </span>
          <span className="switch shrink-0">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              aria-label={enabled ? "Desligar bot" : "Ligar bot"}
            />
            <span />
          </span>
        </label>
      </Surface>

      <Surface className="grid gap-5">
        <div>
          <b className="text-sm">Templates por etapa</b>
          <p className="mt-1 text-xs text-muted">
            O nome e o idioma são exatamente os cadastrados no Gerenciador de Negócios da Meta. O
            template precisa ter 2 variáveis no corpo: nome do cliente e código do pedido, nessa
            ordem. Deixe em branco pra não mandar nada nessa etapa.
          </p>
        </div>
        {STEPS.map(({ status: s, label, hint }) => (
          <div key={s} className="grid gap-2 border-t border-border pt-4 first:border-0 first:pt-0">
            <b className="text-sm">{label}</b>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <TextInput
                id={`wa-template-name-${s}`}
                label="Nome do template"
                value={templates[s]?.name ?? ""}
                onChange={(v) => setField(s, { name: v })}
                placeholder="ex.: pedido_confirmado"
                hint={hint}
              />
              <TextInput
                id={`wa-template-lang-${s}`}
                label="Idioma"
                value={templates[s]?.language ?? "pt_BR"}
                onChange={(v) => setField(s, { language: v })}
                placeholder="pt_BR"
              />
            </div>
          </div>
        ))}
        <Button onClick={save} className="justify-self-start">
          <Save size={18} /> Salvar
        </Button>
      </Surface>

      <TestSend disabled={status !== "configured"} />
    </div>
  );
}

function TestSend({ disabled }: { disabled: boolean }) {
  const [phone, setPhone] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [language, setLanguage] = useState("pt_BR");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      await sendWhatsAppTemplate({
        data: {
          to: phone,
          templateName: templateName.trim(),
          languageCode: language.trim() || "pt_BR",
          bodyParams: ["Teste", "MP-0000"],
        },
      });
      setResult({ ok: true, message: "Mensagem de teste enviada — confira o WhatsApp do número." });
    } catch (e) {
      setResult({ ok: false, message: errorText(e) });
    } finally {
      setSending(false);
    }
  };

  return (
    <Surface className="grid gap-3">
      <div>
        <b className="text-sm">Enviar mensagem de teste</b>
        <p className="mt-1 text-xs text-muted">
          Manda o template indicado com "Teste" e "MP-0000" no lugar das variáveis, pra você
          conferir se a conexão está funcionando.
        </p>
      </div>
      {disabled && (
        <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs font-semibold text-warning-foreground">
          Configure as variáveis de ambiente no servidor antes de testar.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <TextInput
          label="Telefone (com DDD)"
          value={phone}
          onChange={setPhone}
          placeholder="61999999999"
          inputMode="decimal"
        />
        <TextInput
          label="Template"
          value={templateName}
          onChange={setTemplateName}
          placeholder="pedido_confirmado"
        />
      </div>
      <TextInput label="Idioma" value={language} onChange={setLanguage} placeholder="pt_BR" />
      {result && (
        <p
          className={
            result.ok
              ? "rounded-xl bg-success-soft px-3 py-2 text-sm font-semibold text-success"
              : "rounded-xl bg-warning-soft px-3 py-2 text-sm font-semibold text-warning-foreground"
          }
        >
          {result.message}
        </p>
      )}
      <Button
        variant="secondary"
        className="justify-self-start"
        disabled={disabled || sending || !phone || !templateName}
        onClick={send}
      >
        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        Enviar teste
      </Button>
    </Surface>
  );
}
