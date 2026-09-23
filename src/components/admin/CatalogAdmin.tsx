/**
 * Aba "Catálogo" do gestor: criar, editar e excluir produtos.
 * Sistema enxuto: cada card de produto tem foto, aponta para 1 insumo a
 * descontar no estoque e define o valor por unidade de medida (ex.: "300 ml",
 * "kg", "unidade"). Sem apresentações múltiplas — 1 produto = 1 card = 1 preço.
 */
import { useMemo, useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
            const v = skus.find((s) => s.baseProductId === p.id);
            const item = v ? inventory.find((i) => i.id === v.inventoryItemId) : undefined;
            const { cost, margin } = v
              ? rules.skuCostAndMargin(catalog.snapshot, v)
              : { cost: 0, margin: 0 };
            const stock = v ? rules.availableUnits(catalog.snapshot, v) : 0;
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
                      {!v ? (
                        <Badge tone="warning">Sem preço/insumo — não aparece na loja</Badge>
                      ) : (
                        <p className="text-xs text-muted">
                          {v.unit} · {brl(v.price)}
                          {!v.active && (
                            <span className="ml-1 text-warning-foreground">(inativo)</span>
                          )}
                        </p>
                      )}
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
                  {v && (
                    <p className="mt-1.5 text-xs text-muted">
                      desconta {num(v.packSize)} {item?.unit ?? ""} de{" "}
                      {item?.name ?? "insumo removido"} · custo {brl(cost)} · margem{" "}
                      {Math.round(margin * 100)}% · dá para vender {stock}
                    </p>
                  )}
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

const toText = (n: number) => String(n).replace(".", ",");

/**
 * Formulário enxuto: 1 card = nome + foto + insumo a descontar + valor por
 * unidade de medida. Se o produto já tinha mais de uma apresentação (de uma
 * versão anterior), salvar aqui deixa só a primeira e remove as demais.
 */
function ProductForm({ product, onClose }: { product: BaseProduct | null; onClose: () => void }) {
  const catalog = useCatalog();
  const { inventory, skus, products } = catalog;
  const existing = product ? skus.find((s) => s.baseProductId === product.id) : undefined;
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [image, setImage] = useState(product?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [creatingInsumo, setCreatingInsumo] = useState(false);
  const [unit, setUnit] = useState(existing?.unit ?? "");
  const [price, setPrice] = useState(existing ? toText(existing.price) : "");
  const [inventoryItemId, setInventoryItemId] = useState(
    existing?.inventoryItemId ?? inventory[0]?.id ?? "",
  );
  const [packSize, setPackSize] = useState(existing ? toText(existing.packSize) : "1");
  const [active, setActive] = useState(existing?.active ?? true);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products],
  );

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

  const item = inventory.find((i) => i.id === inventoryItemId);
  const priceValue = parseNum(price);
  const packValue = parseNum(packSize);
  const cost = item && packValue > 0 ? item.averageCost * packValue : null;

  const save = () => {
    setError("");
    try {
      if (!inventoryItemId) throw new rules.CatalogError("Escolha o insumo a descontar.");
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
        // Sistema enxuto: só 1 preço/insumo por produto — apaga apresentações extras antigas.
        const extras = next.skus.filter(
          (k) => k.baseProductId === productId && k.id !== existing?.id,
        );
        for (const extra of extras) next = rules.deleteSku(next, extra.id);
        next = existing
          ? rules.updateSku(next, existing.id, skuInput)
          : rules.createSku(next, productId, skuInput);
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
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <div className="grid content-start gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative grid aspect-square w-24 place-items-center overflow-hidden sm:w-full rounded-xl border border-dashed border-border bg-muted-surface text-muted"
            >
              {image ? (
                <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
              ) : (
                <span className="grid place-items-center gap-1 text-xs">
                  <ImagePlus size={22} />
                  {uploading ? "…" : "Foto"}
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
                Remover
              </Button>
            )}
          </div>
          <div className="grid content-start gap-4">
            <TextInput
              label="Nome do produto"
              value={name}
              onChange={setName}
              placeholder="Ex.: Café coado 300 ml"
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
          </div>
        </div>

        <TextArea
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="O que o cliente precisa saber sobre o produto"
        />

        {inventory.length === 0 && (
          <ErrorNote message="Você ainda não tem insumos. Crie um no campo “Insumo” abaixo ou na aba Estoque." />
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            label="Unidade de medida"
            value={unit}
            onChange={setUnit}
            placeholder="Ex.: 300 ml, kg, unidade"
          />
          <TextInput
            label="Valor por unidade (R$)"
            value={price}
            onChange={setPrice}
            inputMode="decimal"
            placeholder="0,00"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <Select
            label="Insumo a descontar"
            value={inventoryItemId}
            onChange={(e) => {
              if (e.target.value === "__new") setCreatingInsumo(true);
              else setInventoryItemId(e.target.value);
            }}
          >
            {!inventoryItemId && <option value="">Escolha…</option>}
            {inventory.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({num(i.current)} {i.unit} em estoque)
              </option>
            ))}
            <option value="__new">+ Criar novo insumo…</option>
          </Select>
          <TextInput
            label={`Desconta por venda${item ? ` (${item.unit})` : ""}`}
            value={packSize}
            onChange={setPackSize}
            inputMode="decimal"
            hint="Quanto do insumo sai do estoque a cada venda"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <label className="flex items-center gap-2 font-semibold">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Ativo na loja
          </label>
          {cost !== null && (
            <span className="text-muted">
              Custo do insumo: {brl(cost)}
              {priceValue > 0 &&
                ` · margem ${Math.round(((priceValue - cost) / priceValue) * 100)}%`}
            </span>
          )}
        </div>
        <ErrorNote message={error} />
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
