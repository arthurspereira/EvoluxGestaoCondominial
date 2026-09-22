import { criarClienteServidor } from "@/lib/supabase/server";
import { FormManutencao } from "@/components/manutencoes/form-manutencao";

export default async function PaginaNovaManutencao() {
  const supabase = await criarClienteServidor();

  const [{ data: clientes }, { data: locais }, { data: tipos }, { data: sessao }] =
    await Promise.all([
      supabase.from("clientes").select("*").eq("ativo", true).order("nome"),
      supabase.from("locais").select("*").eq("ativo", true).order("nome"),
      supabase.from("tipos_manutencao").select("*").eq("ativo", true).order("ordem"),
      supabase.auth.getUser(),
    ]);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Nova manutenção</h1>
        <p className="text-sm text-muted-foreground">
          Registre a vistoria — data e hora são preenchidas automaticamente.
        </p>
      </div>

      <FormManutencao
        clientes={clientes ?? []}
        locais={locais ?? []}
        tipos={tipos ?? []}
        usuarioId={sessao.user!.id}
      />
    </div>
  );
}
