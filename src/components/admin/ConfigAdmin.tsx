/**
 * Configuração da loja: nome, mensagem, tempo de entrega, logo e o WhatsApp
 * que recebe os pedidos. Antes esses valores vinham fixos do código (ou de
 * uma variável de ambiente, no caso do WhatsApp) — agora o gestor edita aqui
 * e o app inteiro (loja, painel, entregador) atualiza sem precisar redeployar.
 */
import { useRef, useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import { Button, Surface } from "@/components/ui";
import { useCatalog } from "@/context/CatalogContext";
import { fileToCompressedDataUrl } from "@/lib/image";
import type { StoreBranding } from "@/types/marketplace";
import { ApiIntegrationsPanel } from "./ApiIntegrationsPanel";
import { ErrorNote, TextInput } from "./controls";

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function ConfigAdmin() {
  const catalog = useCatalog();
  const b = catalog.branding;
  const [form, setForm] = useState<StoreBranding>(b);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const pickLogo = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const logo = await fileToCompressedDataUrl(file, 300);
      setForm((f) => ({ ...f, logo }));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    setError("");
    setSaved(false);
    try {
      catalog.updateBranding(form);
      setSaved(true);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <div className="grid max-w-2xl gap-4 max-md:pb-16">
      <div>
        <h2 className="text-lg font-bold">Configuração da loja</h2>
        <p className="text-sm text-muted">
          Nome, mensagem, logo e o WhatsApp que recebe os pedidos — aparece na loja, no PWA e nos
          pedidos enviados.
        </p>
      </div>

      <ErrorNote message={error} />
      {saved && !error && (
        <p className="rounded-xl bg-success-soft px-3 py-2 text-sm font-semibold text-success">
          Salvo. As telas já estão usando os novos dados.
        </p>
      )}

      <Surface className="grid gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-surface-strong"
          >
            {form.logo ? (
              <img src={form.logo} alt="Logo da loja" className="size-full object-cover" />
            ) : (
              <ImagePlus size={22} className="text-muted" />
            )}
          </button>
          <div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Enviando…" : "Trocar logo"}
            </Button>
            <p className="mt-1 text-xs text-muted">
              Sem logo, usa a primeira letra do nome da loja.
            </p>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickLogo(e.target.files?.[0])}
          />
        </div>

        <TextInput
          label="Nome da loja"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
        />
        <TextInput
          label="Mensagem na página inicial"
          value={form.message}
          onChange={(v) => setForm((f) => ({ ...f, message: v }))}
        />
        <TextInput
          label="Tempo de entrega mostrado ao cliente"
          value={form.eta}
          onChange={(v) => setForm((f) => ({ ...f, eta: v }))}
          placeholder="35–45 min"
        />
        <TextInput
          label="WhatsApp que recebe os pedidos"
          value={form.whatsappNumber}
          onChange={(v) => setForm((f) => ({ ...f, whatsappNumber: v.replace(/\D/g, "") }))}
          placeholder="5511999999999"
          hint='Só números, com DDI e DDD (Brasil = 55). Ex.: "5511999999999".'
          inputMode="decimal"
        />

        <Button onClick={save} className="justify-self-start">
          <Save size={18} /> Salvar
        </Button>
      </Surface>

      <ApiIntegrationsPanel />
    </div>
  );
}
