import { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";
import { operation } from "@/data/mock";
import { useDriverAuth } from "../context/DriverAuthContext";
import { Button, Surface } from "../components/ui";

/**
 * Tela de entrada do app do entregador. Só quem o gestor cadastrou em
 * /admin/entregadores (telefone + PIN) consegue passar daqui.
 */
export function LoginPage() {
  const { login } = useDriverAuth();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      login(phone, pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="driver-app">
      <div className="login-screen">
        <div className="login-card">
          <span className="login-logo">{operation.name.charAt(0)}</span>
          <h1>Entrar como entregador</h1>
          <p className="muted">Use o telefone e o PIN cadastrados pelo gestor da loja.</p>

          <form onSubmit={submit} className="login-form">
            <label className="field">
              <span>Telefone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(61) 99999-9999"
                inputMode="tel"
                autoFocus
              />
            </label>

            <label className="field">
              <span>PIN</span>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                inputMode="numeric"
                maxLength={4}
                className="login-pin"
              />
            </label>

            {error && <Surface className="login-error">{error}</Surface>}

            <Button
              size="lg"
              block
              type="submit"
              disabled={busy || !phone.trim() || pin.length !== 4}
            >
              <LogIn size={18} /> Entrar
            </Button>
          </form>

          <p className="login-hint muted">
            Ainda não tem acesso? Peça ao gestor da loja para te cadastrar em "Entregadores".
          </p>
        </div>
      </div>
    </div>
  );
}
