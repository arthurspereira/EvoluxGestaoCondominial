"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { schemaCompromisso, type CompromissoInput } from "@/lib/schemas/manutencao";
import { criarClienteNavegador } from "@/lib/supabase/client";

interface FormCompromissoProps {
  usuarioId: string;
  dataInicial?: string; // yyyy-MM-dd — vem do dia clicado na grade
}

// Cadastro deliberadamente mínimo (briefing, seção 10): só título, data
// e horário. Fica escondido atrás de um botão para não competir com o
// calendário na tela por padrão.
export function FormCompromisso({ usuarioId, dataInicial }: FormCompromissoProps) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompromissoInput>({
    resolver: zodResolver(schemaCompromisso),
    defaultValues: {
      cliente_id: null,
      titulo: "",
      data: dataInicial ?? "",
      horario: "",
    },
  });

  async function salvar(dados: CompromissoInput) {
    setEnviando(true);
    setErro(null);

    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("compromissos").insert({
      cliente_id: dados.cliente_id,
      titulo: dados.titulo,
      data: dados.data,
      horario: dados.horario || null,
      criado_por: usuarioId,
    });

    if (error) {
      setErro("Não foi possível salvar o compromisso.");
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
      <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
        <Plus className="h-4 w-4" />
        Novo compromisso
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(salvar)}
      className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_auto_auto_auto]"
    >
      <Input placeholder="Título" {...register("titulo")} />
      <Input type="date" {...register("data")} />
      <Input type="time" {...register("horario")} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1" disabled={enviando}>
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      </div>
      {(errors.titulo || errors.data || erro) && (
        <p className="col-span-full text-sm text-destructive">
          {errors.titulo?.message || errors.data?.message || erro}
        </p>
      )}
    </form>
  );
}
