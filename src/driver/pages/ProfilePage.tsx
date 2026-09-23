import {
  Bell,
  ChevronRight,
  CircleUserRound,
  LocateFixed,
  LogOut,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, PageHeader, Surface } from "../components/ui";
import { useDriver } from "../context/DriverContext";

function SettingRow({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
}) {
  return (
    <li className="setting">
      <span className="setting__icon">
        <Icon size={18} />
      </span>
      <span className="setting__text">
        <strong>{title}</strong>
        <small className="muted">{value}</small>
      </span>
      <ChevronRight size={18} className="muted" aria-hidden />
    </li>
  );
}

export function ProfilePage() {
  const { driver, available, logout } = useDriver();
  if (!driver) return null;

  return (
    <>
      <PageHeader eyebrow="Perfil" title="Sua conta" />

      <Surface className="profile">
        <span className="profile__avatar">{driver.name.charAt(0)}</span>
        <div>
          <strong>{driver.name}</strong>
          <p className="mono muted">{driver.id.toUpperCase()}</p>
        </div>
        <Badge tone={available ? "good" : "neutral"}>{available ? "Ativo" : "Pausado"}</Badge>
      </Surface>

      <Surface as="section" className="settings">
        <ul>
          <SettingRow icon={Phone} title="Telefone" value={driver.phone} />
          <SettingRow icon={LocateFixed} title="Localização" value="Permitida" />
          <SettingRow icon={Bell} title="Notificações" value="Ativadas" />
          <SettingRow icon={CircleUserRound} title="Conta" value={driver.id} />
        </ul>
      </Surface>

      <Button variant="ghost" block className="logout" onClick={logout}>
        <LogOut size={18} /> Sair
      </Button>
    </>
  );
}
