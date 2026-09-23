const dayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "short" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** "quarta-feira, 23 de set." — sempre a data de hoje, nada fixo no código. */
export const formatToday = (date = new Date()) => dayFormatter.format(date);

export const formatTime = (iso: string) => timeFormatter.format(new Date(iso));

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export const formatKm = (km: number) => `${km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;

export const pad2 = (n: number) => n.toString().padStart(2, "0");
