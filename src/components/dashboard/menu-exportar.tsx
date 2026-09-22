"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileImage, FileText } from "lucide-react";
import { useExportar } from "./usar-exportar";

interface MenuExportarProps {
  titulo: string;
  cardRef: React.RefObject<HTMLElement>;
}

export function MenuExportar({ titulo, cardRef }: MenuExportarProps) {
  const { exportarPng, exportarPdf } = useExportar(titulo);
  const [aberto, setAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar em qualquer lugar fora dele
  useEffect(() => {
    if (!aberto) return;

    function handleClickFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, [aberto]);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary transition-colors"
      >
        <Download className="h-3 w-3" />
        Exportar
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[100px] rounded-md border border-border bg-card shadow-md">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-secondary rounded-t-md"
            onClick={() => { exportarPng(cardRef.current as HTMLElement); setAberto(false); }}
          >
            <FileImage className="h-3.5 w-3.5" /> PNG
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-secondary rounded-b-md"
            onClick={() => { exportarPdf(cardRef.current as HTMLElement); setAberto(false); }}
          >
            <FileText className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      )}
    </div>
  );
}
