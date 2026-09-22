import Link from "next/link";
import { Camera, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeStatus } from "@/components/manutencoes/badge-status";
import { formatarData } from "@/lib/formato";
import type { ManutencaoDetalhada } from "@/types/database";

export function CardManutencao({ manutencao }: { manutencao: ManutencaoDetalhada }) {
  return (
    <Link href={`/manutencoes/${manutencao.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{manutencao.cliente_nome}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {manutencao.local_descricao}
              </p>
            </div>
            <BadgeStatus status={manutencao.status} />
          </div>

          <p className="line-clamp-2 text-sm text-foreground/80">{manutencao.descricao}</p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: `${manutencao.tipo_cor}1A`, color: manutencao.tipo_cor }}
            >
              {manutencao.tipo_nome}
            </span>
            <span className="flex items-center gap-2">
              {manutencao.total_fotos > 0 && (
                <span className="flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5" />
                  {manutencao.total_fotos}
                </span>
              )}
              {formatarData(manutencao.registrado_em)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
