import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";

// Decisão: as fotos ficam salvas em WebP (ver src/lib/imagens.ts), mas o
// @react-pdf/renderer não lê WebP nativamente — só PNG e JPEG. Em vez de
// depender de fetch de URL assinada dentro do render (que falha em
// silêncio se expirar ou se o formato não for suportado), baixamos os
// bytes aqui, convertemos com sharp e entregamos como data URI: a fonte
// da imagem fica embutida no próprio buffer do documento, sem dependência
// de rede durante a geração.
const LARGURA_RELATORIO = 480; // suficiente para impressão em boletim A4

export interface FotoParaPdf {
  dataUri: string;
  largura: number;
  altura: number;
}

export async function prepararFotoParaPdf(
  supabase: SupabaseClient,
  storagePath: string
): Promise<FotoParaPdf | null> {
  const { data, error } = await supabase.storage.from("evolux-fotos").download(storagePath);
  if (error || !data) return null;

  const bufferOriginal = Buffer.from(await data.arrayBuffer());

  const imagem = sharp(bufferOriginal).rotate(); // rotate() sem args = aplica orientação EXIF
  const metadados = await imagem.metadata();

  const escala = Math.min(1, LARGURA_RELATORIO / (metadados.width ?? LARGURA_RELATORIO));
  const larguraFinal = Math.round((metadados.width ?? LARGURA_RELATORIO) * escala);
  const alturaFinal = Math.round((metadados.height ?? LARGURA_RELATORIO) * escala);

  const bufferJpeg = await imagem
    .resize({ width: larguraFinal })
    .jpeg({ quality: 78 })
    .toBuffer();

  return {
    dataUri: `data:image/jpeg;base64,${bufferJpeg.toString("base64")}`,
    largura: larguraFinal,
    altura: alturaFinal,
  };
}

// Roda as conversões em paralelo, mas com um limite — dezenas de fotos
// ao mesmo tempo podem estourar memória da função serverless.
export async function prepararFotosParaPdf(
  supabase: SupabaseClient,
  caminhos: string[],
  concorrenciaMaxima = 4
): Promise<Map<string, FotoParaPdf>> {
  const resultado = new Map<string, FotoParaPdf>();
  const fila = [...caminhos];

  async function trabalhador() {
    let caminho: string | undefined;
    while ((caminho = fila.shift())) {
      const foto = await prepararFotoParaPdf(supabase, caminho);
      if (foto) resultado.set(caminho, foto);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concorrenciaMaxima, caminhos.length) }, trabalhador)
  );

  return resultado;
}
