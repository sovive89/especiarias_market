import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  Users,
  Truck,
  FileText,
  Settings,
  TrendingUp,
  PackageCheck,
  AlertTriangle,
  Search,
  Map,
  MessageCircle,
  Package,
} from "lucide-react";
import { Badge, Button, Surface } from "@/components/ui";
import { orders } from "@/data/mock";
import { CatalogAdmin } from "@/components/admin/CatalogAdmin";
import { StockAdmin } from "@/components/admin/StockAdmin";
/* Cada aba junto com o seu ícone, para os dois nunca ficarem desalinhados. */
const tabs = [
  { label: "Visão geral", icon: BarChart3 },
  { label: "Pedidos", icon: ClipboardList },
  { label: "Catálogo", icon: Package },
  { label: "Estoque e CMV", icon: Boxes },
  { label: "Pagamentos", icon: CreditCard },
  { label: "CRM", icon: Users },
  { label: "Logística", icon: Truck },
  { label: "Relatórios", icon: FileText },
  { label: "Configurações", icon: Settings },
] as const;
type Tab = (typeof tabs)[number]["label"];
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Operação — Mercado Pronto" },
      {
        name: "description",
        content: "Painel demonstrativo de pedidos, estoque, CRM e logística.",
      },
      { property: "og:title", content: "Operação Mercado Pronto" },
      { property: "og:description", content: "Gestão completa em uma visão." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});
function Admin() {
  const [tab, setTab] = useState<Tab>("Visão geral");
  return (
    <div className="admin-layout">
      <aside className="admin-side">
        <div className="flex items-center gap-3 px-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary font-black text-primary-foreground">
            M
          </span>
          <span>
            <b className="block">Mercado Pronto</b>
            <small className="text-muted">Central de operação</small>
          </span>
        </div>
        <nav className="mt-7 grid gap-1">
          {tabs.map(({ label, icon: I }) => (
            <button
              key={label}
              onClick={() => setTab(label)}
              className={"admin-nav " + (tab === label ? "active" : "")}
            >
              <I size={18} />
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        <header className="border-b border-border bg-surface-strong px-4 py-4 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] text-muted">SEGUNDA, 21 SET</p>
              <h1 className="text-xl font-extrabold">{tab}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="good">Operação normal</Badge>
              <span className="grid size-10 place-items-center rounded-xl bg-muted-surface font-bold">
                RF
              </span>
            </div>
          </div>
        </header>
        <div className="admin-content">
          {tab === "Visão geral" && <Dashboard />}
          {tab === "Pedidos" && <Orders />}
          {tab === "Catálogo" && <CatalogAdmin />}
          {tab === "Estoque e CMV" && <StockAdmin />}
          {tab === "Pagamentos" && <Payments />}
          {tab === "CRM" && <CRM />}
          {tab === "Logística" && <Logistics />}
          {tab === "Relatórios" && <Reports />}
          {tab === "Configurações" && <Config />}
        </div>
      </section>
      <nav className="admin-mobile-tabs">
        {tabs.map(({ label, icon: I }) => (
          <button
            key={label}
            onClick={() => setTab(label)}
            className={tab === label ? "active" : ""}
          >
            <I size={18} />
            <span>{label.split(" ")[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
function KPI({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <Surface>
      <p className="section-label">{label}</p>
      <b className="mt-2 block text-2xl">{value}</b>
      <p className="mt-2 text-xs text-success">{delta}</p>
    </Surface>
  );
}
function Dashboard() {
  return (
    <>
      <div className="kpi-grid">
        <KPI label="Faturamento" value="R$ 18.420" delta="↑ 12,4% no período" />
        <KPI label="Pedidos" value="286" delta="↑ 8,1% no período" />
        <KPI label="Ticket médio" value="R$ 64,40" delta="↑ R$ 3,20" />
        <KPI label="Margem bruta" value="43,8%" delta="CMV em 56,2%" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Surface>
          <div className="flex justify-between">
            <div>
              <p className="section-label">Faturamento · 7 dias</p>
              <b>R$ 18.420</b>
            </div>
            <TrendingUp className="text-primary" />
          </div>
          <div className="chart-bars mt-6">
            {[35, 48, 42, 68, 55, 82, 73, 92, 74, 100, 84, 110].map((h, i) => (
              <span key={i} style={{ height: h }} />
            ))}
          </div>
        </Surface>
        <Surface>
          <p className="section-label">Agora</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat icon={PackageCheck} n="12" l="em preparo" />
            <Stat icon={Truck} n="7" l="em entrega" />
            <Stat icon={AlertTriangle} n="3" l="pendentes" />
            <Stat icon={CreditCard} n="5" l="pagamentos" />
          </div>
        </Surface>
      </div>
      <Orders compact />
    </>
  );
}
function Stat({ icon: I, n, l }: { icon: typeof Truck; n: string; l: string }) {
  return (
    <div className="rounded-xl bg-muted-surface p-3">
      <I size={18} className="text-primary" />
      <b className="mt-2 block text-xl">{n}</b>
      <small className="text-muted">{l}</small>
    </div>
  );
}
function Orders({ compact = false }: { compact?: boolean }) {
  return (
    <Surface className={compact ? "mt-4" : ""}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-label">{compact ? "Pedidos recentes" : "Fila de pedidos"}</p>
          <b>{orders.length} pedidos em destaque</b>
        </div>
        <div className="search max-w-56">
          <Search size={16} />
          <input placeholder="Cliente ou pedido" />
        </div>
      </div>
      <div className="table-scroll mt-4">
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Valor</th>
              <th>Pagamento</th>
              <th>Status</th>
              <th>Horário</th>
              <th>Prioridade</th>
              <th>Entregador</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="font-mono font-bold">#{o.id}</td>
                <td>{o.customer.name}</td>
                <td>R$ {o.total.toFixed(2).replace(".", ",")}</td>
                <td>
                  {o.payment.method} · {o.payment.status}
                </td>
                <td>
                  <Badge tone={o.status === "Em rota" ? "good" : "warning"}>{o.status}</Badge>
                </td>
                <td>{o.createdAt}</td>
                <td>
                  <b>{o.priorityScore}</b>
                </td>
                <td>{o.driver || "Aguardando"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Surface>
  );
}
function Payments() {
  return (
    <>
      <div className="kpi-grid">
        <KPI label="Aprovados" value="R$ 16.980" delta="92,2% do volume" />
        <KPI label="Aguardando" value="R$ 820" delta="5 pagamentos" />
        <KPI label="Recusados" value="R$ 286" delta="1,6% do volume" />
        <KPI label="Estornos" value="R$ 334" delta="2 no período" />
      </div>
      <Surface className="mt-4">
        <p className="section-label">Transações simuladas</p>
        <div className="mt-4 grid gap-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between border-b border-border pb-3"
            >
              <div>
                <b>
                  #{o.id} · {o.payment.method}
                </b>
                <p className="text-xs text-muted">
                  payment_id e transaction_id serão fornecidos pelo gateway
                </p>
              </div>
              <Badge tone={o.payment.status === "Aprovado" ? "good" : "warning"}>
                {o.payment.status}
              </Badge>
            </div>
          ))}
        </div>
      </Surface>
    </>
  );
}
function CRM() {
  return (
    <>
      <div className="kpi-grid">
        <KPI label="Clientes ativos" value="842" delta="+38 este mês" />
        <KPI label="Recorrentes" value="62%" delta="Meta: 65%" />
        <KPI label="Ticket médio" value="R$ 64,40" delta="↑ R$ 3,20" />
        <KPI label="Frequência" value="2,8/mês" delta="↑ 0,4" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Surface>
          <p className="section-label">Segmentos</p>
          {[
            "Novos clientes",
            "Clientes recorrentes",
            "Clientes inativos",
            "Maior ticket",
            "Maior frequência",
          ].map((x, i) => (
            <div className="mt-3 flex justify-between" key={x}>
              <span>{x}</span>
              <b>{[38, 522, 74, 41, 96][i]}</b>
            </div>
          ))}
        </Surface>
        <Surface>
          <p className="section-label">Clientes em destaque</p>
          {["Marina Costa", "João Mendes", "Lia Souza"].map((x, i) => (
            <div className="mt-3 flex justify-between" key={x}>
              <span>
                <b className="block">{x}</b>
                <small className="text-muted">{[12, 8, 5][i]} pedidos</small>
              </span>
              <span className="text-right">
                <b>R$ {[842, 624, 396][i]}</b>
                <small className="block text-muted">faturamento</small>
              </span>
            </div>
          ))}
        </Surface>
      </div>
    </>
  );
}
function Logistics() {
  return (
    <>
      <div className="kpi-grid">
        <KPI label="Aguardando coleta" value="8" delta="2 com prioridade alta" />
        <KPI label="Em rota" value="7" delta="Tempo médio: 24 min" />
        <KPI label="Disponíveis" value="4" delta="de 9 entregadores" />
        <KPI label="Em atraso" value="2" delta="Ação recomendada" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="mock-map min-h-80">
          <span className="map-road road-a" />
          <span className="map-road road-b" />
          <span className="map-pin start">
            <PackageCheck />
          </span>
          <span className="map-pin rider">
            <Truck />
          </span>
          <span className="map-pin end">
            <Map />
          </span>
        </div>
        <Surface>
          <p className="section-label">Roteirização sugerida</p>
          <p className="mt-2 text-sm text-muted">
            A prioridade considera espera, distância, prazo e agrupamento. Pedidos antigos não
            perdem prioridade apenas por distância.
          </p>
          {orders.map((o) => (
            <div key={o.id} className="mt-4 flex justify-between">
              <span>
                <b>#{o.id}</b>
                <small className="block text-muted">{o.location.address}</small>
              </span>
              <Badge tone={o.priorityScore > 90 ? "warning" : "neutral"}>
                {o.priorityScore} pts
              </Badge>
            </div>
          ))}
        </Surface>
      </div>
      <Surface className="mt-4">
        <p className="section-label">Mapas separados</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-muted-surface p-4">
            <b>Mapa de demanda</b>
            <p className="mt-1 text-sm text-muted">Todos os locais reais de entrega dos pedidos.</p>
          </div>
          <div className="rounded-xl bg-muted-surface p-4">
            <b>Mapa residencial</b>
            <p className="mt-1 text-sm text-muted">
              Somente locais classificados explicitamente como residência.
            </p>
          </div>
        </div>
      </Surface>
    </>
  );
}
function Reports() {
  return (
    <Surface>
      <p className="section-label">Central de relatórios</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          "Vendas",
          "Pedidos",
          "Clientes",
          "Produtos e SKUs",
          "Estoque",
          "CMV e margem",
          "Pagamentos",
          "Entregas",
          "Desempenho dos entregadores",
          "Logística",
          "Mapa de demanda",
        ].map((x) => (
          <button
            key={x}
            className="flex items-center justify-between rounded-xl border border-border bg-surface-strong p-4 text-left font-bold"
          >
            {x}
            <FileText size={17} className="text-primary" />
          </button>
        ))}
      </div>
    </Surface>
  );
}
function Config() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ConfigBox
        icon={PackageCheck}
        title="Catálogo e operação"
        lines={["Nome da operação", "Mensagem inicial", "Taxa e previsão de entrega"]}
      />
      <ConfigBox
        icon={MessageCircle}
        title="WhatsApp Business"
        lines={[
          "Business ID não conectado",
          "Phone Number ID não conectado",
          "Mensagens automáticas editáveis",
        ]}
      />
      <ConfigBox
        icon={Map}
        title="Mapas e rotas"
        lines={[
          "Geocoding não conectado",
          "Routes não conectado",
          "Localização do entregador inativa",
        ]}
      />
      <ConfigBox
        icon={CreditCard}
        title="Pagamentos"
        lines={[
          "Gateway não conectado",
          "PIX, cartão e dinheiro ativos",
          "Webhooks aguardando integração",
        ]}
      />
    </div>
  );
}
function ConfigBox({
  icon: I,
  title,
  lines,
}: {
  icon: typeof Truck;
  title: string;
  lines: string[];
}) {
  return (
    <Surface>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <I />
        </span>
        <b>{title}</b>
      </div>
      <div className="mt-4 grid gap-2">
        {lines.map((x) => (
          <div
            key={x}
            className="flex items-center justify-between rounded-xl bg-muted-surface p-3 text-sm"
          >
            <span>{x}</span>
            <Badge>Mock</Badge>
          </div>
        ))}
      </div>
      <Button variant="secondary" className="mt-4 w-full">
        Configurar interface
      </Button>
    </Surface>
  );
}
