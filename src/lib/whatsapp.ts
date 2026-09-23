import type { CartItem, ProductSKU, BaseProduct } from "@/types/marketplace";
import { STORE_WHATSAPP_NUMBER } from "@/config/store";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export interface OrderForWhatsApp {
  orderRef: string;
  cart: CartItem[];
  skus: ProductSKU[];
  products: BaseProduct[];
  total: number;
  customer: { name: string; phone: string };
  address?: string;
  paymentMethod: string;
}

/** Monta o texto do pedido no formato que o time recebe pelo WhatsApp. */
export function buildOrderMessage(o: OrderForWhatsApp) {
  const lines = o.cart.map((line) => {
    const sku = o.skus.find((s) => s.id === line.skuId);
    const product = sku && o.products.find((p) => p.id === sku.baseProductId);
    const name = product ? `${product.name} (${sku?.unit})` : "Item removido";
    const subtotal = sku ? sku.price * line.quantity : 0;
    return `• ${line.quantity}x ${name} — ${brl(subtotal)}`;
  });
  return [
    `*Novo pedido ${o.orderRef}*`,
    "",
    ...lines,
    "",
    `*Total: ${brl(o.total)}*`,
    `Pagamento: ${o.paymentMethod}`,
    "",
    `Cliente: ${o.customer.name}`,
    `Telefone: ${o.customer.phone}`,
    ...(o.address ? [`Entrega: ${o.address}`] : []),
  ].join("\n");
}

/** Link wa.me para enviar o pedido pronto para a loja (sem precisar de backend). */
export function buildWhatsAppOrderLink(o: OrderForWhatsApp) {
  const text = encodeURIComponent(buildOrderMessage(o));
  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${text}`;
}
