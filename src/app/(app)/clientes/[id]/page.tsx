import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, MapPin, User } from "lucide-react";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CardManutencao } from "@/components/manutencoes/card-manutencao";
import { TabelaManutencoes } from "@/components/manutencoes/tabela-manutencoes";
import { FormLocal } from "@/components/clientes/form-local";
import type { Cliente, Local, ManutencaoDetalhada } from "@/types/database";

interface PaginaProps {
  params: Promise<{ id: string }>;
}

export default async function PaginaDetalheCliente({ params }: PaginaProps) {
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const [{ data: cliente }, { data: locais }, { data: manutencoes }] = await Promise.all([
    supabase
      .from("clientes")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("locais")
      .select("*")
      .eq("cliente_id", id)
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("manutencoes_detalhadas")
      .select("*")
      .eq("cliente_id", id)
      .order("registrado_em", { ascending: false })
      .returns<ManutencaoDetalhada[]>(),
  ]);

  if (!cliente) notFound();

  const lista = manutencoes ?? [];

  return (
    <div className="space-y-5">
      <div>
        <p className="flex items-center gap-2 text-xl font-semibold">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          {cliente.nome}
        </p>
        {cliente.endereco && <p className="text-sm text-muted-foreground">{cliente.endereco}</p>}
        {cliente.sindico && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            Síndico: {cliente.sindico}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-border p-4">
        <p className="mb-2 flex items-center gap-1 text-sm font-medium">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          Locais cadastrados
        </p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(locais ?? []).map((local) => (
            <span key={local.id} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
              {local.nome}
            </span>
          ))}
          {(!locais || locais.length === 0) && (
            <span className="text-sm text-muted-foreground">Nenhum local cadastrado ainda.</span>
          )}
        </div>
        <FormLocal clienteId={cliente.id} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Histórico de manutenções ({lista.length})
          </h2>
          <Link
            href="/manutencoes/nova"
            className="text-sm font-medium text-primary hover:underline"
          >
            Nova manutenção
          </Link>
        </div>

        {lista.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma manutenção registrada para este cliente ainda.
          </p>
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {lista.map((manutencao) => (
                <CardManutencao key={manutencao.id} manutencao={manutencao} />
              ))}
            </div>
            <TabelaManutencoes dados={lista} />
          </>
        )}
      </div>
    </div>
  );
}
