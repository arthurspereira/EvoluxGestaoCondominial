"use client";

import { useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { MenuExportar } from "./menu-exportar";

export interface DadoTipo {
  tipo_nome: string;
  tipo_cor: string;
  total: number;
}

const TITULO = "Manutenções por tipo";
const COR_GRADE = "#E4E8EF";
const COR_EIXO  = "#94A3B8";

function TooltipCustom({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-sm">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">
        {payload[0].value} manutenção{payload[0].value !== 1 ? "ões" : ""}
      </p>
    </div>
  );
}

export function GraficoTipos({ dados }: { dados: DadoTipo[] }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const vazios = dados.every((d) => d.total === 0);

  return (
    <Card ref={cardRef} className="overflow-hidden">
      {/* Cabeçalho com linha divisória */}
      <div className="flex items-start justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">{TITULO}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Quantidade por categoria</p>
        </div>
        <MenuExportar titulo={TITULO} cardRef={cardRef} />
      </div>

      {/* Corpo do gráfico */}
      <div className="px-5 py-4">
        {vazios ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nenhum dado no período</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dados} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COR_GRADE}
                vertical={false}
              />
              <XAxis
                dataKey="tipo_nome"
                tick={{ fontSize: 11, fill: COR_EIXO }}
                axisLine={{ stroke: COR_GRADE }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: COR_EIXO }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<TooltipCustom />} cursor={{ fill: "#F1F5F9" }} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={56}>
                {dados.map((entry, index) => (
                  <Cell key={index} fill={entry.tipo_cor || "#64748B"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
