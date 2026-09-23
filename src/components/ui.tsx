import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
export function Button({
  className,
  variant = "primary",
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition active:scale-[.98] disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-foreground shadow-soft",
        variant === "secondary" && "border border-border bg-surface-strong text-foreground",
        variant === "ghost" && "text-muted hover:bg-muted-surface",
        className,
      )}
      {...p}
    />
  );
}
export function Field({ label, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      {label}
      <input
        className="h-12 rounded-xl border border-border bg-surface-strong px-3 font-normal outline-none focus:ring-2 focus:ring-primary/30"
        {...p}
      />
    </label>
  );
}
export function Surface({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 shadow-soft backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
        tone === "neutral" && "bg-muted-surface text-muted",
        tone === "good" && "bg-success-soft text-success",
        tone === "warning" && "bg-warning-soft text-warning-foreground",
      )}
    >
      {children}
    </span>
  );
}
