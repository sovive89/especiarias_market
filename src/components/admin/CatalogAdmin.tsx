/**
 * Aba "Catálogo" do gestor: criar, editar e excluir produtos.
 * Cada produto tem foto, descrição e uma ou mais apresentações; cada apresentação
 * tem preço e aponta para o insumo do estoque que será descontado na venda.
 */
import { useMemo, useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Badge, Button, Surface } from "@/components/ui";
import { useCatalog } from "@/context/CatalogContext";
import { fileToCompressedDataUrl, PLACEHOLDER_IMAGE } from "@/lib/image";
import * as rules from "@/services/catalog/rules";
import type { BaseProduct, CatalogSnapshot } from "@/types/marketplace";
import { brl, ErrorNote, Modal, num, parseNum, Select, TextArea, TextInput } from "./controls";
import { IconButton, InventoryForm } from "./StockAdmin";

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function CatalogAdmin() {
  const catalog = useCatalog();
  const { products, skus, inventory } = catalog;
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<BaseProduct | "new" | null>(null);
  const [error, setError] = useState("");

  const list = useMemo(
    () =>
      products.filter((p) =>
        `${p.name} ${p.category}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [products, query],
  );

  const remove = (p: BaseProduct) => {
    setError("");
    if (
      !window.confirm(
        `Excluir "${p.name}" e todas as apresentações dele? O insumo continua no estoque.`,
      )
    )
      return;
    try {
      catalog.deleteProduct(p.id);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Surface>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-label">Catálogo</p>
          <b>
            {products.length} produtos · {skus.length} apresentações
          </b>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="search max-w-56">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produto"
            />
          </div>
          <Button onClick={() => setEditing("new")}>
            <Plus size={18} /> Novo produto
          </Button>
        </div>
      </div>
      <ErrorNote message={error} />
      {catalog.saveError && <ErrorNote message={catalog.saveError} />}

      {list.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">
          {products.length
            ? "Nenhum produto encontrado."
            : "Nenhum produto cadastrado. Clique em “Novo produto”."}
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {list.map((p) => {
            const variants = skus.filter((s) => s.baseProductId === p.id);
            return (
              <div
                key={p.id}
                className="flex gap-3 rounded-xl border border-border bg-surface-strong p-3"
              >
                <img
                  src={p.image || PLACEHOLDER_IMAGE}
                  alt=""
                  className="size-20 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] text-muted">{p.category}</p>
                      <b className="block truncate">{p.name}</b>
                      <p className="line-clamp-1 text-xs text-muted">
                        {p.description || "Sem descrição"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <IconButton label="Editar" onClick={() => setEditing(p)}>
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton label="Excluir" onClick={() => remove(p)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {variants.length === 0 && (
                      <Badge tone="warning">Sem apresentação — não aparece na loja</Badge>
                    )}
                    {variants.map((v) => {
                      const item = inventory.find((i) => i.id === v.inventoryItemId);
                      const { cost, margin } = rules.skuCostAndMargin(catalog.snapshot, v);
                      const stock = rules.availableUnits(catalog.snapshot, v);
                      return (
                        <div
                          key={v.id}
                          className="rounded-lg bg-muted-surface px-2.5 py-1.5 text-xs"
                        >
                          <b>
                            {v.name} · {brl(v.price)}
                          </b>
                          {!v.active && (
                            <span className="ml-1 text-warning-foreground">(inativa)</span>
                          )}
                          <span className="block text-muted">
                            desconta {num(v.packSize)} {item?.unit} de{" "}
                            {item?.name ?? "insumo removido"}
                          </span>
                          <span className="block text-muted">
                            custo {brl(cost)} · margem {Math.round(margin * 100)}% · dá para vender{" "}
                            {stock}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Surface>
  );
}

/** Linha de apresentação no formulário (texto cru dos campos, convertido só ao salvar). */
type VariantDraft = {
  key: string;
  id?: string;
  name: string;
  unit: string;
  price: string;
  inventoryItemId: string;
  packSize: string;
  active: boolean;
};

const toText = (n: number) => String(n).replace(".", ",");

function ProductForm({ product, onClose }: { product: BaseProduct | null; onClose: () => void }) {
  const catalog = useCatalog();
  const { inventory, skus, products } = catalog;
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [image, setImage] = useState(product?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantDraft[]>(() => {
    const existing = product ? skus.filter((s) => s.baseProductId === product.id) : [];
    if (existing.length) {
      return existing.map((s) => ({
        key: s.id,
        id: s.id,
        name: s.name,
        unit: s.unit,
        price: toText(s.price),
        inventoryItemId: s.inventoryItemId,
        packSize: toText(s.packSize),
        active: s.active,
      }));
    }
    return [blankVariant(inventory[0]?.id ?? "")];
  });

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products],
  );

  function blankVariant(inventoryItemId: string): VariantDraft {
    return {
      key: rules.newId("draft"),
      name: "Unidade",
      unit: "un",
      price: "",
      inventoryItemId,
      packSize: "1",
      active: true,
    };
  }

  const patch = (key: string, change: Partial<VariantDraft>) =>
    setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...change } : v)));

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
      if (!variants.length)
        throw new rules.CatalogError("Adicione pelo menos uma apresentação com preço.");
      const input: rules.ProductInput = {
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        image,
      };
      const parsed = variants.map((v) => {
        if (!v.inventoryItemId)
          throw new rules.CatalogError(
            `Escolha o insumo da apresentação "${v.name || "sem nome"}".`,
          );
        const sku: rules.SkuInput = {
          name: v.name.trim(),
          unit: v.unit.trim(),
          price: parseNum(v.price),
          inventoryItemId: v.inventoryItemId,
          packSize: parseNum(v.packSize),
          active: v.active,
        };
        return { draft: v, sku };
      });
      // Tudo numa transação: se uma apresentação estiver errada, nada é salvo.
      catalog.transaction((s: CatalogSnapshot) => {
        let next = s;
        let productId = product?.id;
        if (productId) {
          next = rules.updateProduct(next, productId, input);
        } else {
          const created = rules.createProduct(next, input);
          next = created.snapshot;
          productId = created.product.id;
        }
        const keepIds = new Set(parsed.flatMap((x) => (x.draft.id ? [x.draft.id] : [])));
        for (const old of next.skus.filter(
          (k) => k.baseProductId === productId && !keepIds.has(k.id),
        )) {
          next = rules.deleteSku(next, old.id);
        }
        for (const { draft, sku } of parsed) {
          next = draft.id
            ? rules.updateSku(next, draft.id, sku)
            : rules.createSku(next, productId, sku);
        }
        return next;
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
        title={product ? "Editar produto" : "Novo produto"}
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={uploading}>
              {product ? "Salvar alterações" : "Criar produto"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <div className="grid content-start gap-2">
            <span className="text-sm font-semibold">Foto</span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative grid aspect-square w-32 place-items-center overflow-hidden sm:w-full rounded-xl border border-dashed border-border bg-muted-surface text-muted"
            >
              {image ? (
                <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
              ) : (
                <span className="grid place-items-center gap-1 text-xs">
                  <ImagePlus size={26} />
                  {uploading ? "Processando…" : "Enviar foto"}
                </span>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onPickFile(e.target.files?.[0])}
            />
            {image && (
              <Button variant="ghost" className="min-h-8 text-xs" onClick={() => setImage("")}>
                Remover foto
              </Button>
            )}
          </div>
          <div className="grid content-start gap-4">
            <TextInput
              label="Nome do produto"
              value={name}
              onChange={setName}
              placeholder="Ex.: Café coado"
              autoFocus
            />
            <label className="grid gap-1.5 text-sm font-semibold">
              Categoria
              <input
                list="catalog-categories"
                className="h-11 w-full rounded-xl border border-border bg-surface-strong px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex.: Bebidas"
              />
              <datalist id="catalog-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <TextArea
              label="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que o cliente precisa saber sobre o produto"
            />
          </div>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <div>
              <b className="text-sm">Apresentações, preço e insumo</b>
              <p className="text-xs text-muted">
                Cada venda desconta do insumo a quantidade informada. Ex.: “Copo 300 ml” desconta
                0,018 kg de café.
              </p>
            </div>
            <Button
              variant="secondary"
              className="min-h-9 shrink-0"
              onClick={() => setVariants((vs) => [...vs, blankVariant(inventory[0]?.id ?? "")])}
            >
              <Plus size={16} /> Apresentação
            </Button>
          </div>

          {inventory.length === 0 && (
            <ErrorNote message="Você ainda não tem insumos. Crie um no campo “Insumo” abaixo ou na aba Estoque." />
          )}

          {variants.map((v) => {
            const item = inventory.find((i) => i.id === v.inventoryItemId);
            const price = parseNum(v.price);
            const pack = parseNum(v.packSize);
            const cost = item && pack > 0 ? item.averageCost * pack : null;
            return (
              <div
                key={v.key}
                className="grid gap-3 rounded-xl border border-border bg-surface-strong p-3"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <TextInput
                    label="Apresentação"
                    value={v.name}
                    onChange={(x) => patch(v.key, { name: x })}
                    placeholder="Ex.: Copo 300 ml"
                  />
                  <TextInput
                    label="Unidade de venda"
                    value={v.unit}
                    onChange={(x) => patch(v.key, { unit: x })}
                    placeholder="un, copo, pote"
                  />
                  <TextInput
                    label="Preço (R$)"
                    value={v.price}
                    onChange={(x) => patch(v.key, { price: x })}
                    inputMode="decimal"
                    placeholder="0,00"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                  <Select
                    label="Insumo descontado"
                    value={v.inventoryItemId}
                    onChange={(e) => {
                      if (e.target.value === "__new") setCreatingFor(v.key);
                      else patch(v.key, { inventoryItemId: e.target.value });
                    }}
                  >
                    {!v.inventoryItemId && <option value="">Escolha…</option>}
                    {inventory.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({num(i.current)} {i.unit} em estoque)
                      </option>
                    ))}
                    <option value="__new">+ Criar novo insumo…</option>
                  </Select>
                  <TextInput
                    label={`Desconta por venda${item ? ` (${item.unit})` : ""}`}
                    value={v.packSize}
                    onChange={(x) => patch(v.key, { packSize: x })}
                    inputMode="decimal"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <label className="flex items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      checked={v.active}
                      onChange={(e) => patch(v.key, { active: e.target.checked })}
                    />
                    Ativa na loja
                  </label>
                  <span className="text-muted">
                    {cost !== null && `Custo do insumo: ${brl(cost)}`}
                    {cost !== null &&
                      price > 0 &&
                      ` · margem ${Math.round(((price - cost) / price) * 100)}%`}
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-semibold text-muted hover:text-foreground"
                    onClick={() => setVariants((vs) => vs.filter((x) => x.key !== v.key))}
                  >
                    <X size={14} /> Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <ErrorNote message={error} />
      </Modal>

      {creatingFor && (
        <InventoryForm
          item={null}
          onClose={() => setCreatingFor(null)}
          onCreated={(id) => patch(creatingFor, { inventoryItemId: id })}
        />
      )}
    </>
  );
}
