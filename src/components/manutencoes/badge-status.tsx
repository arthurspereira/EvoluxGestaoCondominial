import { cn } from "@/lib/utils";
import type { StatusManutencao } from "@/types/database";

const CONFIGURACAO: Record<StatusManutencao, { rotulo: string; classe: string }> = {
  pendente: { rotulo: "Pendente", classe: "bg-status-pendente/10 text-status-pendente" },
  em_andamento: { rotulo: "Em andamento", classe: "bg-status-andamento/10 text-status-andamento" },
  resolvida: { rotulo: "Resolvida", classe: "bg-status-resolvida/10 text-status-resolvida" },
};

export function BadgeStatus({ status }: { status: StatusManutencao }) {
  const { rotulo, classe } = CONFIGURACAO[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", classe)}>
      {rotulo}
    </span>
  );
}
