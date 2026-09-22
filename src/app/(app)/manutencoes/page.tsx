import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CardManutencao } from "@/components/manutencoes/card-manutencao";
import { TabelaManutencoes } from "@/components/manutencoes/tabela-manutencoes";
import { FiltrosManutencoes } from "@/components/manutencoes/filtros-manutencoes";
import type { ManutencaoDetalhada, StatusManutencao } from "@/types/database";

interface PaginaProps {
  searchParams: Promise<{
    cliente?: string;
    tipo?: string;
    status?: string;
    de?: string;
    ate?: string;
    busca?: string;
  }>;
}

// Filtros do briefing (seção 8): cliente, local (via busca textual), tipo,
// status e período. O período usa data_calendario — a mesma coluna gerada
// que o calendário vai usar — para as duas telas ficarem consistentes.
export default async function PaginaManutencoes({ searchParams }: PaginaProps) {
  const filtros = await searchParams;
  const supabase = await criarClienteServidor();

  let consulta = supabase.from("manutencoes_detalhadas").select("*");

  if (filtros.cliente) consulta = consulta.eq("cliente_id", filtros.cliente);
  if (filtros.tipo) consulta = consulta.eq("tipo_id", filtros.tipo);
  if (filtros.status) consulta = consulta.eq("status", filtros.status as StatusManutencao);
  if (filtros.de) consulta = consulta.gte("data_calendario", filtros.de);
  if (filtros.ate) consulta = consulta.lte("data_calendario", filtros.ate);
  if (filtros.busca) {
    consulta = consulta.or(
      `descricao.ilike.%${filtros.busca}%,local_descricao.ilike.%${filtros.busca}%`
    );
  }

  const [{ data: manutencoes }, { data: clientes }, { data: tipos }] = await Promise.all([
    consulta
      .order("registrado_em", { ascending: false })
      .returns<ManutencaoDetalhada[]>(),
    supabase.from("clientes").select("*").eq("ativo", true).order("nome"),
    supabase.from("tipos_manutencao").select("*").eq("ativo", true).order("ordem"),
  ]);

  const lista = manutencoes ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Manutenções</h1>
        <Link
          href="/manutencoes/nova"
          className="hidden items-center gap-1 text-sm font-medium text-primary md:flex"
        >
          <PlusCircle className="h-4 w-4" />
          Nova
        </Link>
      </div>

      <FiltrosManutencoes clientes={clientes ?? []} tipos={tipos ?? []} />

      <div className="grid gap-3 md:hidden">
        {lista.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma manutenção encontrada com esses filtros.
          </p>
        ) : (
          lista.map((manutencao) => (
            <CardManutencao key={manutencao.id} manutencao={manutencao} />
          ))
        )}
      </div>

      <TabelaManutencoes dados={lista} />
    </div>
  );
}
