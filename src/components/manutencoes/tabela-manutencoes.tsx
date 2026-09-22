"use client";

import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Camera } from "lucide-react";
import { BadgeStatus } from "@/components/manutencoes/badge-status";
import { formatarData } from "@/lib/formato";
import type { ManutencaoDetalhada } from "@/types/database";

const colunas: ColumnDef<ManutencaoDetalhada>[] = [
  { accessorKey: "codigo", header: "#", cell: (info) => `#${info.getValue()}` },
  { accessorKey: "cliente_nome", header: "Cliente" },
  { accessorKey: "local_descricao", header: "Local" },
  {
    accessorKey: "tipo_nome",
    header: "Tipo",
    cell: ({ row }) => (
      <span
        className="rounded-full px-2 py-0.5 text-xs"
        style={{ backgroundColor: `${row.original.tipo_cor}1A`, color: row.original.tipo_cor }}
      >
        {row.original.tipo_nome}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <BadgeStatus status={row.original.status} />,
  },
  {
    accessorKey: "registrado_em",
    header: "Registrada em",
    cell: ({ row }) => formatarData(row.original.registrado_em),
  },
  {
    accessorKey: "total_fotos",
    header: "Fotos",
    cell: ({ row }) =>
      row.original.total_fotos > 0 ? (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Camera className="h-3.5 w-3.5" />
          {row.original.total_fotos}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
];

// Só aparece a partir de md — no mobile a listagem usa CardManutencao.
export function TabelaManutencoes({ dados }: { dados: ManutencaoDetalhada[] }) {
  const router = useRouter();
  const tabela = useReactTable({
    data: dados,
    columns: colunas,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="hidden overflow-hidden rounded-lg border border-border md:block">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-xs font-medium text-muted-foreground">
          {tabela.getHeaderGroups().map((grupo) => (
            <tr key={grupo.id}>
              {grupo.headers.map((coluna) => (
                <th key={coluna.id} className="px-4 py-2.5">
                  {flexRender(coluna.column.columnDef.header, coluna.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {tabela.getRowModel().rows.map((linha) => (
            <tr
              key={linha.id}
              className="cursor-pointer border-t border-border hover:bg-secondary/40"
              onClick={() => router.push(`/manutencoes/${linha.original.id}`)}
            >
              {linha.getVisibleCells().map((celula) => (
                <td key={celula.id} className="px-4 py-2.5">
                  {flexRender(celula.column.columnDef.cell, celula.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {dados.length === 0 && (
            <tr>
              <td colSpan={colunas.length} className="px-4 py-8 text-center text-muted-foreground">
                Nenhuma manutenção encontrada com esses filtros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
