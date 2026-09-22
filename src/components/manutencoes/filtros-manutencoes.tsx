"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import type { Cliente, TipoManutencao } from "@/types/database";

interface FiltrosManutencoesProps {
  clientes: Cliente[];
  tipos: TipoManutencao[];
}

// Filtros do briefing (seção 8): cliente, local, tipo, status, período.
// Local não vira dropdown separado — como o texto é livre por cliente,
// filtra por busca textual junto da descrição.
export function FiltrosManutencoes({ clientes, tipos }: FiltrosManutencoesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const parametros = useSearchParams();

  function atualizar(chave: string, valor: string) {
    const novosParametros = new URLSearchParams(parametros.toString());
    if (valor) novosParametros.set(chave, valor);
    else novosParametros.delete(chave);
    router.push(`${pathname}?${novosParametros.toString()}`);
  }

  // Busca textual: debounce de 400ms para não navegar a cada tecla.
  const [busca, setBusca] = useState(parametros.get("busca") ?? "");
  useEffect(() => {
    const temporizador = setTimeout(() => {
      if (busca !== (parametros.get("busca") ?? "")) atualizar("busca", busca);
    }, 400);
    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
      <Select
        value={parametros.get("cliente") ?? ""}
        onChange={(e) => atualizar("cliente", e.target.value)}
      >
        <option value="">Todos os clientes</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </Select>

      <Select
        value={parametros.get("tipo") ?? ""}
        onChange={(e) => atualizar("tipo", e.target.value)}
      >
        <option value="">Todos os tipos</option>
        {tipos.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nome}
          </option>
        ))}
      </Select>

      <Select
        value={parametros.get("status") ?? ""}
        onChange={(e) => atualizar("status", e.target.value)}
      >
        <option value="">Todos os status</option>
        <option value="pendente">Pendente</option>
        <option value="em_andamento">Em andamento</option>
        <option value="resolvida">Resolvida</option>
      </Select>

      <Input
        type="date"
        value={parametros.get("de") ?? ""}
        onChange={(e) => atualizar("de", e.target.value)}
        aria-label="Data inicial"
      />
      <Input
        type="date"
        value={parametros.get("ate") ?? ""}
        onChange={(e) => atualizar("ate", e.target.value)}
        aria-label="Data final"
      />

      <Input
        className="col-span-2 md:col-span-5"
        placeholder="Buscar por local ou descrição..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
    </div>
  );
}
