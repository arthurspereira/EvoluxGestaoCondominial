import Link from "next/link";
import { subDays, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { criarClienteServidor } from "@/lib/supabase/server";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { GraficoStatus } from "@/components/dashboard/grafico-status";
import { GraficoTipos } from "@/components/dashboard/grafico-tipos";
import { GraficoSemanal } from "@/components/dashboard/grafico-semanal";
import { GraficoClientes } from "@/components/dashboard/grafico-clientes";
import type { DadoStatus } from "@/components/dashboard/grafico-status";
import type { DadoTipo } from "@/components/dashboard/grafico-tipos";
import type { DadoDia } from "@/components/dashboard/grafico-semanal";
import type { DadoCliente } from "@/components/dashboard/grafico-clientes";
import type { ManutencaoDetalhada } from "@/types/database";

// Abreviações dos dias da semana para o gráfico semanal
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default async function PaginaDashboard() {
  const supabase = await criarClienteServidor();

  // ── Indicadores numéricos (existentes) ──────────────────────────────
  const [
    { count: total },
    { count: pendentes },
    { count: andamento },
    { count: resolvidas },
  ] = await Promise.all([
    supabase.from("manutencoes").select("*", { count: "exact", head: true }),
    supabase.from("manutencoes").select("*", { count: "exact", head: true }).eq("status", "pendente"),
    supabase.from("manutencoes").select("*", { count: "exact", head: true }).eq("status", "em_andamento"),
    supabase.from("manutencoes").select("*", { count: "exact", head: true }).eq("status", "resolvida"),
  ]);

  const indicadores = [
    { rotulo: "Total de manutenções", valor: total ?? 0, href: "/manutencoes" },
    { rotulo: "Pendentes", valor: pendentes ?? 0, href: "/manutencoes?status=pendente" },
    { rotulo: "Em andamento", valor: andamento ?? 0, href: "/manutencoes?status=em_andamento" },
    { rotulo: "Resolvidas", valor: resolvidas ?? 0, href: "/manutencoes?status=resolvida" },
  ];

  // ── Dados para gráficos (paralelo) ──────────────────────────────────
  const hoje = new Date();
  const seteDiasAtras = format(subDays(hoje, 6), "yyyy-MM-dd");
  const hojeStr = format(hoje, "yyyy-MM-dd");

  const [
    { data: dadosView },
    { data: tiposDb },
    { data: clientesDb },
  ] = await Promise.all([
    // Busca manutenções dos últimos 7 dias para o gráfico semanal
    supabase
      .from("manutencoes_detalhadas")
      .select("status, tipo_nome, tipo_cor, cliente_nome, data_calendario, resolvido_em")
      .gte("data_calendario", seteDiasAtras)
      .lte("data_calendario", hojeStr)
      .returns<
        Pick<
          ManutencaoDetalhada,
          "status" | "tipo_nome" | "tipo_cor" | "cliente_nome" | "data_calendario" | "resolvido_em"
        >[]
      >(),
    // Todos os tipos ativos (para incluir tipos sem manutenções no período)
    supabase
      .from("tipos_manutencao")
      .select("nome, cor")
      .eq("ativo", true)
      .order("ordem"),
    // Todos os clientes ativos
    supabase
      .from("clientes")
      .select("nome")
      .eq("ativo", true),
  ]);

  // ── Gráfico 1: por status ────────────────────────────────────────────
  // Conta a partir dos indicadores já buscados (sem query extra)
  const dadosStatus: DadoStatus[] = [
    { status: "pendente", total: pendentes ?? 0 },
    { status: "em_andamento", total: andamento ?? 0 },
    { status: "resolvida", total: resolvidas ?? 0 },
  ];

  // ── Gráfico 2: por tipo ──────────────────────────────────────────────
  // Agrega a partir dos dados da view (últimos 7 dias) + todos os tipos
  const contagemPorTipo = new Map<string, { cor: string; total: number }>();

  // Inicializa com todos os tipos (inclusive os sem ocorrências)
  for (const t of tiposDb ?? []) {
    contagemPorTipo.set(t.nome, { cor: t.cor, total: 0 });
  }
  for (const m of dadosView ?? []) {
    const atual = contagemPorTipo.get(m.tipo_nome);
    if (atual) {
      contagemPorTipo.set(m.tipo_nome, { ...atual, total: atual.total + 1 });
    }
  }
  const dadosTipos: DadoTipo[] = Array.from(contagemPorTipo.entries()).map(
    ([tipo_nome, { cor, total }]) => ({ tipo_nome, tipo_cor: cor, total })
  );

  // ── Gráfico 3: semanal (registradas × resolvidas) ───────────────────
  // Monta os últimos 7 dias como chave yyyy-MM-dd
  const diasSemana: DadoDia[] = Array.from({ length: 7 }, (_, i) => {
    const data = subDays(hoje, 6 - i);
    const chave = format(data, "yyyy-MM-dd");
    const diaSemana = DIAS_SEMANA[data.getDay()];
    const diaNum = format(data, "dd/MM");
    return {
      dia: `${diaSemana} ${diaNum}`,
      _chave: chave,
      registradas: 0,
      resolvidas: 0,
    } as DadoDia & { _chave: string };
  });

  for (const m of dadosView ?? []) {
    const diaRegistro = m.data_calendario; // yyyy-MM-dd
    const entrada = diasSemana.find((d) => (d as any)._chave === diaRegistro);
    if (entrada) entrada.registradas += 1;

    if (m.resolvido_em) {
      const diaResolucao = format(new Date(m.resolvido_em), "yyyy-MM-dd");
      const entradaR = diasSemana.find((d) => (d as any)._chave === diaResolucao);
      if (entradaR) entradaR.resolvidas += 1;
    }
  }

  // Remove a chave interna antes de passar para o componente
  const dadosSemanal: DadoDia[] = diasSemana.map(({ dia, registradas, resolvidas }) => ({
    dia,
    registradas,
    resolvidas,
  }));

  // ── Gráfico 4: por cliente ───────────────────────────────────────────
  const contagemPorCliente = new Map<string, number>();
  for (const c of clientesDb ?? []) {
    contagemPorCliente.set(c.nome, 0);
  }
  for (const m of dadosView ?? []) {
    contagemPorCliente.set(m.cliente_nome, (contagemPorCliente.get(m.cliente_nome) ?? 0) + 1);
  }
  const dadosClientes: DadoCliente[] = Array.from(contagemPorCliente.entries())
    .map(([cliente_nome, total]) => ({ cliente_nome, total }))
    .sort((a, b) => b.total - a.total);

  // ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {/* Indicadores numéricos — inalterados */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {indicadores.map((indicador) => (
          <Link key={indicador.rotulo} href={indicador.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <CardTitle>{indicador.rotulo}</CardTitle>
                <p className="mt-1 text-2xl font-semibold">{indicador.valor}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Gráficos — grid 2 colunas desktop, 1 coluna mobile */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <GraficoStatus dados={dadosStatus} />
        <GraficoTipos dados={dadosTipos} />
        <GraficoSemanal dados={dadosSemanal} />
        <GraficoClientes dados={dadosClientes} />
      </div>
    </div>
  );
}
