/**
 * Tema claro/escuro da loja, do gestor e do entregador (todos usam as mesmas
 * variáveis de cor de src/styles.css). A escolha fica salva no navegador
 * (localStorage) — "sistema" acompanha o tema do celular/computador.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference = "light" | "dark" | "system";
const STORAGE_KEY = "mercado-pronto:theme";

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(pref: ThemePreference) {
  const dark = pref === "dark" || (pref === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

function readStoredTheme(): ThemePreference {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    /* navegador sem storage: segue no padrão do sistema */
  }
  return "system";
}

interface ThemeState {
  theme: ThemePreference;
  /** true se o resultado visível agora é escuro (considera "sistema"). */
  isDark: boolean;
  setTheme: (t: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeState | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    applyTheme(stored);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyTheme("system");
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: ThemePreference) => {
    setThemeState(t);
    applyTheme(t);
    setIsDark(document.documentElement.classList.contains("dark"));
    try {
      window.localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* segue só nesta aba */
    }
  }, []);

  const value = useMemo<ThemeState>(() => ({ theme, isDark, setTheme }), [theme, isDark, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme precisa estar dentro de <ThemeProvider>.");
  return ctx;
}
