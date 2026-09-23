import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Surface } from "@/components/ui";
import { ErrorNote } from "@/components/admin/controls";
import { ADMIN_AUTH_STORAGE_KEY, checkAdminPassword, getAdminGateStatus } from "@/lib/adminAuth";

/**
 * Tela de senha do painel do gestor. `admin.tsx` manda pra cá (com `?redirect=`) sempre que
 * detecta que o /admin está protegido (ADMIN_PASSWORD configurada na Vercel — ver
 * src/lib/adminAuth.ts) e o navegador ainda não tem a senha validada salva.
 */
export const Route = createFileRoute("/admin_/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [{ title: "Entrar — Mercado Pronto" }, { name: "robots", content: "noindex" }],
  }),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  const { redirect } = useSearch({ from: "/admin_/login" });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Só faz sentido pedir senha se ADMIN_PASSWORD estiver configurada no servidor. Sem ela, quem
  // cair direto em /admin/login (link salvo, digitou a URL) é mandado de volta — não existe
  // "entrar" no vazio.
  useEffect(() => {
    let cancelled = false;
    getAdminGateStatus()
      .then((status) => {
        if (!cancelled && !status.protected) nav({ to: redirect || "/admin", replace: true });
      })
      .catch(() => {
        /* falhou a checagem: deixa a tela de senha normal, não bloqueia o acesso */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const ok = await checkAdminPassword({ data: { password } });
      if (!ok) {
        setError("Senha incorreta.");
        return;
      }
      localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "1");
      nav({ to: redirect || "/admin" });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-svh place-items-center bg-background px-4">
      <Surface className="grid w-full max-w-sm gap-5 p-6">
        <div className="grid place-items-center gap-2 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Lock size={22} />
          </span>
          <b className="text-lg">Painel do gestor</b>
          <p className="text-sm text-muted">Digite a senha para continuar.</p>
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <label className="grid gap-1.5 text-sm font-semibold">
            Senha
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 rounded-xl border border-border bg-surface-strong px-3 font-normal outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <ErrorNote message={error} />
          <Button type="submit" className="w-full" disabled={submitting || !password}>
            {submitting ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </Surface>
    </div>
  );
}
