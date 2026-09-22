"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/form-fields";
import { schemaCliente, type ClienteInput } from "@/lib/schemas/cliente";
import { criarClienteNavegador } from "@/lib/supabase/client";

// Estrutura aberta para novos clientes (briefing, seção 13) — hoje só
// existe "Mansão Pituba Imperial", cadastrada direto na migration.
export function FormCliente() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClienteInput>({ resolver: zodResolver(schemaCliente) });

  async function salvar(dados: ClienteInput) {
    setEnviando(true);
    setErro(null);

    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("clientes").insert({
      nome: dados.nome,
      endereco: dados.endereco || null,
      sindico: dados.sindico || null,
      observacoes: dados.observacoes || null,
    });

    if (error) {
      setErro(
        error.code === "23505"
          ? "Já existe um cliente com esse nome."
          : "Não foi possível salvar o cliente."
      );
      setEnviando(false);
      return;
    }

    reset();
    setAberto(false);
    setEnviando(false);
    router.refresh();
  }

  if (!aberto) {
    return (
      <Button size="sm" onClick={() => setAberto(true)}>
        <Plus className="h-4 w-4" />
        Novo cliente
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit(salvar)} className="space-y-3 rounded-lg border border-border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome do condomínio</Label>
        <Input id="nome" placeholder="Ex.: Mansão Pituba Imperial" {...register("nome")} />
        {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="endereco">Endereço (opcional)</Label>
        <Input id="endereco" {...register("endereco")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sindico">Síndico (opcional)</Label>
        <Input id="sindico" placeholder="Nome de contato para os relatórios" {...register("sindico")} />
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={enviando}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
