"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { criarClienteNavegador } from "@/lib/supabase/client";

export function BotaoIniciarAndamento({ manutencaoId }: { manutencaoId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function iniciar() {
    setEnviando(true);
    const supabase = criarClienteNavegador();
    await supabase
      .from("manutencoes")
      .update({ status: "em_andamento" })
      .eq("id", manutencaoId);
    router.refresh();
  }

  return (
    <Button variant="outline" className="w-full" onClick={iniciar} disabled={enviando}>
      {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
      Iniciar atendimento
    </Button>
  );
}
