/**
 * Configuração da loja para o envio do pedido por WhatsApp.
 * Troque pelo número real (com DDI+DDD, só dígitos) antes de publicar,
 * ou defina VITE_STORE_WHATSAPP no ambiente do Vercel.
 */
export const STORE_WHATSAPP_NUMBER = import.meta.env["VITE_STORE_WHATSAPP"] || "5511999999999";
