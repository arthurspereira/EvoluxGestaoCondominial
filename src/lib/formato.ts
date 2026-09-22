import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatarData(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });
}

export function formatarDataHora(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatarRelativo(iso: string) {
  return formatDistanceToNow(new Date(iso), { locale: ptBR, addSuffix: true });
}

export const RESUMO_STATUS: Record<
  "pendente" | "em_andamento" | "resolvida",
  { rotulo: string; cor: string }
> = {
  pendente: { rotulo: "Pendente", cor: "status-pendente" },
  em_andamento: { rotulo: "Em andamento", cor: "status-andamento" },
  resolvida: { rotulo: "Resolvida", cor: "status-resolvida" },
};
