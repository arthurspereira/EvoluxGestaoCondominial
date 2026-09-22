import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DiaCalendario } from "@/lib/calendario";
import type { Compromisso, ManutencaoDetalhada } from "@/types/database";

const CORES_STATUS: Record<ManutencaoDetalhada["status"], string> = {
  pendente: "bg-status-pendente",
  em_andamento: "bg-status-andamento",
  resolvida: "bg-status-resolvida",
};

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

interface GradeCalendarioProps {
  dias: DiaCalendario[];
  manutencoesPorDia: Map<string, ManutencaoDetalhada[]>;
  compromissosPorDia: Map<string, Compromisso[]>;
}

// Cada dia mostra até 3 itens (manutenções primeiro, depois
// compromissos) e um "+N" quando há mais — grade densa cabe mal em tela
// pequena, então no mobile o texto reduz e o scroll é dentro da célula.
export function GradeCalendario({ dias, manutencoesPorDia, compromissosPorDia }: GradeCalendarioProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-secondary/60 text-center text-xs font-medium uppercase text-muted-foreground">
        {DIAS_SEMANA.map((dia) => (
          <div key={dia} className="py-2">
            {dia}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {dias.map((dia) => {
          const manutencoes = manutencoesPorDia.get(dia.iso) ?? [];
          const compromissos = compromissosPorDia.get(dia.iso) ?? [];
          const itens = [
            ...manutencoes.map((m) => ({ tipo: "manutencao" as const, item: m })),
            ...compromissos.map((c) => ({ tipo: "compromisso" as const, item: c })),
          ];
          const visiveis = itens.slice(0, 3);
          const restantes = itens.length - visiveis.length;

          return (
            <div
              key={dia.iso}
              className={cn(
                "min-h-[84px] border-b border-r border-border p-1.5 last:border-r-0",
                !dia.noMesAtual && "bg-secondary/20"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  dia.hoje && "bg-primary text-primary-foreground font-semibold",
                  !dia.noMesAtual && "text-muted-foreground/60"
                )}
              >
                {dia.data.getDate()}
              </span>

              <div className="mt-1 space-y-0.5">
                {visiveis.map((entrada) =>
                  entrada.tipo === "manutencao" ? (
                    <Link
                      key={entrada.item.id}
                      href={`/manutencoes/${entrada.item.id}`}
                      className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] hover:bg-secondary"
                      title={`${entrada.item.cliente_nome} — ${entrada.item.local_descricao}`}
                    >
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", CORES_STATUS[entrada.item.status])} />
                      <span className="truncate">{entrada.item.local_descricao}</span>
                    </Link>
                  ) : (
                    <p
                      key={entrada.item.id}
                      className="truncate rounded bg-secondary px-1 py-0.5 text-[11px] text-secondary-foreground"
                      title={entrada.item.titulo}
                    >
                      {entrada.item.horario?.slice(0, 5)} {entrada.item.titulo}
                    </p>
                  )
                )}
                {restantes > 0 && (
                  <p className="px-1 text-[11px] text-muted-foreground">+{restantes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
