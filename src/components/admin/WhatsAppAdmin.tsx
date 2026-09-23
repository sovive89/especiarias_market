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
import { CheckCircle2, Loader2, Plus, Save, Send, Trash2, Upload, XCircle } from "lucide-react";
import { Button, Surface } from "@/components/ui";
import { useCatalog } from "@/context/CatalogContext";
import { getWhatsAppStatus, sendWhatsAppTemplate } from "@/lib/whatsappBot";
import { fileToCompressedDataUrl } from "@/lib/image";
import type {
  PlacedOrderStatus,
  WhatsAppBotConfig,
  WhatsAppMenuItem,
  WhatsAppOrderingConfig,
} from "@/types/marketplace";
import { ErrorNote, Select, TextArea, TextInput } from "./controls";

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

const STEPS: { status: PlacedOrderStatus; label: string; hint: string }[] = [
  {
    status: "novo",
    label: "Pedido recebido",
    hint: 'Ex.: "Recebemos seu pedido!" — dispara assim que o cliente confirma a compra.',
  },
  {
    status: "preparo",
    label: "Pedido aceito (em preparo)",
    hint: 'Ex.: "Seu pedido está sendo preparado."',
  },
  { status: "pronto", label: "Pedido pronto", hint: "Opcional — muitas lojas pulam esta etapa." },
  { status: "entrega", label: "Saiu para entrega", hint: 'Ex.: "Seu pedido saiu para entrega!"' },
  {
    status: "entregue",
    label: "Pedido entregue",
    hint: 'Ex.: "Pedido entregue, bom apetite!" — dispara ao confirmar a entrega.',
  },
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

      <OrderingBotAdmin />
    </div>
  );
}

/**
 * Configuração do bot CONVERSACIONAL: o cliente compra 100% dentro do WhatsApp, sem
 * abrir o site. Diferente da seção acima (que só avisa o cliente sobre o status do
 * pedido feito no site): aqui é o cliente que inicia a conversa, escolhe os itens
 * pelo número do cardápio, manda a localização pelo botão nativo do WhatsApp e
 * escolhe a forma de pagamento — tudo dentro da própria conversa.
 */
function OrderingBotAdmin() {
  const catalog = useCatalog();
  const saved = catalog.whatsappOrdering;
  const [config, setConfig] = useState<WhatsAppOrderingConfig>(saved);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!catalog.loaded) return;
    setConfig(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.loaded]);

  const activeSkus = catalog.skus
    .filter((s) => s.active)
    .map((s) => {
      const product = catalog.products.find((p) => p.id === s.baseProductId);
      return { id: s.id, label: product ? `${product.name} — ${s.name}` : s.name };
    });

  const onUploadMenuImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 1200, 0.85);
      setConfig((c) => ({ ...c, menuImageUrl: dataUrl }));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setUploading(false);
    }
  };

  const addMenuItem = () => {
    setConfig((c) => ({
      ...c,
      items: [...c.items, { number: String(c.items.length + 1), skuId: activeSkus[0]?.id ?? "" }],
    }));
  };
  const updateMenuItem = (index: number, patch: Partial<WhatsAppMenuItem>) => {
    setConfig((c) => ({
      ...c,
      items: c.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };
  const removeMenuItem = (index: number) => {
    setConfig((c) => ({ ...c, items: c.items.filter((_, i) => i !== index) }));
  };

  const save = () => {
    setError("");
    setOk(false);
    try {
      catalog.updateWhatsAppOrderingConfig(config);
      setOk(true);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-lg font-bold">Pedido pelo WhatsApp (sem abrir o site)</h2>
        <p className="text-sm text-muted">
          Com isso ligado, o cliente compra o pedido inteiro dentro da própria conversa do WhatsApp:
          vê o cardápio numerado, responde com os números, manda a localização pelo botão de GPS e
          escolhe a forma de pagamento. O pedido cai direto em /admin/pedidos.
        </p>
      </div>

      <ErrorNote message={error} />
      {ok && !error && (
        <p className="rounded-xl bg-success-soft px-3 py-2 text-sm font-semibold text-success">
          Salvo. Vale para as próximas conversas que chegarem no WhatsApp.
        </p>
      )}

      <Surface className="flex items-center justify-between gap-2 text-sm font-semibold">
        <span>
          Pedido conversacional ligado
          <p className="mt-0.5 text-xs font-normal text-muted">
            Precisa do webhook configurado no app da Meta — veja docs/WHATSAPP.md.
          </p>
        </span>
        <span className="switch shrink-0">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig((c) => ({ ...c, enabled: e.target.checked }))}
            aria-label={
              config.enabled ? "Desligar pedido pelo WhatsApp" : "Ligar pedido pelo WhatsApp"
            }
          />
          <span />
        </span>
      </Surface>

      <Surface className="grid gap-3">
        <b className="text-sm">Cardápio numerado (imagem)</b>
        <p className="text-xs text-muted">
          Sobe uma imagem com os itens numerados (a mesma que o bot vai mandar pro cliente). O
          gestor cria essa imagem — o app não gera nada automaticamente.
        </p>
        {config.menuImageUrl && (
          <img
            src={config.menuImageUrl}
            alt="Cardápio numerado"
            className="max-h-64 w-fit rounded-xl border border-border object-contain"
          />
        )}
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface-strong px-3 py-2 text-sm font-semibold">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {config.menuImageUrl ? "Trocar imagem" : "Subir imagem"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onUploadMenuImage(e.target.files?.[0])}
          />
        </label>
      </Surface>

      <Surface className="grid gap-3">
        <div>
          <b className="text-sm">Número → item do catálogo</b>
          <p className="mt-1 text-xs text-muted">
            É assim que o bot entende o que o cliente quis dizer quando ele responde só um número: o
            número precisa ser exatamente o mesmo que aparece na imagem do cardápio.
          </p>
        </div>
        {config.items.map((item, i) => (
          <div key={i} className="grid grid-cols-[80px_1fr_auto] items-end gap-2">
            <TextInput
              label="Número"
              value={item.number}
              onChange={(v) => updateMenuItem(i, { number: v })}
              placeholder="1"
            />
            <Select
              label="Item do catálogo"
              value={item.skuId}
              onChange={(e) => updateMenuItem(i, { skuId: e.target.value })}
            >
              <option value="">Selecione…</option>
              {activeSkus.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variant="secondary"
              className="h-11"
              onClick={() => removeMenuItem(i)}
              aria-label="Remover item"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          className="justify-self-start"
          onClick={addMenuItem}
        >
          <Plus size={16} /> Adicionar item
        </Button>
      </Surface>

      <Surface className="grid gap-4">
        <div>
          <b className="text-sm">Mensagens do bot de pedidos</b>
          <p className="mt-1 text-xs text-muted">
            Texto livre, editável — como é o cliente que inicia a conversa, a Meta não exige
            template aprovado aqui (diferente das notificações de status acima). Use{" "}
            <code>{"{{item}}"}</code>, <code>{"{{codigo}}"}</code> e <code>{"{{total}}"}</code> onde
            fizer sentido.
          </p>
        </div>
        <TextArea
          label="Boas-vindas (primeira mensagem, junto com o cardápio)"
          value={config.messages.boasVindas}
          onChange={(e) =>
            setConfig((c) => ({ ...c, messages: { ...c.messages, boasVindas: e.target.value } }))
          }
        />
        <TextArea
          label="Item adicionado ao pedido"
          value={config.messages.itemAdicionado}
          onChange={(e) =>
            setConfig((c) => ({
              ...c,
              messages: { ...c.messages, itemAdicionado: e.target.value },
            }))
          }
        />
        <TextArea
          label="Número não reconhecido (respondeu algo fora do cardápio)"
          value={config.messages.itemNaoEncontrado}
          onChange={(e) =>
            setConfig((c) => ({
              ...c,
              messages: { ...c.messages, itemNaoEncontrado: e.target.value },
            }))
          }
        />
        <TextArea
          label="Item indisponível (número existe, mas saiu do catálogo)"
          value={config.messages.itemIndisponivel}
          onChange={(e) =>
            setConfig((c) => ({
              ...c,
              messages: { ...c.messages, itemIndisponivel: e.target.value },
            }))
          }
        />
        <TextArea
          label="Pedindo a localização"
          value={config.messages.pedirLocalizacao}
          onChange={(e) =>
            setConfig((c) => ({
              ...c,
              messages: { ...c.messages, pedirLocalizacao: e.target.value },
            }))
          }
        />
        <TextArea
          label="Localização não veio pelo botão nativo (mandou texto, por exemplo)"
          value={config.messages.localizacaoInvalida}
          onChange={(e) =>
            setConfig((c) => ({
              ...c,
              messages: { ...c.messages, localizacaoInvalida: e.target.value },
            }))
          }
        />
        <TextArea
          label="Pedindo a forma de pagamento"
          value={config.messages.pedirPagamento}
          onChange={(e) =>
            setConfig((c) => ({
              ...c,
              messages: { ...c.messages, pedirPagamento: e.target.value },
            }))
          }
        />
        <TextArea
          label="Pagamento não escolhido pelos botões"
          value={config.messages.pagamentoInvalido}
          onChange={(e) =>
            setConfig((c) => ({
              ...c,
              messages: { ...c.messages, pagamentoInvalido: e.target.value },
            }))
          }
        />
        <TextArea
          label="Confirmação final"
          value={config.messages.confirmacaoFinal}
          onChange={(e) =>
            setConfig((c) => ({
              ...c,
              messages: { ...c.messages, confirmacaoFinal: e.target.value },
            }))
          }
        />
        <Button onClick={save} className="justify-self-start">
          <Save size={18} /> Salvar
        </Button>
      </Surface>
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
