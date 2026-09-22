"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/form-fields";
import { Textarea } from "@/components/ui/input";
import { CampoFotos, type FotoAnexada } from "@/components/manutencoes/campo-fotos";
import { schemaNovaManutencao, type NovaManutencaoInput } from "@/lib/schemas/manutencao";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { Cliente, Local, TipoManutencao } from "@/types/database";

interface FormManutencaoProps {
  clientes: Cliente[];
  locais: Local[];
  tipos: TipoManutencao[];
  usuarioId: string;
}

// Passo a passo do briefing (seção 15): entrar, selecionar cliente,
// informar local, selecionar tipo, descrever, fotografar, salvar — tudo
// em uma tela só, sem etapas separadas, porque cada tela extra é fricção
// para quem está em pé numa vistoria.
export function FormManutencao({ clientes, locais, tipos, usuarioId }: FormManutencaoProps) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [fotos, setFotos] = useState<FotoAnexada[]>([]);
  const [novoLocal, setNovoLocal] = useState(false);

  // Id gerado no cliente antes de existir a linha no banco, só para dar
  // um caminho estável às fotos que já sobem durante o preenchimento.
  // Fallback manual para contextos não-seguros (HTTP): crypto.randomUUID()
  // só existe em HTTPS/localhost.
  const manutencaoId = useMemo(() => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    // Fallback: UUID v4 gerado com Math.random()
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NovaManutencaoInput>({
    resolver: zodResolver(schemaNovaManutencao),
    defaultValues: {
      cliente_id: clientes[0]?.id ?? "",
      local_id: locais[0]?.id ?? null,
      local_descricao: locais[0]?.nome ?? "",
      tipo_id: tipos[0]?.id ?? "",
      descricao: "",
      previsto_para: null,
      fotos: [],
    },
  });

  const clienteSelecionado = watch("cliente_id");
  const locaisDoCliente = locais.filter((l) => l.cliente_id === clienteSelecionado);

  async function salvar(dados: NovaManutencaoInput) {
    setEnviando(true);
    setErroEnvio(null);

    const supabase = criarClienteNavegador();

    const { error } = await supabase.from("manutencoes").insert({
      id: manutencaoId,
      cliente_id: dados.cliente_id,
      local_id: dados.local_id,
      local_descricao: dados.local_descricao,
      tipo_id: dados.tipo_id,
      descricao: dados.descricao,
      previsto_para: dados.previsto_para || null,
      registrado_por: usuarioId,
    });

    if (error) {
      setErroEnvio("Não foi possível salvar. Verifique a conexão e tente novamente.");
      setEnviando(false);
      return;
    }

    if (fotos.length > 0) {
      await supabase.from("manutencao_fotos").insert(
        fotos.map((foto, indice) => ({
          manutencao_id: manutencaoId,
          etapa: "registro" as const,
          storage_path: foto.storage_path,
          largura: foto.largura,
          altura: foto.altura,
          tamanho_bytes: foto.tamanho_bytes,
          ordem: indice,
        }))
      );
    }

    router.push(`/manutencoes/${manutencaoId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(salvar)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="cliente_id">Cliente</Label>
        <Select id="cliente_id" {...register("cliente_id")}>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="local_id">Local</Label>
        {!novoLocal ? (
          <>
            <Select
              id="local_id"
              {...register("local_id")}
              onChange={(e) => {
                register("local_id").onChange(e);
                const local = locaisDoCliente.find((l) => l.id === e.target.value);
                register("local_descricao").onChange({
                  target: { value: local?.nome ?? "" },
                } as React.ChangeEvent<HTMLInputElement>);
              }}
            >
              {locaisDoCliente.map((local) => (
                <option key={local.id} value={local.id}>
                  {local.nome}
                </option>
              ))}
            </Select>
            <button
              type="button"
              className="text-sm text-primary underline-offset-2 hover:underline"
              onClick={() => setNovoLocal(true)}
            >
              Informar outro local
            </button>
          </>
        ) : (
          <>
            <input type="hidden" {...register("local_id")} value="" />
            <input
              className="toque-confortavel flex w-full rounded-md border border-input bg-background px-3 py-2 text-base"
              placeholder="Ex.: Casa de máquinas"
              {...register("local_descricao")}
            />
            <button
              type="button"
              className="text-sm text-primary underline-offset-2 hover:underline"
              onClick={() => setNovoLocal(false)}
            >
              Escolher da lista
            </button>
          </>
        )}
        {errors.local_descricao && (
          <p className="text-sm text-destructive">{errors.local_descricao.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tipo_id">Tipo de manutenção</Label>
        <Select id="tipo_id" {...register("tipo_id")}>
          {tipos.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nome}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="descricao">O que foi identificado?</Label>
        <Textarea
          id="descricao"
          placeholder="Descreva o problema ou serviço encontrado na vistoria"
          {...register("descricao")}
        />
        {errors.descricao && (
          <p className="text-sm text-destructive">{errors.descricao.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="previsto_para">Data prevista (opcional)</Label>
        <input
          id="previsto_para"
          type="date"
          className="toque-confortavel flex w-full rounded-md border border-input bg-background px-3 py-2 text-base"
          {...register("previsto_para")}
        />
        <p className="text-xs text-muted-foreground">
          Preencha só se o serviço for acontecer em outra data. Sem isso, o
          calendário usa a data de hoje.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Fotos</Label>
        <CampoFotos
          manutencaoId={manutencaoId}
          etapa="registro"
          valor={fotos}
          onChange={setFotos}
        />
      </div>

      {erroEnvio && <p className="text-sm text-destructive">{erroEnvio}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
        Salvar manutenção
      </Button>
    </form>
  );
}
