/**
 * Login do entregador: telefone + PIN de 4 dígitos, cadastrados pelo gestor em
 * /admin/entregadores. A sessão fica só no navegador daquele celular
 * (sessionStorage), então cada aparelho loga com o próprio entregador e some
 * ao fechar a aba — não é um "usuário e senha" com servidor, é uma trava local
 * para separar quem é quem no app.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useCatalog } from "@/context/CatalogContext";

const SESSION_KEY = "mp:driver-session";

export interface DriverIdentity {
  id: string;
  name: string;
  phone: string;
}

interface DriverAuthState {
  /** null enquanto ainda não terminou de ler a sessão salva. */
  ready: boolean;
  identity: DriverIdentity | null;
  /** Lança CatalogError (mensagem em português) se telefone/PIN não baterem. */
  login: (phone: string, pin: string) => void;
  logout: () => void;
}

const DriverAuthContext = createContext<DriverAuthState | undefined>(undefined);

function readSession(): DriverIdentity | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === "string" && typeof parsed.name === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

export function DriverAuthProvider({ children }: { children: ReactNode }) {
  const catalog = useCatalog();
  const [identity, setIdentity] = useState<DriverIdentity | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIdentity(readSession());
    setReady(true);
  }, []);

  const login = useCallback(
    (phone: string, pin: string) => {
      // Lança CatalogError("Telefone ou PIN incorretos.") se não bater — a tela mostra a mensagem.
      const driver = catalog.verifyDriverPin(phone, pin);
      const session: DriverIdentity = { id: driver.id, name: driver.name, phone: driver.phone };
      try {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch {
        /* aba anônima / storage bloqueado: segue só em memória nesta aba */
      }
      setIdentity(session);
    },
    [catalog],
  );

  const logout = useCallback(() => {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignora */
    }
    setIdentity(null);
  }, []);

  return (
    <DriverAuthContext.Provider value={{ ready, identity, login, logout }}>
      {children}
    </DriverAuthContext.Provider>
  );
}

export function useDriverAuth() {
  const ctx = useContext(DriverAuthContext);
  if (!ctx) throw new Error("useDriverAuth precisa estar dentro de <DriverAuthProvider>.");
  return ctx;
}
