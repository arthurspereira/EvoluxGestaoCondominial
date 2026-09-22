"use client";

import { useCallback } from "react";

// Importações dinâmicas para não inflar o bundle principal — html2canvas
// e jspdf são pesados e só necessários quando o usuário clica em exportar.
async function capturarElemento(el: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import("html2canvas");
  return html2canvas(el, {
    scale: 2,           // resolução dobrada para PNG/PDF nítidos
    useCORS: true,
    backgroundColor: null, // preserva fundo do card (white em light mode)
  });
}

export function useExportar(titulo: string) {
  const exportarPng = useCallback(
    async (el: HTMLElement | null) => {
      if (!el) return;
      const canvas = await capturarElemento(el);
      const link = document.createElement("a");
      link.download = `${slugificar(titulo)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    },
    [titulo]
  );

  const exportarPdf = useCallback(
    async (el: HTMLElement | null) => {
      if (!el) return;
      const canvas = await capturarElemento(el);
      const { jsPDF } = await import("jspdf");

      const imgData = canvas.toDataURL("image/png");
      // Página A4 em orientação paisagem para acomodar o gráfico inteiro
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margem = 12;

      // Cabeçalho
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text(titulo, margem, margem + 4);

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(120);
      const geradoEm = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
      pdf.text(`Gerado em ${geradoEm} · Evolux Gestão Condominial`, margem, margem + 9);
      pdf.setTextColor(0);

      // Imagem proporcional centralizada abaixo do cabeçalho
      const cabH = margem + 14;
      const dispW = pageW - margem * 2;
      const dispH = pageH - cabH - margem;
      const razao = canvas.width / canvas.height;
      let imgW = dispW;
      let imgH = imgW / razao;
      if (imgH > dispH) {
        imgH = dispH;
        imgW = imgH * razao;
      }
      const x = (pageW - imgW) / 2;
      pdf.addImage(imgData, "PNG", x, cabH, imgW, imgH);

      pdf.save(`${slugificar(titulo)}.pdf`);
    },
    [titulo]
  );

  return { exportarPng, exportarPdf };
}

function slugificar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
