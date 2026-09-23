/**
 * Regras de negócio do catálogo e do estoque.
 *
 * Tudo aqui é "função pura": recebe o estado atual (CatalogSnapshot) e devolve
 * um estado NOVO, sem alterar o antigo e sem saber de tela, React ou banco.
 * Isso deixa as regras fáceis de testar e de reaproveitar no backend no futuro.
 *
 * Como os dados se ligam:
 *   Produto (Café coado)
 *     └─ Apresentação/SKU (Copo 300 ml, R$ 8,50)
 *          └─ aponta para 1 Insumo (Café em grãos, kg) e diz quanto consome: packSize = 0,018 kg
 *   Vender 1 copo  ⇒  estoque do insumo cai 0,018 kg.
 */
import type {
  BaseProduct,
  CartItem,
  CatalogSnapshot,
  InventoryItem,
  PlacedOrder,
  PlacedOrderItem,
  PlacedOrderStatus,
  ProductSKU,
  StockMovement,
  StoreBranding,
  StoreDriver,
} from "@/types/marketplace";

export class CatalogError extends Error {}

export type ProductInput = Omit<BaseProduct, "id" | "skuIds">;
export type SkuInput = Omit<ProductSKU, "id" | "baseProductId">;
export type InventoryInput = Omit<InventoryItem, "id" | "current" | "averageCost"> & {
  /** Quantidade inicial; se maior que zero, vira uma entrada no histórico. */
  initialQuantity: number;
  initialUnitCost: number;
};

const now = () => new Date().toISOString();

export function newId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

/** Arredonda para 3 casas e evita lixo de ponto flutuante (0.1 + 0.2 = 0.30000000000000004). */
export const round3 = (n: number) => Math.round(n * 1000) / 1000;
/** Arredonda dinheiro para centavos. */
export const round2 = (n: number) => Math.round(n * 100) / 100;

function required(value: string, field: string) {
  if (!value.trim()) throw new CatalogError(`Preencha o campo "${field}".`);
}
function filled(value: number, field: string) {
  if (!Number.isFinite(value)) throw new CatalogError(`Preencha o campo "${field}" com um número.`);
}
function positive(value: number, field: string) {
  filled(value, field);
  if (value <= 0) throw new CatalogError(`"${field}" precisa ser maior que zero.`);
}
function notNegative(value: number, field: string) {
  filled(value, field);
  if (value < 0) throw new CatalogError(`"${field}" não pode ser negativo.`);
}

function findInventory(s: CatalogSnapshot, id: string) {
  const item = s.inventory.find((i) => i.id === id);
  if (!item) throw new CatalogError("Insumo não encontrado.");
  return item;
}

/* ───────────── Produtos ───────────── */

export function createProduct(s: CatalogSnapshot, input: ProductInput) {
  required(input.name, "Nome");
  required(input.category, "Categoria");
  const product: BaseProduct = { ...input, id: newId("prod"), skuIds: [] };
  return { snapshot: { ...s, products: [...s.products, product] }, product };
}

export function updateProduct(
  s: CatalogSnapshot,
  id: string,
  input: ProductInput,
): CatalogSnapshot {
  required(input.name, "Nome");
  required(input.category, "Categoria");
  if (!s.products.some((p) => p.id === id)) throw new CatalogError("Produto não encontrado.");
  return { ...s, products: s.products.map((p) => (p.id === id ? { ...p, ...input } : p)) };
}

/** Apaga o produto e as apresentações dele. O insumo continua no estoque. */
export function deleteProduct(s: CatalogSnapshot, id: string): CatalogSnapshot {
  return {
    ...s,
    products: s.products.filter((p) => p.id !== id),
    skus: s.skus.filter((k) => k.baseProductId !== id),
  };
}

/* ───────────── Apresentações (SKUs) ───────────── */

function validateSku(s: CatalogSnapshot, input: SkuInput) {
  required(input.name, "Apresentação");
  required(input.unit, "Unidade de venda");
  notNegative(input.price, "Preço");
  positive(input.packSize, "Consumo do insumo");
  findInventory(s, input.inventoryItemId);
}

export function createSku(s: CatalogSnapshot, productId: string, input: SkuInput): CatalogSnapshot {
  validateSku(s, input);
  if (!s.products.some((p) => p.id === productId))
    throw new CatalogError("Produto não encontrado.");
  const sku: ProductSKU = { ...input, id: newId("sku"), baseProductId: productId };
  return {
    ...s,
    skus: [...s.skus, sku],
    products: s.products.map((p) =>
      p.id === productId ? { ...p, skuIds: [...p.skuIds, sku.id] } : p,
    ),
  };
}

export function updateSku(s: CatalogSnapshot, id: string, input: SkuInput): CatalogSnapshot {
  validateSku(s, input);
  return { ...s, skus: s.skus.map((k) => (k.id === id ? { ...k, ...input } : k)) };
}

/** Pausa ou reativa o item na loja sem mexer no resto do cadastro. */
export function setSkuActive(s: CatalogSnapshot, id: string, active: boolean): CatalogSnapshot {
  if (!s.skus.some((k) => k.id === id)) throw new CatalogError("Item não encontrado.");
  return { ...s, skus: s.skus.map((k) => (k.id === id ? { ...k, active } : k)) };
}

export function deleteSku(s: CatalogSnapshot, id: string): CatalogSnapshot {
  return {
    ...s,
    skus: s.skus.filter((k) => k.id !== id),
    products: s.products.map((p) => ({ ...p, skuIds: p.skuIds.filter((x) => x !== id) })),
  };
}

/* ───────────── Insumos (estoque) ───────────── */

export function createInventoryItem(s: CatalogSnapshot, input: InventoryInput) {
  required(input.name, "Nome do insumo");
  required(input.unit, "Unidade");
  notNegative(input.minimum, "Estoque mínimo");
  notNegative(input.initialQuantity, "Quantidade inicial");
  notNegative(input.initialUnitCost, "Custo por unidade");
  const item: InventoryItem = {
    id: newId("ins"),
    name: input.name.trim(),
    unit: input.unit.trim(),
    minimum: input.minimum,
    current: 0,
    averageCost: 0,
  };
  let snapshot: CatalogSnapshot = { ...s, inventory: [...s.inventory, item] };
  if (input.initialQuantity > 0) {
    snapshot = addStockEntry(
      snapshot,
      item.id,
      input.initialQuantity,
      input.initialUnitCost,
      "Estoque inicial",
    );
  }
  return { snapshot, item };
}

export function updateInventoryItem(
  s: CatalogSnapshot,
  id: string,
  input: Pick<InventoryItem, "name" | "unit" | "minimum">,
): CatalogSnapshot {
  required(input.name, "Nome do insumo");
  required(input.unit, "Unidade");
  notNegative(input.minimum, "Estoque mínimo");
  findInventory(s, id);
  return { ...s, inventory: s.inventory.map((i) => (i.id === id ? { ...i, ...input } : i)) };
}

/** Não deixa apagar um insumo que ainda tem apresentações apontando para ele. */
export function deleteInventoryItem(s: CatalogSnapshot, id: string): CatalogSnapshot {
  const linked = s.skus.filter((k) => k.inventoryItemId === id);
  if (linked.length) {
    throw new CatalogError(
      `Este insumo está ligado a ${linked.length} apresentação(ões). Troque o insumo delas ou apague-as antes.`,
    );
  }
  return {
    ...s,
    inventory: s.inventory.filter((i) => i.id !== id),
    movements: s.movements.filter((m) => m.inventoryItemId !== id),
  };
}

/**
 * Entrada de estoque (compra). Recalcula o custo médio ponderado:
 *   novo custo = (estoque atual × custo atual + quantidade comprada × custo pago) ÷ estoque novo
 * Ex.: tinha 10 kg a R$ 40 e comprou 10 kg a R$ 50 ⇒ 20 kg a R$ 45.
 */
export function addStockEntry(
  s: CatalogSnapshot,
  id: string,
  quantity: number,
  unitCost: number,
  note?: string,
): CatalogSnapshot {
  positive(quantity, "Quantidade");
  notNegative(unitCost, "Custo por unidade");
  const item = findInventory(s, id);
  const current = Math.max(item.current, 0);
  const total = current + quantity;
  const averageCost = (current * item.averageCost + quantity * unitCost) / total;
  const movement: StockMovement = {
    id: newId("mov"),
    inventoryItemId: id,
    type: "entrada",
    quantity,
    unitCost,
    createdAt: now(),
    ...(note ? { note } : {}),
  };
  return {
    ...s,
    inventory: s.inventory.map((i) =>
      i.id === id
        ? { ...i, current: round3(item.current + quantity), averageCost: round3(averageCost) }
        : i,
    ),
    movements: [movement, ...s.movements],
  };
}

/** Ajuste manual: informa quanto existe de verdade (contagem) e o sistema registra a diferença. */
export function adjustStock(
  s: CatalogSnapshot,
  id: string,
  countedQuantity: number,
  note?: string,
): CatalogSnapshot {
  notNegative(countedQuantity, "Quantidade contada");
  const item = findInventory(s, id);
  const diff = round3(countedQuantity - item.current);
  if (diff === 0) return s;
  const movement: StockMovement = {
    id: newId("mov"),
    inventoryItemId: id,
    type: "ajuste",
    quantity: diff,
    createdAt: now(),
    ...(note ? { note } : {}),
  };
  return {
    ...s,
    inventory: s.inventory.map((i) => (i.id === id ? { ...i, current: countedQuantity } : i)),
    movements: [movement, ...s.movements],
  };
}

/* ───────────── Venda ───────────── */

/** Quantas unidades desta apresentação ainda dá para vender com o insumo que existe. */
export function availableUnits(s: CatalogSnapshot, sku: ProductSKU) {
  const item = s.inventory.find((i) => i.id === sku.inventoryItemId);
  if (!item || sku.packSize <= 0) return 0;
  return Math.max(0, Math.floor(round3(item.current / sku.packSize)));
}

/** Soma quanto de cada insumo o carrinho consome. Duas apresentações do mesmo insumo somam juntas. */
export function consumptionByInventory(s: CatalogSnapshot, cart: CartItem[]) {
  const need = new Map<string, number>();
  for (const line of cart) {
    const sku = s.skus.find((k) => k.id === line.skuId);
    if (!sku) continue;
    need.set(
      sku.inventoryItemId,
      round3((need.get(sku.inventoryItemId) ?? 0) + sku.packSize * line.quantity),
    );
  }
  return need;
}

/** Lista o que falta para atender o carrinho. Vazia = dá para vender tudo. */
export function stockShortages(s: CatalogSnapshot, cart: CartItem[]) {
  const shortages: { item: InventoryItem; needed: number }[] = [];
  for (const [id, needed] of consumptionByInventory(s, cart)) {
    const item = s.inventory.find((i) => i.id === id);
    if (item && needed > item.current) shortages.push({ item, needed });
  }
  return shortages;
}

/** Baixa o estoque de um pedido confirmado. Recusa se algum insumo não for suficiente. */
export function deductSale(
  s: CatalogSnapshot,
  cart: CartItem[],
  orderRef: string,
): CatalogSnapshot {
  const shortages = stockShortages(s, cart);
  if (shortages.length) {
    const names = shortages.map((x) => x.item.name).join(", ");
    throw new CatalogError(`Estoque insuficiente para: ${names}.`);
  }
  const need = consumptionByInventory(s, cart);
  const createdAt = now();
  const movements: StockMovement[] = [...need].map(([inventoryItemId, quantity]) => ({
    id: newId("mov"),
    inventoryItemId,
    type: "venda",
    quantity: -quantity,
    note: orderRef,
    createdAt,
  }));
  return {
    ...s,
    inventory: s.inventory.map((i) =>
      need.has(i.id) ? { ...i, current: round3(i.current - (need.get(i.id) ?? 0)) } : i,
    ),
    movements: [...movements, ...s.movements],
  };
}

/* ───────────── Pedidos ───────────── */

export type OrderInput = {
  cart: CartItem[];
  customer: { name: string; phone: string };
  address: string;
  paymentMethod: string;
};

/** Próximo código sequencial legível: MP-0001, MP-0002… */
function nextOrderCode(s: CatalogSnapshot) {
  const max = s.orders.reduce((m, o) => Math.max(m, Number(o.code.replace(/\D/g, "")) || 0), 0);
  return `MP-${String(max + 1).padStart(4, "0")}`;
}

/**
 * Registra um pedido pago: baixa o estoque (recusa se faltar insumo) e coloca o
 * pedido na fila do gestor como "novo". Nome e preço dos itens são copiados agora.
 */
export function placeOrder(s: CatalogSnapshot, input: OrderInput) {
  if (!input.cart.length) throw new CatalogError("O carrinho está vazio.");
  const code = nextOrderCode(s);
  const items: PlacedOrderItem[] = input.cart.map((line) => {
    const sku = s.skus.find((k) => k.id === line.skuId);
    if (!sku) throw new CatalogError("Um item do carrinho não existe mais no catálogo.");
    const product = s.products.find((p) => p.id === sku.baseProductId);
    return {
      skuId: sku.id,
      productName: product?.name ?? sku.name,
      unit: sku.unit,
      quantity: line.quantity,
      unitPrice: sku.price,
    };
  });
  const withStock = deductSale(s, input.cart, `Pedido ${code}`);
  const createdAt = now();
  const order: PlacedOrder = {
    id: newId("ped"),
    code,
    createdAt,
    updatedAt: createdAt,
    items,
    total: round2(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)),
    customer: { name: input.customer.name.trim(), phone: input.customer.phone.trim() },
    address: input.address.trim(),
    paymentMethod: input.paymentMethod,
    status: "novo",
  };
  return { snapshot: { ...withStock, orders: [order, ...withStock.orders] }, order };
}

/** Ordem das etapas; "avançar" leva para a próxima. */
export const ORDER_FLOW: PlacedOrderStatus[] = ["novo", "preparo", "pronto", "entrega", "entregue"];

export function nextStatus(status: PlacedOrderStatus): PlacedOrderStatus | null {
  const i = ORDER_FLOW.indexOf(status);
  return i >= 0 && i < ORDER_FLOW.length - 1 ? (ORDER_FLOW[i + 1] ?? null) : null;
}

/** Devolve ao estoque o que o pedido tinha baixado (usado no cancelamento). */
function returnStock(s: CatalogSnapshot, order: PlacedOrder): CatalogSnapshot {
  const need = consumptionByInventory(
    s,
    order.items.map((i) => ({ skuId: i.skuId, quantity: i.quantity })),
  );
  const createdAt = now();
  const movements: StockMovement[] = [...need].map(([inventoryItemId, quantity]) => ({
    id: newId("mov"),
    inventoryItemId,
    type: "estorno",
    quantity,
    note: `Cancelado ${order.code}`,
    createdAt,
  }));
  return {
    ...s,
    inventory: s.inventory.map((i) =>
      need.has(i.id) ? { ...i, current: round3(i.current + (need.get(i.id) ?? 0)) } : i,
    ),
    movements: [...movements, ...s.movements],
  };
}

/** Muda a etapa do pedido. Cancelar devolve os insumos ao estoque; pedido entregue não cancela. */
export function setOrderStatus(
  s: CatalogSnapshot,
  id: string,
  status: PlacedOrderStatus,
): CatalogSnapshot {
  const order = s.orders.find((o) => o.id === id);
  if (!order) throw new CatalogError("Pedido não encontrado.");
  if (order.status === status) return s;
  if (order.status === "cancelado") throw new CatalogError("Este pedido já foi cancelado.");
  if (status === "cancelado" && order.status === "entregue")
    throw new CatalogError("Pedido já entregue não pode ser cancelado.");
  const base = status === "cancelado" ? returnStock(s, order) : s;
  return {
    ...base,
    orders: base.orders.map((o) => (o.id === id ? { ...o, status, updatedAt: now() } : o)),
  };
}

/* ───────────── Entregadores ─────────────
 * Cadastro local de quem entrega, com um PIN de 4 dígitos para abrir o app
 * do entregador no próprio celular. É controle de acesso por conveniência
 * (sem servidor) — não substitui autenticação de verdade.
 */

export type DriverInput = { name: string; phone: string; pin: string };

function validateDriverInput(input: DriverInput) {
  required(input.name, "Nome");
  required(input.phone, "Telefone");
  if (!/^\d{4}$/.test(input.pin.trim())) throw new CatalogError("O PIN precisa ter 4 números.");
}

export function createDriver(s: CatalogSnapshot, input: DriverInput) {
  validateDriverInput(input);
  const driver: StoreDriver = {
    id: newId("drv"),
    name: input.name.trim(),
    phone: input.phone.trim(),
    pin: input.pin.trim(),
    active: true,
    createdAt: now(),
  };
  return { snapshot: { ...s, drivers: [driver, ...s.drivers] }, driver };
}

export function updateDriver(s: CatalogSnapshot, id: string, input: DriverInput): CatalogSnapshot {
  validateDriverInput(input);
  if (!s.drivers.some((d) => d.id === id)) throw new CatalogError("Entregador não encontrado.");
  return {
    ...s,
    drivers: s.drivers.map((d) =>
      d.id === id
        ? { ...d, name: input.name.trim(), phone: input.phone.trim(), pin: input.pin.trim() }
        : d,
    ),
  };
}

export function setDriverActive(s: CatalogSnapshot, id: string, active: boolean): CatalogSnapshot {
  return { ...s, drivers: s.drivers.map((d) => (d.id === id ? { ...d, active } : d)) };
}

export function deleteDriver(s: CatalogSnapshot, id: string): CatalogSnapshot {
  return { ...s, drivers: s.drivers.filter((d) => d.id !== id) };
}

/** Confere telefone + PIN contra os entregadores ativos. Usado na tela de login. */
export function verifyDriverPin(s: CatalogSnapshot, phone: string, pin: string): StoreDriver {
  const clean = phone.trim();
  const driver = s.drivers.find((d) => d.phone === clean && d.active);
  if (!driver || driver.pin !== pin.trim()) throw new CatalogError("Telefone ou PIN incorretos.");
  return driver;
}

/* ───────────── Identidade da loja (branding) ───────────── */

export function updateBranding(s: CatalogSnapshot, input: StoreBranding): CatalogSnapshot {
  required(input.name, "Nome da loja");
  required(input.message, "Mensagem");
  required(input.eta, "Tempo de entrega");
  required(input.whatsappNumber, "WhatsApp");
  if (!/^\d{10,15}$/.test(input.whatsappNumber.trim()))
    throw new CatalogError(
      'WhatsApp precisa ter só números, com DDI e DDD (ex.: "5511999999999").',
    );
  return {
    ...s,
    branding: {
      name: input.name.trim(),
      message: input.message.trim(),
      eta: input.eta.trim(),
      logo: input.logo,
      whatsappNumber: input.whatsappNumber.trim(),
    },
  };
}

/* ───────────── Zerar dados ───────────── */

/**
 * Zera o estoque (insumos + histórico de movimentações), sem tocar no cardápio
 * (produtos/SKUs), nos pedidos ou nos entregadores. Como todo SKU aponta para
 * um insumo, esvaziar o estoque deixa os itens do cardápio sem insumo válido —
 * é preciso recadastrar os insumos e reapontar os itens depois.
 */
export function resetInventory(s: CatalogSnapshot): CatalogSnapshot {
  return { ...s, inventory: [], movements: [] };
}

/* ───────────── Indicadores ───────────── */

export function stockValue(s: CatalogSnapshot) {
  return s.inventory.reduce((sum, i) => sum + Math.max(i.current, 0) * i.averageCost, 0);
}

/** Custo do insumo gasto em 1 unidade vendida (base do CMV) e a margem bruta sobre o preço. */
export function skuCostAndMargin(s: CatalogSnapshot, sku: ProductSKU) {
  const item = s.inventory.find((i) => i.id === sku.inventoryItemId);
  const cost = item ? item.averageCost * sku.packSize : 0;
  const margin = sku.price > 0 ? (sku.price - cost) / sku.price : 0;
  return { cost, margin };
}
