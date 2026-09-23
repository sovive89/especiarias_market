/**
 * Cardápio do gestor (referência: portal de parceiros dos apps de delivery).
 *
 * Cada item é um card com foto, nome, descrição e valor por unidade de medida,
 * e aponta para o insumo que o estoque desconta quando o pagamento é confirmado.
 * Itens ficam agrupados por categoria; dá para pausar sem apagar.
 * Por baixo, cada item é 1 produto + 1 SKU (o formato que a loja e o estoque já usam).
 */
import { useMemo, useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui";
import { useCatalog } from "@/context/CatalogContext";
import { fileToCompressedDataUrl, PLACEHOLDER_IMAGE } from "@/lib/image";
import * as rules from "@/services/catalog/rules";
import type { BaseProduct, CatalogSnapshot, ProductSKU } from "@/types/marketplace";
import { brl, ErrorNote, Modal, num, parseNum, Select, TextArea, TextInput } from "./controls";
import { InventoryForm } from "./StockAdmin";
import { cn } from "@/lib/utils";

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));
const toText = (n: number) => String(n).replace(".", ",");

type Item = { product: BaseProduct; sku: ProductSKU | undefined };

export function MenuAdmin() {
  const catalog = useCatalog();
  const { products, skus } = catalog;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const [error, setError] = useState("");

  const items: Item[] = useMemo(
    () => products.map((p) => ({ product: p, sku: skus.find((s) => s.baseProductId === p.id) })),
    [products, skus],
  );
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products],
  );
  const visible = items.filter(
    ({ product: p }) =>
      (category === "Todos" || p.category === category) &&
      `${p.name} ${p.description}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const groups = categories
    .map((c) => ({ name: c, items: visible.filter((i) => i.product.category === c) }))
    .filter((g) => g.items.length);
  const paused = items.filter((i) => i.sku && !i.sku.active).length;

  const remove = (item: Item) => {
    setError("");
    if (
      !window.confirm(`Excluir "${item.product.name}" do cardápio? O insumo continua no estoque.`)
    )
      return;
    try {
      catalog.deleteProduct(item.product.id);
    } catch (e) {
      setError(errorText(e));
    }
  };

  const toggle = (sku: ProductSKU) => {
    setError("");
    try {
      catalog.setSkuActive(sku.id, !sku.active);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 max-md:pb-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            {items.length} {items.length === 1 ? "item" : "itens"}
            {paused > 0 && ` · ${paused} pausado${paused > 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={() => setEditing("new")} className="hidden md:inline-flex">
          <Plus size={18} /> Novo item
        </Button>
      </div>

      {items.length > 0 && (
        <div className="grid gap-3">
          <div className="search">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar no cardápio"
            />
          </div>
          <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {["Todos", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn("chip", category === c && "active")}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <ErrorNote message={error} />
      {catalog.saveError && <ErrorNote message={catalog.saveError} />}

      {items.length === 0 ? (
        <EmptyMenu onCreate={() => setEditing("new")} />
      ) : groups.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Nenhum item encontrado.</p>
      ) : (
        groups.map((g) => (
          <section key={g.name} className="grid gap-3">
            <h2 className="flex items-baseline gap-2 text-lg font-extrabold">
              {g.name}
              <span className="text-xs font-semibold text-muted">{g.items.length}</span>
            </h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {g.items.map((item) => (
                <MenuCard
                  key={item.product.id}
                  item={item}
                  onEdit={() => setEditing(item)}
                  onDelete={() => remove(item)}
                  onToggle={item.sku ? () => toggle(item.sku as ProductSKU) : undefined}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {/* Botão flutuante no celular, onde o dedo alcança */}
      <button
        onClick={() => setEditing("new")}
        className="fixed right-4 bottom-[calc(5.2rem+env(safe-area-inset-bottom))] z-30 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-extrabold text-primary-foreground shadow-soft md:hidden"
      >
        <Plus size={19} /> Novo item
      </button>

      {editing && (
        <ItemForm item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function EmptyMenu({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
        <UtensilsCrossed size={26} />
      </span>
      <div>
        <b className="text-lg">Seu cardápio está vazio</b>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Crie o primeiro item: foto, nome, descrição, preço por unidade e o insumo que sai do
          estoque a cada venda.
        </p>
      </div>
      <Button onClick={onCreate}>
        <Plus size={18} /> Criar primeiro item
      </Button>
    </div>
  );
}

function MenuCard({
  item,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: Item;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (() => void) | undefined;
}) {
  const catalog = useCatalog();
  const { product: p, sku } = item;
  const insumo = sku && catalog.inventory.find((i) => i.id === sku.inventoryItemId);
  const stock = sku ? rules.availableUnits(catalog.snapshot, sku) : 0;
  const { cost, margin } = sku
    ? rules.skuCostAndMargin(catalog.snapshot, sku)
    : { cost: 0, margin: 0 };
  const active = sku?.active ?? false;

  return (
    <article
      className={cn(
        "flex gap-3 rounded-2xl border border-border bg-surface-strong p-3 transition",
        !active && "opacity-60",
      )}
    >
      <button onClick={onEdit} className="shrink-0" aria-label={`Editar ${p.name}`}>
        <img
          src={p.image || PLACEHOLDER_IMAGE}
          alt=""
          className="size-24 rounded-xl object-cover sm:size-28"
        />
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <button onClick={onEdit} className="min-w-0 text-left">
            <b className="line-clamp-1">{p.name}</b>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted">
              {p.description || "Sem descrição"}
            </p>
          </button>
          {onToggle && (
            <label className="switch shrink-0" title={active ? "Pausar item" : "Ativar item"}>
              <input
                type="checkbox"
                checked={active}
                onChange={onToggle}
                aria-label={active ? `Pausar ${p.name}` : `Ativar ${p.name}`}
              />
              <span />
            </label>
          )}
        </div>

        {sku ? (
          <>
            <p className="mt-2 text-base font-extrabold">
              {brl(sku.price)}
              <span className="ml-1 text-xs font-semibold text-muted">/ {sku.unit}</span>
            </p>
            <p className="mt-1 line-clamp-1 text-[11px] text-muted">
              Desconta {num(sku.packSize)} {insumo?.unit} de{" "}
              <b className="font-semibold text-foreground">{insumo?.name ?? "insumo removido"}</b>
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-[11px]">
              <span className={stock === 0 ? "font-bold text-warning-foreground" : "text-muted"}>
                {stock === 0 ? "Sem estoque" : `${stock} disponíveis`}
              </span>
              <span className="text-muted">
                custo {brl(cost)} · margem {Math.round(margin * 100)}%
              </span>
              {!active && <span className="font-bold text-warning-foreground">Pausado</span>}
            </div>
          </>
        ) : (
          <p className="mt-2 text-xs font-bold text-warning-foreground">
            Sem preço/insumo — edite para aparecer na loja
          </p>
        )}

        <div className="mt-2 flex justify-end gap-1">
          <button onClick={onEdit} className="card-action">
            <Pencil size={14} /> Editar
          </button>
          <button onClick={onDelete} className="card-action" aria-label={`Excluir ${p.name}`}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

/** Criar ou editar um item do cardápio (tudo numa tela, com prévia do card na loja). */
function ItemForm({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const catalog = useCatalog();
  const { inventory, products } = catalog;
  const product = item?.product ?? null;
  const existing = item?.sku;
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [image, setImage] = useState(product?.image ?? "");
  const [unit, setUnit] = useState(existing?.unit ?? "unidade");
  const [price, setPrice] = useState(existing ? toText(existing.price) : "");
  const [inventoryItemId, setInventoryItemId] = useState(existing?.inventoryItemId ?? "");
  const [packSize, setPackSize] = useState(existing ? toText(existing.packSize) : "1");
  const [active, setActive] = useState(existing?.active ?? true);
  const [uploading, setUploading] = useState(false);
  const [creatingInsumo, setCreatingInsumo] = useState(false);
  const [error, setError] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products],
  );
  const insumo = inventory.find((i) => i.id === inventoryItemId);
  const priceValue = parseNum(price);
  const packValue = parseNum(packSize);
  const cost = insumo && packValue > 0 ? insumo.averageCost * packValue : null;
  const margin = cost !== null && priceValue > 0 ? (priceValue - cost) / priceValue : null;

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      setImage(await fileToCompressedDataUrl(file));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = () => {
    setError("");
    try {
      if (!inventoryItemId) throw new rules.CatalogError("Escolha o insumo que sai do estoque.");
      const productInput: rules.ProductInput = {
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        image,
      };
      const skuInput: rules.SkuInput = {
        name: unit.trim(),
        unit: unit.trim(),
        price: priceValue,
        inventoryItemId,
        packSize: packValue,
        active,
      };
      catalog.transaction((s: CatalogSnapshot) => {
        let next = s;
        let productId = product?.id;
        if (productId) {
          next = rules.updateProduct(next, productId, productInput);
        } else {
          const created = rules.createProduct(next, productInput);
          next = created.snapshot;
          productId = created.product.id;
        }
        // 1 item = 1 preço: apaga variações antigas que sobraram de versões anteriores.
        for (const extra of next.skus.filter(
          (k) => k.baseProductId === productId && k.id !== existing?.id,
        ))
          next = rules.deleteSku(next, extra.id);
        return existing
          ? rules.updateSku(next, existing.id, skuInput)
          : rules.createSku(next, productId, skuInput);
      });
      onClose();
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <>
      <Modal
        wide
        title={product ? "Editar item" : "Novo item do cardápio"}
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={uploading}>
              {product ? "Salvar alterações" : "Criar item"}
            </Button>
          </>
        }
      >
        <div className="grid gap-5 md:grid-cols-[1fr_15rem]">
          <div className="grid content-start gap-4">
            <FormSection title="1. Sobre o item">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-muted-surface text-muted"
                >
                  {image ? (
                    <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
                  ) : (
                    <span className="grid place-items-center gap-1 text-[11px] font-semibold">
                      <ImagePlus size={22} />
                      {uploading ? "Enviando…" : "Foto"}
                    </span>
                  )}
                </button>
                <div className="grid min-w-0 flex-1 content-start gap-2">
                  <TextInput
                    label="Nome"
                    value={name}
                    onChange={setName}
                    placeholder="Ex.: Café coado"
                    autoFocus
                  />
                  <div className="flex gap-3 text-xs font-semibold">
                    <button
                      type="button"
                      className="text-primary"
                      onClick={() => fileRef.current?.click()}
                    >
                      {image ? "Trocar foto" : "Enviar foto"}
                    </button>
                    {image && (
                      <button type="button" className="text-muted" onClick={() => setImage("")}>
                        Remover
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void onPickFile(e.target.files?.[0])}
                />
              </div>
              <TextArea
                label="Descrição"
                value={description}
                maxLength={300}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ingredientes, tamanho, para quantas pessoas…"
              />
              <label className="grid gap-1.5 text-sm font-semibold">
                Categoria
                <input
                  list="menu-categories"
                  className="h-11 w-full rounded-xl border border-border bg-surface-strong px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex.: Bebidas, Lanches, Sobremesas"
                />
                <datalist id="menu-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
            </FormSection>

            <FormSection title="2. Preço">
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="Unidade de medida"
                  value={unit}
                  onChange={setUnit}
                  placeholder="unidade, 300 ml, kg"
                />
                <TextInput
                  label={`Valor por ${unit.trim() || "unidade"} (R$)`}
                  value={price}
                  onChange={setPrice}
                  inputMode="decimal"
                  placeholder="0,00"
                />
              </div>
            </FormSection>

            <FormSection title="3. Estoque">
              {inventory.length === 0 && (
                <ErrorNote message="Nenhum insumo cadastrado. Crie um em “+ Criar novo insumo”." />
              )}
              <Select
                label="Insumo descontado na venda"
                value={inventoryItemId}
                onChange={(e) => {
                  if (e.target.value === "__new") setCreatingInsumo(true);
                  else setInventoryItemId(e.target.value);
                }}
              >
                <option value="">Escolha o insumo…</option>
                {inventory.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} — {num(i.current)} {i.unit} em estoque
                  </option>
                ))}
                <option value="__new">+ Criar novo insumo…</option>
              </Select>
              <TextInput
                label={`Quantidade por venda${insumo ? ` (${insumo.unit})` : ""}`}
                value={packSize}
                onChange={setPackSize}
                inputMode="decimal"
                hint={
                  insumo
                    ? `Cada ${unit.trim() || "unidade"} vendida tira ${packSize || "?"} ${insumo.unit} de ${insumo.name}. Vários itens podem usar o mesmo insumo.`
                    : "Quanto do insumo sai do estoque a cada venda."
                }
              />
              {cost !== null && (
                <p className="rounded-xl bg-muted-surface px-3 py-2 text-xs">
                  Custo do insumo: <b>{brl(cost)}</b>
                  {margin !== null && (
                    <>
                      {" "}
                      · margem <b>{Math.round(margin * 100)}%</b>
                    </>
                  )}
                </p>
              )}
            </FormSection>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold">
              Disponível na loja
              <span className="switch">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                <span />
              </span>
            </label>
            <ErrorNote message={error} />
          </div>

          {/* Prévia: como o cliente vê o card na loja */}
          <div className="hidden content-start gap-2 md:grid">
            <p className="section-label">Prévia na loja</p>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface p-2.5">
              <img
                src={image || PLACEHOLDER_IMAGE}
                alt=""
                className="aspect-square w-full rounded-xl object-cover"
              />
              <p className="mt-2 font-mono text-[10px] text-muted">{category || "Categoria"}</p>
              <b className="line-clamp-2 text-sm leading-tight">{name || "Nome do item"}</b>
              <p className="mt-1 line-clamp-2 text-[11px] text-muted">
                {description || "Descrição do item"}
              </p>
              <p className="mt-2 text-xs text-muted">{unit || "unidade"}</p>
              <b className="mt-1 block">{priceValue > 0 ? brl(priceValue) : "R$ 0,00"}</b>
            </div>
          </div>
        </div>
      </Modal>

      {creatingInsumo && (
        <InventoryForm
          item={null}
          onClose={() => setCreatingInsumo(false)}
          onCreated={(id) => setInventoryItemId(id)}
        />
      )}
    </>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-xs font-extrabold uppercase tracking-wide text-muted">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
