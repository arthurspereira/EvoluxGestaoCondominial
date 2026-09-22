"use client";

import { useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { MenuExportar } from "./menu-exportar";

export interface DadoDia {
  dia: string;
  registradas: number;
  resolvidas: number;
}

const TITULO = "Registradas × Resolvidas (últimos 7 dias)";
const COR_REGISTRADAS = "#1463D9";
const COR_RESOLVIDAS  = "#15803D";
const COR_GRADE = "#E4E8EF";
const COR_EIXO  = "#94A3B8";

function TooltipCustom({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-sm">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }} className="text-xs">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function GraficoSemanal({ dados }: { dados: DadoDia[] }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const vazios = dados.every((d) => d.registradas === 0 && d.resolvidas === 0);

  return (
    <Card ref={cardRef} className="overflow-hidden">
      {/* Cabeçalho com linha divisória */}
      <div className="flex items-start justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Registradas × Resolvidas</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Últimos 7 dias</p>
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
                dataKey="dia"
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
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: 11, color: "#1F2937" }}>{value}</span>
                )}
                iconType="square"
                iconSize={10}
              />
              <Bar
                dataKey="registradas"
                name="Registradas"
                fill={COR_REGISTRADAS}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="resolvidas"
                name="Resolvidas"
                fill={COR_RESOLVIDAS}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
