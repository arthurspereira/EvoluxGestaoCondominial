"use client";

import { useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { MenuExportar } from "./menu-exportar";

export interface DadoStatus {
  status: string;
  total: number;
}

const ROTULOS: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  resolvida: "Resolvida",
};

const CORES: Record<string, string> = {
  pendente: "#B45309",
  em_andamento: "#1463D9",
  resolvida: "#15803D",
};

const TITULO = "Manutenções por status";

// Hex equivalente a --border (220 13% 90%) e --muted-foreground (220 9% 46%)
const COR_GRADE = "#E4E8EF";
const COR_EIXO  = "#94A3B8";

function TooltipCustom({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-sm">
      <p className="font-semibold text-foreground">{name}</p>
      <p className="text-muted-foreground">{value} manutenção{value !== 1 ? "ões" : ""}</p>
    </div>
  );
}

export function GraficoStatus({ dados }: { dados: DadoStatus[] }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const dadosFormatados = dados.map((d) => ({
    name: ROTULOS[d.status] ?? d.status,
    value: d.total,
    cor: CORES[d.status] ?? "#64748B",
  }));

  const vazios = dadosFormatados.every((d) => d.value === 0);

  return (
    <Card ref={cardRef} className="overflow-hidden">
      {/* Cabeçalho com linha divisória */}
      <div className="flex items-start justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">{TITULO}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Distribuição por situação atual</p>
        </div>
        <MenuExportar titulo={TITULO} cardRef={cardRef} />
      </div>

      {/* Corpo do gráfico */}
      <div className="px-5 py-4">
        {vazios ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nenhum dado no período</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={dadosFormatados}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {dadosFormatados.map((entry, index) => (
                  <Cell key={index} fill={entry.cor} />
                ))}
              </Pie>
              <Tooltip content={<TooltipCustom />} />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: 11, color: "#1F2937" }}>{value}</span>
                )}
                iconType="square"
                iconSize={10}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
