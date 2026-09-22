import { criarClienteServidor } from "@/lib/supabase/server";
import { montarGradeMes, referenciaDoParametro } from "@/lib/calendario";
import { NavegacaoMes } from "@/components/calendario/navegacao-mes";
import { GradeCalendario } from "@/components/calendario/grade-calendario";
import { FormCompromisso } from "@/components/calendario/form-compromisso";
import type { Compromisso, ManutencaoDetalhada } from "@/types/database";

interface PaginaProps {
  searchParams: Promise<{ mes?: string; ano?: string }>;
}

export default async function PaginaCalendario({ searchParams }: PaginaProps) {
  const { mes, ano } = await searchParams;
  const referencia = referenciaDoParametro(mes, ano);
  const dias = montarGradeMes(referencia);

  const primeiroDia = dias[0].iso;
  const ultimoDia = dias[dias.length - 1].iso;

  const supabase = await criarClienteServidor();
  const [{ data: manutencoes }, { data: compromissos }, { data: sessao }] = await Promise.all([
    // data_calendario: mesma coluna gerada usada pelos filtros da
    // listagem — usa a data prevista quando existe, senão a de registro.
    supabase
      .from("manutencoes_detalhadas")
      .select("*")
      .gte("data_calendario", primeiroDia)
      .lte("data_calendario", ultimoDia)
      .returns<ManutencaoDetalhada[]>(),
    supabase
      .from("compromissos")
      .select("*")
      .gte("data", primeiroDia)
      .lte("data", ultimoDia)
      .order("horario")
      .returns<Compromisso[]>(),
    supabase.auth.getUser(),
  ]);

  const manutencoesPorDia = new Map<string, ManutencaoDetalhada[]>();
  for (const manutencao of manutencoes ?? []) {
    const lista = manutencoesPorDia.get(manutencao.data_calendario) ?? [];
    lista.push(manutencao);
    manutencoesPorDia.set(manutencao.data_calendario, lista);
  }

  const compromissosPorDia = new Map<string, Compromisso[]>();
  for (const compromisso of compromissos ?? []) {
    const lista = compromissosPorDia.get(compromisso.data) ?? [];
    lista.push(compromisso);
    compromissosPorDia.set(compromisso.data, lista);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Calendário</h1>
        <FormCompromisso usuarioId={sessao.user!.id} />
      </div>

      <NavegacaoMes referencia={referencia} />
      <GradeCalendario
        dias={dias}
        manutencoesPorDia={manutencoesPorDia}
        compromissosPorDia={compromissosPorDia}
      />

      <p className="text-xs text-muted-foreground">
        <span className="mr-3">
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-status-pendente" /> Pendente
        </span>
        <span className="mr-3">
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-status-andamento" /> Em andamento
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-status-resolvida" /> Resolvida
        </span>
      </p>
    </div>
  );
}
