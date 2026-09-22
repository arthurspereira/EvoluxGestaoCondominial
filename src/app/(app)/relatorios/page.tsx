import { endOfISOWeek, format, startOfISOWeek } from "date-fns";
import { FileText } from "lucide-react";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Cliente } from "@/types/database";

// Formulário HTML puro com method="get": o próprio navegador monta a
// URL com os parâmetros e navega para /api/relatorio, que responde com
// Content-Disposition: attachment — o download começa sem precisar de
// nenhum JavaScript no cliente, o que também funciona bem no celular.
export default async function PaginaRelatorios() {
  const supabase = await criarClienteServidor();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .eq("ativo", true)
    .order("nome")
    .returns<Cliente[]>();

  const hoje = new Date();
  const inicioSemana = format(startOfISOWeek(hoje), "yyyy-MM-dd");
  const fimSemana = format(endOfISOWeek(hoje), "yyyy-MM-dd");

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Gere o boletim em PDF de um período para enviar ao síndico.
        </p>
      </div>

      <form
        method="get"
        action="/api/relatorio"
        target="_blank"
        className="space-y-4 rounded-lg border border-border p-4"
      >
        <div className="space-y-1.5">
          <label htmlFor="cliente" className="text-sm font-medium">
            Cliente
          </label>
          <select
            id="cliente"
            name="cliente"
            required
            className="toque-confortavel flex w-full rounded-md border border-input bg-background px-3 py-2 text-base"
          >
            {(clientes ?? []).map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="de" className="text-sm font-medium">
              De
            </label>
            <input
              id="de"
              name="de"
              type="date"
              required
              defaultValue={inicioSemana}
              className="toque-confortavel w-full rounded-md border border-input bg-background px-3 py-2 text-base"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ate" className="text-sm font-medium">
              Até
            </label>
            <input
              id="ate"
              name="ate"
              type="date"
              required
              defaultValue={fimSemana}
              className="toque-confortavel w-full rounded-md border border-input bg-background px-3 py-2 text-base"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Vem preenchido com a semana atual (segunda a domingo) — ajuste as
          datas se precisar de outro período.
        </p>

        <button
          type="submit"
          className="toque-confortavel flex w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <FileText className="h-4 w-4" />
          Gerar PDF
        </button>
      </form>

      {(!clientes || clientes.length === 0) && (
        <p className="text-sm text-muted-foreground">
          Cadastre um cliente antes de gerar um relatório.
        </p>
      )}
    </div>
  );
}
