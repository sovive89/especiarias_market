import { History, Home, PackageCheck, Route, UserRound } from "lucide-react";

/* "as const" faz o TypeScript conhecer cada caminho exato, e o roteador confere se a rota existe. */
export const NAV_ITEMS = [
  { to: "/entregador", label: "Início", icon: Home },
  { to: "/entregador/rota", label: "Rota", icon: Route },
  { to: "/entregador/entregas", label: "Entregas", icon: PackageCheck },
  { to: "/entregador/historico", label: "Histórico", icon: History },
  { to: "/entregador/perfil", label: "Perfil", icon: UserRound },
] as const;
