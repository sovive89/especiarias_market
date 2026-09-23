/**
 * Proteção por senha única do painel /admin — não é um sistema de contas (não existe banco
 * de dados nesse projeto), é uma trava simples pra ninguém de fora abrir o gestor.
 *
 * Mesmo padrão de segurança do token do WhatsApp e da chave do Google Maps: a senha nunca
 * chega ao navegador do cliente — fica só em variável de ambiente do servidor
 * (ADMIN_PASSWORD, nunca com prefixo VITE_) e a comparação acontece dentro do createServerFn.
 *
 * Sem ADMIN_PASSWORD configurada, o /admin fica aberto normalmente (como sempre foi) — assim
 * o app não trava ninguém antes de alguém configurar a senha na Vercel.
 */
import { createServerFn } from "@tanstack/react-start";

/** Chave usada no localStorage do navegador para lembrar que a senha já foi validada. */
export const ADMIN_AUTH_STORAGE_KEY = "mp:admin-authed";

function readAdminPassword(): string | null {
  return process.env["ADMIN_PASSWORD"] || null;
}

/** Diz pra tela se o /admin está protegido por senha, sem expor a senha em si. */
export const getAdminGateStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { protected: readAdminPassword() !== null };
});

export interface CheckAdminPasswordInput {
  password: string;
}

/** Confere a senha digitada contra a variável de ambiente. Nunca lança erro. */
export const checkAdminPassword = createServerFn({ method: "POST" })
  .validator((data: CheckAdminPasswordInput) => data)
  .handler(async ({ data }): Promise<boolean> => {
    const expected = readAdminPassword();
    if (!expected) return true; // não configurada: não trava ninguém
    return data.password === expected;
  });
