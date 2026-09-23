/**
 * Painel de status das integrações que dependem de variável de ambiente (servidor) — não dá
 * pra "salvar" essas credenciais aqui dentro (o app não tem banco de dados, e elas nunca podem
 * chegar ao navegador), então esse módulo só mostra o que está configurado ou não e explica
 * onde configurar. Cada status vem de um createServerFn que só devolve um boolean — a
 * credencial em si nunca sai do servidor (mesmo padrão em src/lib/whatsappBot.ts,
 * src/lib/geocoding.ts e src/lib/adminAuth.ts).
 */
import { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, KeyRound, Lock, MapPin, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getWhatsAppStatus } from "@/lib/whatsappBot";
import { getGeocodingStatus } from "@/lib/geocoding";
import { getAdminGateStatus } from "@/lib/adminAuth";
import { Badge, Surface } from "@/components/ui";

type Status = "checking" | "on" | "off";

interface ApiRow {
  key: string;
  icon: typeof MessageCircle;
  title: string;
  description: string;
  envVar: string;
  status: Status;
  /** Como "ligado" e "desligado" devem ser lidos pra essa integração específica. */
  onLabel: string;
  offLabel: string;
  /** Rota interna pra ver mais detalhes ou configurar o que dá pra configurar por aqui. */
  to?: string;
}

export function ApiIntegrationsPanel() {
  const [whatsapp, setWhatsapp] = useState<Status>("checking");
  const [geocoding, setGeocoding] = useState<Status>("checking");
  const [adminGate, setAdminGate] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    getWhatsAppStatus()
      .then((r) => !cancelled && setWhatsapp(r.configured ? "on" : "off"))
      .catch(() => !cancelled && setWhatsapp("off"));
    getGeocodingStatus()
      .then((r) => !cancelled && setGeocoding(r.configured ? "on" : "off"))
      .catch(() => !cancelled && setGeocoding("off"));
    getAdminGateStatus()
      .then((r) => !cancelled && setAdminGate(r.protected ? "on" : "off"))
      .catch(() => !cancelled && setAdminGate("off"));
    return () => {
      cancelled = true;
    };
  }, []);

  const rows: ApiRow[] = [
    {
      key: "whatsapp",
      icon: MessageCircle,
      title: "WhatsApp Business",
      description: "Notificações automáticas de pedido e o bot de pedidos pelo WhatsApp.",
      envVar: "WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID",
      status: whatsapp,
      onLabel: "Conectado",
      offLabel: "Não conectado",
      to: "/admin/whatsapp",
    },
    {
      key: "geocoding",
      icon: MapPin,
      title: "Geocoding (Google Maps)",
      description: 'Resolve o endereço do checkout em lat/long pro link "ver no mapa".',
      envVar: "GOOGLE_MAPS_API_KEY",
      status: geocoding,
      onLabel: "Configurada",
      offLabel: "Não configurada",
    },
    {
      key: "admin-gate",
      icon: Lock,
      title: "Senha do painel",
      description: "Pede senha pra abrir /admin — protege o gestor de acesso de fora.",
      envVar: "ADMIN_PASSWORD",
      status: adminGate,
      onLabel: "Protegido",
      offLabel: "Sem senha (aberto)",
    },
  ];

  return (
    <Surface className="grid gap-1">
      <div className="mb-2 flex items-center gap-2">
        <KeyRound size={18} className="text-muted" />
        <h2 className="text-lg font-bold">APIs e integrações</h2>
      </div>
      <p className="mb-2 text-sm text-muted">
        Credenciais de servidor (nunca ficam no navegador). Configura-se em Settings → Environment
        Variables no projeto na Vercel — depois de salvar, refaça o deploy pra valer.
      </p>
      <div className="grid gap-2">
        {rows.map((r) => (
          <div
            key={r.key}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-strong px-3 py-3"
          >
            <r.icon size={18} className="shrink-0 text-muted" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-sm">{r.title}</b>
                {r.status === "checking" ? (
                  <Badge tone="neutral">
                    <CircleDashed size={12} className="mr-1 inline animate-spin" /> Verificando…
                  </Badge>
                ) : r.status === "on" ? (
                  <Badge tone="good">
                    <CheckCircle2 size={12} className="mr-1 inline" /> {r.onLabel}
                  </Badge>
                ) : (
                  <Badge tone="warning">{r.offLabel}</Badge>
                )}
              </div>
              <p className="text-xs text-muted">{r.description}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted">{r.envVar}</p>
            </div>
            {r.to && (
              <Link to={r.to} className="chip shrink-0">
                Abrir
              </Link>
            )}
          </div>
        ))}
      </div>
    </Surface>
  );
}
