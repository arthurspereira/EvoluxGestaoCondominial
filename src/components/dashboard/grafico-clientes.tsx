"use client";

import { useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Card } from "@/components/ui/card";
import { MenuExportar } from "./menu-exportar";

export interface DadoCliente {
  cliente_nome: string;
  total: number;
}

const TITULO = "Manutenções por cliente";
const COR_BARRA = "#1463D9";
const COR_GRADE  = "#E4E8EF";
const COR_EIXO   = "#94A3B8";

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

// Ocultar se houver menos de 2 clientes — comparativo não faz sentido.
export function GraficoClientes({ dados }: { dados: DadoCliente[] }) {
  const cardRef = useRef<HTMLDivElement>(null);

  if (dados.length < 2) return null;

  const vazios = dados.every((d) => d.total === 0);
  const alturaGrafico = Math.max(180, dados.length * 48 + 40);

  return (
    <Card ref={cardRef} className="overflow-hidden">
      {/* Cabeçalho com linha divisória */}
      <div className="flex items-start justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">{TITULO}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Volume por condomínio</p>
        </div>
        <MenuExportar titulo={TITULO} cardRef={cardRef} />
      </div>

      {/* Corpo do gráfico */}
      <div className="px-5 py-4">
        {vazios ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nenhum dado no período</p>
        ) : (
          <ResponsiveContainer width="100%" height={alturaGrafico}>
            <BarChart
              layout="vertical"
              data={dados}
              margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COR_GRADE}
                horizontal={false}  /* barra horizontal: grade vertical suave */
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: COR_EIXO }}
                axisLine={{ stroke: COR_GRADE }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="cliente_nome"
                width={140}
                tick={{ fontSize: 11, fill: COR_EIXO }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 20) + "…" : v}
              />
              <Tooltip content={<TooltipCustom />} cursor={{ fill: "#F1F5F9" }} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {dados.map((_, i) => (
                  <Cell key={i} fill={COR_BARRA} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
