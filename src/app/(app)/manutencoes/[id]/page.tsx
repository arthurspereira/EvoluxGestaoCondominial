import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { criarClienteServidor } from "@/lib/supabase/server";
import { BadgeStatus } from "@/components/manutencoes/badge-status";
import { GaleriaFotos } from "@/components/manutencoes/galeria-fotos";
import { FormResolucao } from "@/components/manutencoes/form-resolucao";
import { BotaoIniciarAndamento } from "@/components/manutencoes/botao-iniciar-andamento";
import { formatarDataHora } from "@/lib/formato";
import type { ManutencaoDetalhada, ManutencaoFoto } from "@/types/database";

interface PaginaProps {
  params: Promise<{ id: string }>;
}

export default async function PaginaDetalheManutencao({ params }: PaginaProps) {
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const [{ data: manutencao }, { data: fotos }] = await Promise.all([
    supabase
      .from("manutencoes_detalhadas")
      .select("*")
      .eq("id", id)
      .returns<ManutencaoDetalhada[]>()
      .maybeSingle(),
    supabase
      .from("manutencao_fotos")
      .select("*")
      .eq("manutencao_id", id)
      .order("ordem"),
  ]);

  if (!manutencao) notFound();

  const fotosRegistro = (fotos ?? []).filter((f) => f.etapa === "registro");
  const fotosResolucao = (fotos ?? []).filter((f) => f.etapa === "resolucao");

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Manutenção #{manutencao.codigo}</p>
          <h1 className="text-xl font-semibold">{manutencao.cliente_nome}</h1>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {manutencao.local_descricao}
          </p>
        </div>
        <BadgeStatus status={manutencao.status} />
      </div>

      <div className="space-y-3 rounded-lg border border-border p-4">
        <div className="flex items-center justify-between text-sm">
          <span
            className="rounded-full px-2 py-0.5 text-xs"
            style={{ backgroundColor: `${manutencao.tipo_cor}1A`, color: manutencao.tipo_cor }}
          >
            {manutencao.tipo_nome}
          </span>
          <span className="text-muted-foreground">
            {formatarDataHora(manutencao.registrado_em)}
          </span>
        </div>

        <p className="text-sm text-foreground/90">{manutencao.descricao}</p>
        <p className="text-xs text-muted-foreground">
          Registrado por {manutencao.registrado_por_nome}
        </p>

        <GaleriaFotos fotos={fotosRegistro} titulo="Fotos do registro" />
      </div>

      {manutencao.status === "pendente" && (
        <BotaoIniciarAndamento manutencaoId={manutencao.id} />
      )}

      {manutencao.status === "resolvida" ? (
        <div className="space-y-3 rounded-lg border border-status-resolvida/30 bg-status-resolvida/5 p-4">
          <p className="text-sm font-medium text-status-resolvida">Resolução</p>
          <p className="text-sm text-foreground/90">{manutencao.resolucao_descricao}</p>
          {manutencao.resolvido_em && (
            <p className="text-xs text-muted-foreground">
              Resolvida em {formatarDataHora(manutencao.resolvido_em)}
            </p>
          )}
          <GaleriaFotos fotos={fotosResolucao} titulo="Fotos da resolução" />
        </div>
      ) : (
        <FormResolucao manutencaoId={manutencao.id} />
      )}
    </div>
  );
}
