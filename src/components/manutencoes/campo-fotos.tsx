"use client";

import { useState } from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { comprimirImagem } from "@/lib/imagens";
import { criarClienteNavegador } from "@/lib/supabase/client";

export interface FotoAnexada {
  storage_path: string;
  largura: number | null;
  altura: number | null;
  tamanho_bytes: number | null;
  preview: string; // URL local (blob) só para exibir enquanto a tela está aberta
}

interface CampoFotosProps {
  manutencaoId: string; // usado no caminho do Storage: manutencoes/{id}/{etapa}/...
  etapa: "registro" | "resolucao";
  valor: FotoAnexada[];
  onChange: (fotos: FotoAnexada[]) => void;
}

// Câmera/galeria + compressão + upload, um arquivo por vez, com feedback
// de progresso — é o componente que decide se o cadastro no celular é
// rápido ou frustrante, então cada foto some da lista "enviando" assim
// que termina, individualmente, em vez de travar tudo até a última.
export function CampoFotos({ manutencaoId, etapa, valor, onChange }: CampoFotosProps) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function tratarSelecao(arquivos: FileList | null) {
    if (!arquivos || arquivos.length === 0) return;
    setErro(null);
    setEnviando(true);

    const supabase = criarClienteNavegador();
    const novasFotos: FotoAnexada[] = [];

    try {
      for (const arquivoOriginal of Array.from(arquivos)) {
        const { arquivo, largura, altura } = await comprimirImagem(arquivoOriginal);

        const uid =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0;
                return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
              });
        const caminho = `manutencoes/${manutencaoId}/${etapa}/${uid}.webp`;

        const { error } = await supabase.storage
          .from("evolux-fotos")
          .upload(caminho, arquivo, { contentType: "image/webp" });

        if (error) throw error;

        novasFotos.push({
          storage_path: caminho,
          largura,
          altura,
          tamanho_bytes: arquivo.size,
          preview: URL.createObjectURL(arquivo),
        });
      }

      onChange([...valor, ...novasFotos]);
    } catch (err) {
      console.error("[CampoFotos] erro no upload:", err);
      setErro("Não foi possível enviar uma das fotos. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function remover(indice: number) {
    const foto = valor[indice];
    const supabase = criarClienteNavegador();
    await supabase.storage.from("evolux-fotos").remove([foto.storage_path]);
    onChange(valor.filter((_, i) => i !== indice));
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {/* capture="environment" abre a câmera traseira direto no mobile;
            em desktop o navegador ignora o atributo e abre o seletor normal */}
        <label className="flex-1">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            disabled={enviando}
            onChange={(e) => tratarSelecao(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={enviando}
            onClick={(e) => {
              // dispara o input de dentro do label sem duplicar handler
              (e.currentTarget.previousSibling as HTMLInputElement)?.click();
            }}
          >
            <Camera className="h-4 w-4" />
            Tirar foto
          </Button>
        </label>

        <label className="flex-1">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={enviando}
            onChange={(e) => tratarSelecao(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={enviando}
            onClick={(e) => {
              (e.currentTarget.previousSibling as HTMLInputElement)?.click();
            }}
          >
            <ImagePlus className="h-4 w-4" />
            Galeria
          </Button>
        </label>
      </div>

      {enviando && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Enviando foto...
        </p>
      )}
      {erro && <p className="text-sm text-destructive">{erro}</p>}

      {valor.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {valor.map((foto, indice) => (
            <div key={foto.storage_path} className="relative aspect-square overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto.preview} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remover(indice)}
                className="toque-confortavel absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label="Remover foto"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
