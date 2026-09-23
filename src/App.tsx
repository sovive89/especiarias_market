import { useMemo, useState } from "react";
import {
  AlertTriangle, Bell, CheckCircle2, ChevronRight, CircleUserRound, Clock3,
  Gauge, History, Home, LocateFixed, LogOut, Map, MapPin, Menu, Navigation,
  PackageCheck, Phone, Route as RouteIcon, Settings, Truck, UserRound, X
} from "lucide-react";
import { deliveryService } from "./services/deliveryService";
import { mockApi } from "./services/mockApi";
import { routeService } from "./services/routeService";
import type { Delivery, DeliveryProblemType } from "./types/delivery";

type Screen = "home" | "route" | "deliveries" | "history" | "profile";
type DetailAction = "detail" | "problem" | null;

const problemOptions: { type: DeliveryProblemType; label: string }[] = [
  { type: "CUSTOMER_NOT_FOUND", label: "Cliente não encontrado" },
  { type: "INCORRECT_ADDRESS", label: "Endereço incorreto" },
  { type: "CUSTOMER_UNRESPONSIVE", label: "Cliente não responde" },
  { type: "PAYMENT_PROBLEM", label: "Problema de pagamento" },
  { type: "PRODUCT_PROBLEM", label: "Problema com produto" },
  { type: "ACCIDENT_OR_UNFORESEEN", label: "Acidente / imprevisto" },
  { type: "OTHER", label: "Outro problema" }
];

function statusLabel(status: Delivery["status"]) {
  const labels: Record<Delivery["status"], string> = {
    ASSIGNED: "Aguardando",
    READY: "Pronta",
    IN_ROUTE: "A caminho",
    ARRIVED: "Cheguei",
    DELIVERED_BY_DRIVER: "Entregue",
    CONFIRMED_BY_CUSTOMER: "Confirmada",
    PROBLEM: "Problema",
    CANCELLED: "Cancelada"
  };
  return labels[status];
}

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [deliveries, setDeliveries] = useState<Delivery[]>(mockApi.getDeliveriesSync());
  const [routeStarted, setRouteStarted] = useState(false);
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [detailAction, setDetailAction] = useState<DetailAction>(null);
  const [problemType, setProblemType] = useState<DeliveryProblemType>("CUSTOMER_NOT_FOUND");
  const [problemText, setProblemText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const refresh = () => setDeliveries(mockApi.getDeliveriesSync());

  const pending = deliveries.filter(d => !["DELIVERED_BY_DRIVER", "CONFIRMED_BY_CUSTOMER", "CANCELLED"].includes(d.status));
  const completed = deliveries.filter(d => ["DELIVERED_BY_DRIVER", "CONFIRMED_BY_CUSTOMER"].includes(d.status));
  const problems = deliveries.filter(d => d.status === "PROBLEM");
  const nextDelivery = pending[0];

  const stats = useMemo(() => ({
    total: deliveries.length,
    completed: completed.length,
    pending: pending.length,
    problems: problems.length
  }), [deliveries, completed.length, pending.length, problems.length]);

  const startRoute = async () => {
    await routeService.start();
    setRouteStarted(true);
    if (nextDelivery) {
      await deliveryService.start(nextDelivery.id);
      refresh();
    }
  };

  const action = async (kind: "start" | "arrived" | "complete" | "problem") => {
    if (!selected) return;
    if (kind === "start") await deliveryService.start(selected.id);
    if (kind === "arrived") await deliveryService.arrived(selected.id);
    if (kind === "complete") await deliveryService.complete(selected.id);
    if (kind === "problem") await deliveryService.problem(selected.id);
    refresh();
    setSelected(null);
    setDetailAction(null);
  };

  const openDelivery = (delivery: Delivery) => {
    setSelected(delivery);
    setDetailAction("detail");
  };

  const navigateTo = (delivery: Delivery) => {
    const q = encodeURIComponent(delivery.address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-btn" onClick={() => setMenuOpen(v => !v)} aria-label="Menu"><Menu size={21}/></button>
        <div className="brand">
          <span className="brand-mark"><Truck size={18}/></span>
          <div><strong>Especiarias</strong><small>ENTREGADOR</small></div>
        </div>
        <button className="icon-btn notification" aria-label="Notificações"><Bell size={20}/><i/></button>
      </header>

      {menuOpen && (
        <div className="drawer-backdrop" onClick={() => setMenuOpen(false)}>
          <aside className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-head"><div className="avatar">R</div><div><strong>Ricardo</strong><span>Entregador</span></div><button className="icon-btn" onClick={() => setMenuOpen(false)}><X/></button></div>
            <MenuItem icon={<Home/>} label="Início" active={screen === "home"} onClick={() => {setScreen("home");setMenuOpen(false)}}/>
            <MenuItem icon={<RouteIcon/>} label="Rota do dia" active={screen === "route"} onClick={() => {setScreen("route");setMenuOpen(false)}}/>
            <MenuItem icon={<PackageCheck/>} label="Entregas" active={screen === "deliveries"} onClick={() => {setScreen("deliveries");setMenuOpen(false)}}/>
            <MenuItem icon={<History/>} label="Histórico" active={screen === "history"} onClick={() => {setScreen("history");setMenuOpen(false)}}/>
            <MenuItem icon={<Settings/>} label="Configurações" active={screen === "profile"} onClick={() => {setScreen("profile");setMenuOpen(false)}}/>
            <div className="drawer-bottom"><MenuItem icon={<LogOut/>} label="Sair" onClick={() => setMenuOpen(false)}/></div>
          </aside>
        </div>
      )}

      <main className="content">
        {screen === "home" && (
          <>
            <section className="welcome">
              <div><p className="eyebrow">QUARTA-FEIRA, 23 SET</p><h1>Bom dia, Ricardo.</h1><p className="muted">Sua rota de hoje está pronta.</p></div>
              <div className="online"><span/> ONLINE</div>
            </section>

            <section className="hero-card">
              <div className="hero-top"><div><span className="eyebrow light">ROTA DE HOJE</span><h2>{stats.total} entregas</h2></div><div className="route-icon"><Navigation size={22}/></div></div>
              <div className="progress"><span style={{width: `${stats.total ? stats.completed / stats.total * 100 : 0}%`}}/></div>
              <div className="hero-meta"><span>{stats.completed} concluídas</span><span>{stats.pending} restantes</span></div>
              <button className="primary-btn" onClick={routeStarted ? () => setScreen("route") : startRoute}>{routeStarted ? "Continuar rota" : "Iniciar rota"}<ChevronRight size={19}/></button>
            </section>

            <section className="stats-grid">
              <Stat icon={<Clock3/>} value={stats.pending} label="Pendentes"/>
              <Stat icon={<CheckCircle2/>} value={stats.completed} label="Concluídas"/>
              <Stat icon={<AlertTriangle/>} value={stats.problems} label="Problemas"/>
            </section>

            {nextDelivery && <section className="section"><div className="section-title"><h3>Próxima entrega</h3><button onClick={() => setScreen("deliveries")}>Ver todas</button></div><DeliveryCard delivery={nextDelivery} onClick={() => openDelivery(nextDelivery)} onNavigate={() => navigateTo(nextDelivery)}/></section>}
          </>
        )}

        {screen === "route" && (
          <section>
            <PageTitle title="Rota do dia" subtitle={routeStarted ? "Rota em andamento" : "Rota ainda não iniciada"} icon={<RouteIcon/>}/>
            <div className="map-placeholder"><div className="map-grid"/><div className="map-route"><span/><b/><i/><em/></div><div className="map-pin"><MapPin size={20}/></div><div className="map-label">Brasília · rota atual</div></div>
            <div className="route-summary"><div><strong>{stats.pending}</strong><span>paradas restantes</span></div><div><strong>15,7 km</strong><span>distância estimada</span></div><div><strong>46 min</strong><span>tempo estimado</span></div></div>
            {!routeStarted && <button className="primary-btn full" onClick={startRoute}>Iniciar rota <Navigation size={19}/></button>}
            <div className="section"><div className="section-title"><h3>Sequência</h3><span className="count">{deliveries.length} paradas</span></div>{deliveries.map(d => <RouteRow key={d.id} delivery={d} index={d.sequence} onClick={() => openDelivery(d)}/>)}</div>
          </section>
        )}

        {screen === "deliveries" && (
          <section>
            <PageTitle title="Entregas" subtitle={`${deliveries.length} entregas na rota`} icon={<PackageCheck/>}/>
            <div className="filter-row"><button className="filter active">Todas</button><button className="filter">Pendentes</button><button className="filter">Concluídas</button></div>
            <div className="delivery-list">{deliveries.map(d => <DeliveryCard key={d.id} delivery={d} onClick={() => openDelivery(d)} onNavigate={() => navigateTo(d)}/>)}</div>
          </section>
        )}

        {screen === "history" && (
          <section>
            <PageTitle title="Histórico" subtitle="Atividade recente" icon={<History/>}/>
            <div className="history-card"><HistoryRow title="Rota iniciada" time="Hoje, 09:12" icon={<Navigation/>}/><HistoryRow title="Entrega DEL-001 concluída" time="Hoje, 09:31" icon={<CheckCircle2/>}/><HistoryRow title="Entrega DEL-002 em andamento" time="Hoje, 09:42" icon={<Truck/>}/></div>
            <div className="empty-note"><Gauge size={24}/><span>O histórico completo ficará disponível quando o backend estiver conectado.</span></div>
          </section>
        )}

        {screen === "profile" && (
          <section>
            <PageTitle title="Perfil" subtitle="Configurações do entregador" icon={<UserRound/>}/>
            <div className="profile-card"><div className="profile-avatar">R</div><div><h2>Ricardo</h2><p>Entregador · ID DRV-001</p></div><span className="badge success">Ativo</span></div>
            <div className="settings-list"><Setting icon={<LocateFixed/>} title="Localização" value="Permitida"/><Setting icon={<Bell/>} title="Notificações" value="Ativadas"/><Setting icon={<CircleUserRound/>} title="Conta" value="DRV-001"/></div>
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        <NavButton icon={<Home/>} label="Início" active={screen === "home"} onClick={() => setScreen("home")}/>
        <NavButton icon={<RouteIcon/>} label="Rota" active={screen === "route"} onClick={() => setScreen("route")}/>
        <NavButton icon={<PackageCheck/>} label="Entregas" active={screen === "deliveries"} onClick={() => setScreen("deliveries")}/>
        <NavButton icon={<History/>} label="Histórico" active={screen === "history"} onClick={() => setScreen("history")}/>
        <NavButton icon={<UserRound/>} label="Perfil" active={screen === "profile"} onClick={() => setScreen("profile")}/>
      </nav>

      {selected && detailAction === "detail" && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"/><div className="sheet-head"><div><span className="eyebrow">ENTREGA #{selected.sequence.toString().padStart(2,"0")}</span><h2>{selected.customerName}</h2></div><button className="icon-btn" onClick={() => setSelected(null)}><X/></button></div>
            <div className="status-line"><span className={`status-dot ${selected.status.toLowerCase()}`}/>{statusLabel(selected.status)}</div>
            <div className="address-box"><MapPin size={21}/><div><strong>{selected.address}</strong><span>{selected.complement}</span>{selected.notes && <small>{selected.notes}</small>}</div></div>
            <div className="quick-actions"><button onClick={() => window.open(`tel:${selected.customerPhone}`)}><Phone/>Ligar</button><button onClick={() => navigateTo(selected)}><Map/>Navegar</button></div>
            <div className="delivery-actions">
              {selected.status === "ASSIGNED" || selected.status === "READY" ? <button className="primary-btn full" onClick={() => action("start")}>Iniciar entrega <Navigation/></button> : null}
              {selected.status === "IN_ROUTE" ? <button className="primary-btn full" onClick={() => action("arrived")}>Marcar chegada <MapPin/></button> : null}
              {selected.status === "ARRIVED" ? <button className="primary-btn full" onClick={() => action("complete")}>Confirmar entrega <CheckCircle2/></button> : null}
              {!["DELIVERED_BY_DRIVER","CONFIRMED_BY_CUSTOMER","CANCELLED","PROBLEM"].includes(selected.status) && <button className="danger-outline full" onClick={() => setDetailAction("problem")}>Registrar problema <AlertTriangle/></button>}
            </div>
          </div>
        </div>
      )}

      {selected && detailAction === "problem" && (
        <div className="modal-backdrop" onClick={() => setDetailAction("detail")}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"/><div className="sheet-head"><div><span className="eyebrow">OCORRÊNCIA</span><h2>Registrar problema</h2></div><button className="icon-btn" onClick={() => setDetailAction("detail")}><X/></button></div>
            <div className="problem-grid">{problemOptions.map(o => <button key={o.type} className={problemType === o.type ? "problem-option active" : "problem-option"} onClick={() => setProblemType(o.type)}>{o.label}</button>)}</div>
            <textarea value={problemText} onChange={e => setProblemText(e.target.value)} placeholder="Descreva o que aconteceu (opcional)"/>
            <button className="primary-btn full" onClick={() => action("problem")}>Salvar ocorrência <AlertTriangle/></button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({icon,label,active,onClick}:{icon:React.ReactNode;label:string;active?:boolean;onClick:()=>void}) {
  return <button className={active ? "drawer-item active" : "drawer-item"} onClick={onClick}>{icon}<span>{label}</span><ChevronRight size={16}/></button>;
}
function NavButton({icon,label,active,onClick}:{icon:React.ReactNode;label:string;active:boolean;onClick:()=>void}) {
  return <button className={active ? "nav-item active" : "nav-item"} onClick={onClick}>{icon}<span>{label}</span></button>;
}
function Stat({icon,value,label}:{icon:React.ReactNode;value:number;label:string}) { return <div className="stat"><span>{icon}</span><strong>{value}</strong><small>{label}</small></div>; }
function PageTitle({title,subtitle,icon}:{title:string;subtitle:string;icon:React.ReactNode}) { return <div className="page-title"><div className="page-icon">{icon}</div><div><h1>{title}</h1><p>{subtitle}</p></div></div>; }
function DeliveryCard({delivery,onClick,onNavigate}:{delivery:Delivery;onClick:()=>void;onNavigate:()=>void}) {
  return <article className="delivery-card" onClick={onClick}><div className="delivery-number">{delivery.sequence}</div><div className="delivery-main"><div className="delivery-head"><strong>{delivery.customerName}</strong><span className={`status-pill ${delivery.status.toLowerCase()}`}>{statusLabel(delivery.status)}</span></div><p><MapPin size={14}/>{delivery.address}</p><div className="delivery-meta"><span><Clock3 size={13}/>{delivery.etaMinutes ?? "--"} min</span><span>{delivery.distanceKm ?? "--"} km</span></div></div><button className="mini-nav" onClick={e => {e.stopPropagation();onNavigate()}}><Navigation size={17}/></button></article>;
}
function RouteRow({delivery,index,onClick}:{delivery:Delivery;index:number;onClick:()=>void}) { return <button className="route-row" onClick={onClick}><span className="route-index">{index}</span><span className="route-info"><strong>{delivery.customerName}</strong><small>{delivery.address}</small></span><span className={`route-status ${delivery.status.toLowerCase()}`}>{statusLabel(delivery.status)}</span><ChevronRight size={17}/></button>; }
function HistoryRow({title,time,icon}:{title:string;time:string;icon:React.ReactNode}) { return <div className="history-row"><span>{icon}</span><div><strong>{title}</strong><small>{time}</small></div></div>; }
function Setting({icon,title,value}:{icon:React.ReactNode;title:string;value:string}) { return <div className="setting"><span>{icon}</span><div><strong>{title}</strong><small>{value}</small></div><ChevronRight size={18}/></div>; }

export default App;
