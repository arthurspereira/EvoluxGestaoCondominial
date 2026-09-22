import { criarClienteServidor } from "@/lib/supabase/server";
import { CardCliente } from "@/components/clientes/card-cliente";
import { FormCliente } from "@/components/clientes/form-cliente";
import type { Cliente } from "@/types/database";

export default async function PaginaClientes() {
  const supabase = await criarClienteServidor();

  const [{ data: clientes }, { data: manutencoes }] = await Promise.all([
    supabase
      .from("clientes")
      .select("*")
      .eq("ativo", true)
      .order("nome"),
    supabase.from("manutencoes").select("cliente_id"),
  ]);

  const contagemPorCliente = new Map<string, number>();
  for (const manutencao of manutencoes ?? []) {
    contagemPorCliente.set(
      manutencao.cliente_id,
      (contagemPorCliente.get(manutencao.cliente_id) ?? 0) + 1
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <FormCliente />
      </div>

      {!clientes || clientes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum cliente cadastrado ainda.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {clientes.map((cliente) => (
            <CardCliente
              key={cliente.id}
              cliente={cliente}
              totalManutencoes={contagemPorCliente.get(cliente.id) ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
