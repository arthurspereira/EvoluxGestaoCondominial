"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { criarClienteNavegador } from "@/lib/supabase/client";

// Locais são abertos por cliente (briefing, seção 4) — a listagem inicial
// de exemplos (portaria, garagem etc.) já vem da migration; isto cobre o
// caso de precisar de mais um local específico depois.
export function FormLocal({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    if (nome.trim().length < 2) {
      setErro("Informe o nome do local.");
      return;
    }

    setEnviando(true);
    setErro(null);

    const supabase = criarClienteNavegador();
    const { error } = await supabase
      .from("locais")
      .insert({ cliente_id: clienteId, nome: nome.trim() });

    if (error) {
      setErro(error.code === "23505" ? "Esse local já existe." : "Não foi possível salvar.");
      setEnviando(false);
      return;
    }

    setNome("");
    setAberto(false);
    setEnviando(false);
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        type="button"
        className="flex items-center gap-1 text-sm text-primary hover:underline"
        onClick={() => setAberto(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar local
      </button>
    );
  }

  return (
    <form onSubmit={salvar} className="flex items-center gap-2">
      <Input
        placeholder="Ex.: Casa de máquinas"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="h-9"
      />
      <Button type="submit" size="sm" disabled={enviando}>
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setAberto(false)}>
        Cancelar
      </Button>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </form>
  );
}
