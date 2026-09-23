import { Moon, Sun, SunMoon } from "lucide-react";
import { useTheme, type ThemePreference } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const NEXT: Record<ThemePreference, ThemePreference> = {
  light: "dark",
  dark: "system",
  system: "light",
};
const LABEL: Record<ThemePreference, string> = {
  light: "Tema claro",
  dark: "Tema escuro",
  system: "Tema automático (segue o aparelho)",
};

/** Botão que alterna claro → escuro → automático → claro… Usado na loja, no gestor e no entregador. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, isDark, setTheme } = useTheme();
  const Icon = theme === "system" ? SunMoon : isDark ? Moon : Sun;
  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`${LABEL[theme]}. Tocar para trocar de tema.`}
      title={LABEL[theme]}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl bg-muted-surface text-foreground",
        className,
      )}
    >
      <Icon size={19} />
    </button>
  );
}
