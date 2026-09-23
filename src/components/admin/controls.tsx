/** Peças de formulário e janela (modal) usadas no painel do gestor. */
import {
  useEffect,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const num = (n: number, max = 3) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: max });

/** Lê número digitado no jeito brasileiro ("0,018" ou "1.234,5"). Vazio ou inválido vira NaN. */
export function parseNum(text: string) {
  const clean = text.trim().replace(/\s/g, "");
  if (!clean) return Number.NaN;
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  return Number(normalized);
}

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-surface-strong px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30";

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  inputMode,
  autoFocus,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  inputMode?: "decimal" | "text";
  autoFocus?: boolean;
  /** Opcional — útil quando há vários campos parecidos na mesma tela (ex.: um por etapa). */
  id?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      {label}
      <input
        id={id}
        className={inputClass}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <small className="font-normal text-muted">{hint}</small>}
    </label>
  );
}

export function TextArea({
  label,
  ...p
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      {label}
      <textarea className={cn(inputClass, "h-20 py-2")} {...p} />
    </label>
  );
}

export function Select({
  label,
  children,
  ...p
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      {label}
      <select className={inputClass} {...p}>
        {children}
      </select>
    </label>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  // Portal: desenha a janela direto no <body>. Assim ela fica por cima de tudo, mesmo
  // quando é aberta de dentro de um cartão com efeito de desfoque (que "prende" elementos fixos).
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          "flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-border bg-background shadow-soft sm:rounded-2xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <b className="text-lg">{title}</b>
          <button
            aria-label="Fechar"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-muted-surface"
          >
            <X size={20} />
          </button>
        </div>
        <div className="grid gap-4 overflow-y-auto px-5 py-4">{children}</div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ErrorNote({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm font-semibold text-warning-foreground">
      {message}
    </p>
  );
}
