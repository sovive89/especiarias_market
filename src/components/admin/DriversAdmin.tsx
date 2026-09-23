/**
 * Cadastro de entregadores: quem pode abrir o app do entregador e com qual PIN.
 *
 * O gestor cria aqui um "usuário" simples (nome + telefone + PIN de 4 dígitos)
 * para cada entregador. No celular, em /entregador, ele entra com telefone + PIN.
 * É uma trava de organização (sem servidor) — o PIN fica salvo no navegador do
 * gestor, então não é segurança "de banco"; serve para separar quem é quem.
 */
import { useState } from "react";
import { Bike, Eye, EyeOff, Pencil, Plus, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui";
import { useCatalog } from "@/context/CatalogContext";
import * as rules from "@/services/catalog/rules";
import type { StoreDriver } from "@/types/marketplace";
import { ErrorNote, Modal, TextInput } from "./controls";
import { IconButton } from "./StockAdmin";

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function DriversAdmin() {
  const { drivers } = useCatalog();
  const [editing, setEditing] = useState<StoreDriver | "new" | null>(null);
  const [error, setError] = useState("");
  const catalog = useCatalog();

  const remove = (d: StoreDriver) => {
    setError("");
    if (!window.confirm(`Remover "${d.name}" do cadastro de entregadores?`)) return;
    try {
      catalog.deleteDriver(d.id);
    } catch (e) {
      setError(errorText(e));
    }
  };

  const toggle = (d: StoreDriver) => {
    setError("");
    try {
      catalog.setDriverActive(d.id, !d.active);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 max-md:pb-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Entregadores</h2>
          <p className="text-sm text-muted">
            {drivers.length === 0
              ? "Nenhum entregador cadastrado ainda."
              : `${drivers.length} cadastrado${drivers.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus size={18} /> Novo entregador
        </Button>
      </div>

      <ErrorNote message={error} />

      {drivers.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center">
          <Truck size={32} className="text-muted" />
          <div>
            <b>Cadastre quem vai entregar</b>
            <p className="mt-1 text-sm text-muted">
              Cada entregador entra no próprio celular em <b>/entregador</b> com telefone e PIN.
            </p>
          </div>
          <Button onClick={() => setEditing("new")}>
            <Plus size={18} /> Novo entregador
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {drivers.map((d) => (
            <DriverCard
              key={d.id}
              driver={d}
              onEdit={() => setEditing(d)}
              onToggle={() => toggle(d)}
              onDelete={() => remove(d)}
            />
          ))}
        </div>
      )}

      {editing && (
        <DriverForm
          driver={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onError={setError}
        />
      )}
    </div>
  );
}

function DriverCard({
  driver: d,
  onEdit,
  onToggle,
  onDelete,
}: {
  driver: StoreDriver;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [showPin, setShowPin] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Bike size={20} />
          </span>
          <div className="min-w-0">
            <b className="block truncate">{d.name}</b>
            <small className="text-muted">{d.phone}</small>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <IconButton label={`Editar ${d.name}`} onClick={onEdit}>
            <Pencil size={16} />
          </IconButton>
          <IconButton label={`Remover ${d.name}`} onClick={onDelete}>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-surface-strong px-3 py-2">
        <span className="font-mono text-sm">PIN: {showPin ? d.pin : "••••"}</span>
        <button
          onClick={() => setShowPin((v) => !v)}
          className="text-muted hover:text-foreground"
          aria-label={showPin ? "Ocultar PIN" : "Mostrar PIN"}
        >
          {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <label className="mt-3 flex items-center justify-between gap-2 text-sm font-semibold">
        {d.active ? "Ativo — pode logar no app" : "Pausado — acesso bloqueado"}
        <span className="switch">
          <input
            type="checkbox"
            checked={d.active}
            onChange={onToggle}
            aria-label={d.active ? `Pausar ${d.name}` : `Ativar ${d.name}`}
          />
          <span />
        </span>
      </label>
    </div>
  );
}

function DriverForm({
  driver,
  onClose,
  onError,
}: {
  driver: StoreDriver | null;
  onClose: () => void;
  onError: (msg: string) => void;
}) {
  const catalog = useCatalog();
  const [name, setName] = useState(driver?.name ?? "");
  const [phone, setPhone] = useState(driver?.phone ?? "");
  const [pin, setPin] = useState(driver?.pin ?? "");
  const [localError, setLocalError] = useState("");

  const save = () => {
    setLocalError("");
    try {
      const input: rules.DriverInput = { name, phone, pin };
      if (driver) catalog.updateDriver(driver.id, input);
      else catalog.createDriver(input);
      onClose();
    } catch (e) {
      const msg = errorText(e);
      setLocalError(msg);
      onError(msg);
    }
  };

  return (
    <Modal
      title={driver ? "Editar entregador" : "Novo entregador"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Salvar</Button>
        </>
      }
    >
      <ErrorNote message={localError} />
      <TextInput label="Nome" value={name} onChange={setName} placeholder="Ex.: Carlos Souza" />
      <TextInput
        label="Telefone"
        value={phone}
        onChange={setPhone}
        placeholder="(61) 99999-9999"
        hint="É o que ele digita para logar no app do entregador."
        inputMode="text"
      />
      <TextInput
        label="PIN (4 números)"
        value={pin}
        onChange={(v) => setPin(v.replace(/\D/g, "").slice(0, 4))}
        placeholder="0000"
        hint="Só uma trava de organização — não é senha de banco."
        inputMode="decimal"
      />
    </Modal>
  );
}
