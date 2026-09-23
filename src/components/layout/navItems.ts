import { History, Home, PackageCheck, Route, UserRound, type LucideIcon } from "lucide-react";

export const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Início", icon: Home },
  { to: "/rota", label: "Rota", icon: Route },
  { to: "/entregas", label: "Entregas", icon: PackageCheck },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/perfil", label: "Perfil", icon: UserRound }
];
