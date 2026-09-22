import { criarClienteServidor } from "@/lib/supabase/server";
import type { ManutencaoFoto } from "@/types/database";

const VALIDADE_URL_SEGUNDOS = 60 * 10; // 10 minutos — suficiente para abrir a página

interface GaleriaFotosProps {
  fotos: ManutencaoFoto[];
  titulo: string;
}

// Bucket é privado (evolux-fotos), então cada exibição gera uma URL
// assinada nova — nunca guardamos URL pública no banco.
export async function GaleriaFotos({ fotos, titulo }: GaleriaFotosProps) {
  if (fotos.length === 0) return null;

  const supabase = await criarClienteServidor();
  const caminhos = fotos.map((f) => f.storage_path);

  const { data: urls } = await supabase.storage
    .from("evolux-fotos")
    .createSignedUrls(caminhos, VALIDADE_URL_SEGUNDOS);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
      <div className="grid grid-cols-3 gap-2">
        {fotos.map((foto, indice) => {
          const url = urls?.[indice]?.signedUrl;
          if (!url) return null;
          return (
            <a
              key={foto.id}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block aspect-square overflow-hidden rounded-md border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
