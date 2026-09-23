/**
 * Aba "Estoque" do gestor: cadastro de insumos, entrada (compra), ajuste por
 * contagem e histórico de movimentações.
 */
import { useMemo, useState } from "react";
import { ArrowDownToLine, History, Pencil, Plus, Scale, Trash2 } from "lucide-react";
import { Badge, Button, Surface } from "@/components/ui";
import { useCatalog } from "@/context/CatalogContext";
import { stockValue } from "@/services/catalog/rules";
import type { InventoryItem } from "@/types/marketplace";
import { brl, ErrorNote, Modal, num, parseNum, TextInput } from "./controls";

const UNITS = ["kg", "g", "L", "ml", "un", "cx", "pct"];

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function StockAdmin() {
  const catalog = useCatalog();
  const { inventory, skus, products, movements } = catalog;
  const [editing, setEditing] = useState<InventoryItem | "new" | null>(null);
  const [entry, setEntry] = useState<InventoryItem | null>(null);
  const [adjust, setAdjust] = useState<InventoryItem | null>(null);
  const [error, setError] = useState("");

  const low = inventory.filter((i) => i.current < i.minimum);
  const value = stockValue(catalog.snapshot);

  const remove = (i: InventoryItem) => {
    setError("");
    if (!window.confirm(`Excluir o insumo "${i.name}"? O histórico dele também será apagado.`))
      return;
    try {
      catalog.deleteInventoryItem(i.id);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <>
      <div className="kpi-grid">
        <Kpi label="Valor em estoque" value={brl(value)} note="quantidade × custo médio" />
        <Kpi
          label="Insumos"
          value={String(inventory.length)}
          note={`${skus.length} apresentações ligadas`}
        />
        <Kpi
          label="Abaixo do mínimo"
          value={String(low.length)}
          note={low.map((i) => i.name).join(", ") || "Tudo certo"}
        />
        <Kpi
          label="Movimentações"
          value={String(movements.length)}
          note="entradas, ajustes e vendas"
        />
      </div>

      <Surface className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-label">Insumos</p>
            <b>O que é descontado quando um produto é vendido</b>
          </div>
          <Button onClick={() => setEditing("new")}>
            <Plus size={18} /> Novo insumo
          </Button>
        </div>
        <ErrorNote message={error} />
        {inventory.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted">Nenhum insumo cadastrado ainda.</p>
        ) : (
          <div className="table-scroll mt-4">
            <table>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Estoque</th>
                  <th>Mínimo</th>
                  <th>Custo médio</th>
                  <th>Usado em</th>
                  <th>Situação</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((i) => {
                  const linked = skus.filter((s) => s.inventoryItemId === i.id);
                  return (
                    <tr key={i.id}>
                      <td>
                        <b>{i.name}</b>
                      </td>
                      <td>
                        {num(i.current)} {i.unit}
                      </td>
                      <td>
                        {num(i.minimum)} {i.unit}
                      </td>
                      <td>
                        {brl(i.averageCost)}/{i.unit}
                      </td>
                      <td className="max-w-56 text-xs text-muted">
                        {linked.length
                          ? linked
                              .map(
                                (s) =>
                                  `${products.find((p) => p.id === s.baseProductId)?.name ?? "?"} · ${s.name}`,
                              )
                              .join(", ")
                          : "Nenhum produto"}
                      </td>
                      <td>
                        <Badge tone={i.current < i.minimum ? "warning" : "good"}>
                          {i.current <= 0 ? "Zerado" : i.current < i.minimum ? "Repor" : "Saudável"}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <IconButton label="Entrada de estoque" onClick={() => setEntry(i)}>
                            <ArrowDownToLine size={16} />
                          </IconButton>
                          <IconButton label="Ajustar (contagem)" onClick={() => setAdjust(i)}>
                            <Scale size={16} />
                          </IconButton>
                          <IconButton label="Editar" onClick={() => setEditing(i)}>
                            <Pencil size={16} />
                          </IconButton>
                          <IconButton label="Excluir" onClick={() => remove(i)}>
                            <Trash2 size={16} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

      <MovementHistory />

      {editing && (
        <InventoryForm item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}
      {entry && <EntryForm item={entry} onClose={() => setEntry(null)} />}
      {adjust && <AdjustForm item={adjust} onClose={() => setAdjust(null)} />}
    </>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Surface>
      <p className="section-label">{label}</p>
      <b className="mt-2 block text-2xl">{value}</b>
      <p className="mt-2 truncate text-xs text-muted">{note}</p>
    </Surface>
  );
}

export function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-lg text-muted hover:bg-muted-surface hover:text-foreground"
    >
      {children}
    </button>
  );
}

function MovementHistory() {
  const { movements, inventory } = useCatalog();
  const recent = useMemo(() => movements.slice(0, 15), [movements]);
  return (
    <Surface className="mt-4">
      <div className="flex items-center gap-2">
        <History size={18} className="text-primary" />
        <p className="section-label">Últimas movimentações</p>
      </div>
      {recent.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Ainda não há movimentações. Elas aparecem quando você dá entrada, ajusta ou quando um
          pedido é confirmado.
        </p>
      ) : (
        <div className="mt-3 grid gap-2">
          {recent.map((m) => {
            const item = inventory.find((i) => i.id === m.inventoryItemId);
            return (
              <div
                key={m.id}
                className="flex items-center justify-between border-b border-border pb-2 text-sm"
              >
                <span>
                  <b>{item?.name ?? "Insumo removido"}</b>
                  <small className="block text-muted">
                    {new Date(m.createdAt).toLocaleString("pt-BR")} · {m.type}
                    {m.note ? ` · ${m.note}` : ""}
                    {m.unitCost !== undefined ? ` · ${brl(m.unitCost)}/${item?.unit ?? ""}` : ""}
                  </small>
                </span>
                <b className={m.quantity >= 0 ? "text-success" : "text-warning-foreground"}>
                  {m.quantity >= 0 ? "+" : ""}
                  {num(m.quantity)} {item?.unit}
                </b>
              </div>
            );
          })}
        </div>
      )}
    </Surface>
  );
}

/** Criar ou editar um insumo. Ao criar, já dá para informar o estoque inicial e o custo. */
export function InventoryForm({
  item,
  onClose,
  onCreated,
}: {
  item: InventoryItem | null;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const catalog = useCatalog();
  const [name, setName] = useState(item?.name ?? "");
  const [unit, setUnit] = useState(item?.unit ?? "kg");
  const [minimum, setMinimum] = useState(item ? String(item.minimum).replace(".", ",") : "");
  const [initial, setInitial] = useState("");
  const [cost, setCost] = useState("");
  const [error, setError] = useState("");

  const save = () => {
    setError("");
    try {
      const min = minimum.trim() ? parseNum(minimum) : 0;
      if (item) {
        catalog.updateInventoryItem(item.id, { name, unit, minimum: min });
      } else {
        const id = catalog.createInventoryItem({
          name,
          unit,
          minimum: min,
          initialQuantity: initial.trim() ? parseNum(initial) : 0,
          initialUnitCost: cost.trim() ? parseNum(cost) : 0,
        });
        onCreated?.(id);
      }
      onClose();
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Modal
      title={item ? "Editar insumo" : "Novo insumo"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>{item ? "Salvar" : "Criar insumo"}</Button>
        </>
      }
    >
      <TextInput
        label="Nome do insumo"
        value={name}
        onChange={setName}
        placeholder="Ex.: Café em grãos"
        autoFocus
      />
      <div className="grid gap-1.5 text-sm font-semibold">
        Unidade de controle
        <div className="flex flex-wrap gap-2">
          {UNITS.map((u) => (
            <Button
              key={u}
              type="button"
              variant={unit === u ? "primary" : "secondary"}
              className="min-h-9 px-3"
              onClick={() => setUnit(u)}
            >
              {u}
            </Button>
          ))}
        </div>
        <small className="font-normal text-muted">
          É nessa unidade que o estoque é contado e descontado.
        </small>
      </div>
      <TextInput
        label={`Estoque mínimo (${unit})`}
        value={minimum}
        onChange={setMinimum}
        inputMode="decimal"
        placeholder="0"
        hint="Abaixo disso o insumo aparece como “Repor”."
      />
      {!item && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label={`Estoque inicial (${unit})`}
            value={initial}
            onChange={setInitial}
            inputMode="decimal"
            placeholder="0"
          />
          <TextInput
            label={`Custo por ${unit} (R$)`}
            value={cost}
            onChange={setCost}
            inputMode="decimal"
            placeholder="0,00"
          />
        </div>
      )}
      {item && (
        <p className="text-xs text-muted">
          Para mudar a quantidade use “Entrada” (compra) ou “Ajustar” (contagem), assim tudo fica
          registrado no histórico.
        </p>
      )}
      <ErrorNote message={error} />
    </Modal>
  );
}

function EntryForm({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const catalog = useCatalog();
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState(
    item.averageCost ? String(item.averageCost).replace(".", ",") : "",
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const q = parseNum(quantity);
  const c = parseNum(cost);
  const preview =
    q > 0 && c >= 0
      ? (Math.max(item.current, 0) * item.averageCost + q * c) / (Math.max(item.current, 0) + q)
      : null;

  const save = () => {
    setError("");
    try {
      catalog.addStockEntry(item.id, q, Number.isNaN(c) ? 0 : c, note.trim() || undefined);
      onClose();
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Modal
      title={`Entrada · ${item.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Registrar entrada</Button>
        </>
      }
    >
      <p className="text-sm text-muted">
        Hoje:{" "}
        <b className="text-foreground">
          {num(item.current)} {item.unit}
        </b>{" "}
        a {brl(item.averageCost)}/{item.unit}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label={`Quantidade comprada (${item.unit})`}
          value={quantity}
          onChange={setQuantity}
          inputMode="decimal"
          autoFocus
        />
        <TextInput
          label={`Custo pago por ${item.unit} (R$)`}
          value={cost}
          onChange={setCost}
          inputMode="decimal"
        />
      </div>
      <TextInput
        label="Observação (opcional)"
        value={note}
        onChange={setNote}
        placeholder="Ex.: NF 1234, fornecedor X"
      />
      {preview !== null && (
        <p className="rounded-xl bg-muted-surface p-3 text-sm">
          Vai ficar:{" "}
          <b>
            {num(item.current + q)} {item.unit}
          </b>{" "}
          · novo custo médio <b>{brl(preview)}</b>/{item.unit}
        </p>
      )}
      <ErrorNote message={error} />
    </Modal>
  );
}

function AdjustForm({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const catalog = useCatalog();
  const [counted, setCounted] = useState(String(item.current).replace(".", ","));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const value = parseNum(counted);
  const diff = Number.isNaN(value) ? 0 : value - item.current;

  const save = () => {
    setError("");
    try {
      catalog.adjustStock(item.id, value, note.trim() || undefined);
      onClose();
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Modal
      title={`Ajustar · ${item.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Salvar contagem</Button>
        </>
      }
    >
      <p className="text-sm text-muted">
        Informe quanto existe de verdade (contagem física). O sistema registra a diferença como
        ajuste.
      </p>
      <TextInput
        label={`Quantidade contada (${item.unit})`}
        value={counted}
        onChange={setCounted}
        inputMode="decimal"
        autoFocus
      />
      <TextInput
        label="Motivo (opcional)"
        value={note}
        onChange={setNote}
        placeholder="Ex.: perda, quebra, contagem mensal"
      />
      {diff !== 0 && (
        <p className="rounded-xl bg-muted-surface p-3 text-sm">
          Diferença:{" "}
          <b>
            {diff > 0 ? "+" : ""}
            {num(diff)} {item.unit}
          </b>
        </p>
      )}
      <ErrorNote message={error} />
    </Modal>
  );
}
