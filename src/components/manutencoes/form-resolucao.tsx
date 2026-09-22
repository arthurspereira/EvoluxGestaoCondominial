"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/form-fields";
import { Textarea } from "@/components/ui/input";
import { CampoFotos, type FotoAnexada } from "@/components/manutencoes/campo-fotos";
import { schemaResolucao, type ResolucaoInput } from "@/lib/schemas/manutencao";
import { criarClienteNavegador } from "@/lib/supabase/client";

interface FormResolucaoProps {
  manutencaoId: string;
}

// Último passo do fluxo mobile (briefing, seção 15, itens 10-11): o
// funcionário descreve a resolução, opcionalmente anexa fotos, e o
// trigger no banco (manutencoes_touch) carimba data/hora/autor sozinho
// quando o status muda para "resolvida" — aqui só se manda o status.
export function FormResolucao({ manutencaoId }: FormResolucaoProps) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [fotos, setFotos] = useState<FotoAnexada[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResolucaoInput>({
    resolver: zodResolver(schemaResolucao),
    defaultValues: { resolucao_descricao: "", fotos: [] },
  });

  async function salvar(dados: ResolucaoInput) {
    setEnviando(true);
    setErroEnvio(null);

    const supabase = criarClienteNavegador();

    const { error } = await supabase
      .from("manutencoes")
      .update({
        status: "resolvida",
        resolucao_descricao: dados.resolucao_descricao,
      })
      .eq("id", manutencaoId);

    if (error) {
      setErroEnvio("Não foi possível salvar. Verifique a conexão e tente novamente.");
      setEnviando(false);
      return;
    }

    if (fotos.length > 0) {
      await supabase.from("manutencao_fotos").insert(
        fotos.map((foto, indice) => ({
          manutencao_id: manutencaoId,
          etapa: "resolucao" as const,
          storage_path: foto.storage_path,
          largura: foto.largura,
          altura: foto.altura,
          tamanho_bytes: foto.tamanho_bytes,
          ordem: indice,
        }))
      );
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(salvar)} className="space-y-4 rounded-lg border border-border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="resolucao_descricao">Como foi resolvido?</Label>
        <Textarea
          id="resolucao_descricao"
          placeholder="Descreva o serviço realizado"
          {...register("resolucao_descricao")}
        />
        {errors.resolucao_descricao && (
          <p className="text-sm text-destructive">{errors.resolucao_descricao.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Fotos da resolução (opcional)</Label>
        <CampoFotos
          manutencaoId={manutencaoId}
          etapa="resolucao"
          valor={fotos}
          onChange={setFotos}
        />
      </div>

      {erroEnvio && <p className="text-sm text-destructive">{erroEnvio}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Marcar como resolvida
      </Button>
    </form>
  );
}
