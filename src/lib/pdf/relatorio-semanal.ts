import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import fs from "fs";
import path from "path";
import type { FotoParaPdf } from "./imagens";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface ManutencaoParaPdf {
  codigo: number;
  local_descricao: string;
  tipo_nome: string;
  descricao: string;
  status: string;
  registrado_em: string;
  registrado_por_nome: string;
  resolucao_descricao: string | null;
  resolvido_em: string | null;
  fotosRegistro: FotoParaPdf[];
  fotosResolucao: FotoParaPdf[];
}

export interface RelatorioSemanalProps {
  clienteNome: string;
  sindico: string | null;
  periodoInicio: string; // ISO yyyy-MM-dd
  periodoFim: string;
  manutencoes: ManutencaoParaPdf[];
}

// ---------------------------------------------------------------------------
// Cores (RGB 0-1)
// ---------------------------------------------------------------------------

const COR = {
  primaria:    rgb(0.078, 0.388, 0.851), // #1463D9
  texto:       rgb(0.122, 0.161, 0.216), // #1F2937
  suave:       rgb(0.420, 0.447, 0.502), // #6B7280
  borda:       rgb(0.898, 0.910, 0.922), // #E5E7EB
  fundo:       rgb(0.973, 0.980, 0.988), // #F8FAFC
  branco:      rgb(1, 1, 1),
  pendente:    rgb(0.706, 0.275, 0.035), // #B45309
  andamento:   rgb(0.078, 0.388, 0.851), // #1463D9
  resolvida:   rgb(0.086, 0.502, 0.239), // #15803D
};

const COR_STATUS: Record<string, ReturnType<typeof rgb>> = {
  pendente:    COR.pendente,
  em_andamento: COR.andamento,
  resolvida:   COR.resolvida,
};

const ROTULO_STATUS: Record<string, string> = {
  pendente:    "Pendente",
  em_andamento: "Em andamento",
  resolvida:   "Resolvida",
};

// ---------------------------------------------------------------------------
// Helpers de layout
// ---------------------------------------------------------------------------

// Largura e margens da página A4
const [PG_W, PG_H] = PageSizes.A4; // 595.28 x 841.89 pt
const MARGEM = 32;
const CONTEUDO_W = PG_W - MARGEM * 2;

function hexParaRgb(hex: string): ReturnType<typeof rgb> {
  const n = parseInt(hex.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** Quebra um texto em linhas que cabem em `maxWidth` pontos. */
function quebrarTexto(
  texto: string,
  fonte: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  tamanho: number,
  maxWidth: number
): string[] {
  const palavras = texto.split(" ");
  const linhas: string[] = [];
  let linha = "";

  for (const palavra of palavras) {
    const candidata = linha ? `${linha} ${palavra}` : palavra;
    if (fonte.widthOfTextAtSize(candidata, tamanho) <= maxWidth) {
      linha = candidata;
    } else {
      if (linha) linhas.push(linha);
      // Se a palavra sozinha não cabe, corta caractere a caractere
      if (fonte.widthOfTextAtSize(palavra, tamanho) > maxWidth) {
        let parte = "";
        for (const char of palavra) {
          if (fonte.widthOfTextAtSize(parte + char, tamanho) <= maxWidth) {
            parte += char;
          } else {
            if (parte) linhas.push(parte);
            parte = char;
          }
        }
        linha = parte;
      } else {
        linha = palavra;
      }
    }
  }
  if (linha) linhas.push(linha);
  return linhas;
}

/** Desenha texto com quebra automática e retorna a altura consumida. */
function desenharTextoQuebrado(
  page: ReturnType<PDFDocument["addPage"]>,
  texto: string,
  fonte: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  tamanho: number,
  cor: ReturnType<typeof rgb>,
  x: number,
  y: number,
  maxWidth: number,
  espacoEntreLinhas = 1.35
): number {
  if (!texto) return 0;
  const linhas = quebrarTexto(texto, fonte, tamanho, maxWidth);
  const alturaLinha = tamanho * espacoEntreLinhas;
  linhas.forEach((linha, i) => {
    page.drawText(linha, { x, y: y - i * alturaLinha, size: tamanho, font: fonte, color: cor });
  });
  return linhas.length * alturaLinha;
}

/** Retorna a altura que um bloco de texto ocuparia (sem desenhar). */
function alturaTexto(
  texto: string,
  fonte: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  tamanho: number,
  maxWidth: number,
  espacoEntreLinhas = 1.35
): number {
  if (!texto) return 0;
  return quebrarTexto(texto, fonte, tamanho, maxWidth).length * tamanho * espacoEntreLinhas;
}

function formatarDataHora(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

function formatarData(iso: string) {
  return format(new Date(`${iso}T00:00:00`), "dd/MM/yyyy");
}

// ---------------------------------------------------------------------------
// Gerador principal
// ---------------------------------------------------------------------------

export async function gerarRelatorioSemanal(props: RelatorioSemanalProps): Promise<Uint8Array> {
  const { clienteNome, sindico, periodoInicio, periodoFim, manutencoes } = props;

  const doc = await PDFDocument.create();
  doc.setTitle(`Relatório de manutenções — ${clienteNome}`);
  doc.setCreator("Evolux Gestão Condominial");

  // Fontes padrão PDF — embutidas na spec, sem arquivos externos
  const fontNormal = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold   = await doc.embedFont(StandardFonts.HelveticaBold);

  // Logo da marca (opcional — silencia se não encontrar)
  let logoPng: Awaited<ReturnType<typeof doc.embedPng>> | null = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "marca.png");
    const logoBytes = fs.readFileSync(logoPath);
    logoPng = await doc.embedPng(logoBytes);
  } catch {
    logoPng = null;
  }

  const resolvidas  = manutencoes.filter((m) => m.status === "resolvida").length;
  const pendentes   = manutencoes.filter((m) => m.status === "pendente").length;
  const andamento   = manutencoes.filter((m) => m.status === "em_andamento").length;
  const geradoEm    = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  // -------------------------------------------------------------------
  // Helpers de paginação
  // -------------------------------------------------------------------

  // Altura reservada para o cabeçalho fixo no topo de cada página
  const CABECALHO_H = 52;
  // Altura reservada para o rodapé fixo na base de cada página
  const RODAPE_H = 24;
  // Y inicial do conteúdo (logo abaixo do cabeçalho)
  const Y_INICIO = PG_H - MARGEM - CABECALHO_H - 12;
  // Y mínimo antes de virar página (acima do rodapé)
  const Y_MIN = MARGEM + RODAPE_H + 8;

  let paginaAtual = doc.addPage(PageSizes.A4);
  let y = Y_INICIO;

  function desenharCabecalho(pg: ReturnType<typeof doc.addPage>) {
    const yBase = PG_H - MARGEM;

    // Linha azul inferior do cabeçalho
    pg.drawLine({
      start: { x: MARGEM, y: yBase - CABECALHO_H },
      end:   { x: PG_W - MARGEM, y: yBase - CABECALHO_H },
      thickness: 2,
      color: COR.primaria,
    });

    // Logo ou nome do sistema
    if (logoPng) {
      const dim = logoPng.scaleToFit(36, 36);
      pg.drawImage(logoPng, { x: MARGEM, y: yBase - dim.height, width: dim.width, height: dim.height });
    } else {
      pg.drawText("Evolux", { x: MARGEM, y: yBase - 18, size: 18, font: fontBold, color: COR.primaria });
    }
    pg.drawText("Relatório semanal de manutenções", {
      x: MARGEM, y: yBase - CABECALHO_H + 8, size: 9, font: fontNormal, color: COR.suave,
    });

    // Cliente e período (alinhados à direita)
    const nomeW = fontBold.widthOfTextAtSize(clienteNome, 12);
    pg.drawText(clienteNome, {
      x: PG_W - MARGEM - nomeW, y: yBase - 14, size: 12, font: fontBold, color: COR.texto,
    });

    if (sindico) {
      const sindicoTxt = `A/C: ${sindico}`;
      const sindicoW = fontNormal.widthOfTextAtSize(sindicoTxt, 9);
      pg.drawText(sindicoTxt, {
        x: PG_W - MARGEM - sindicoW, y: yBase - 28, size: 9, font: fontNormal, color: COR.suave,
      });
    }

    const periodTxt = `${formatarData(periodoInicio)} a ${formatarData(periodoFim)}`;
    const periodW = fontNormal.widthOfTextAtSize(periodTxt, 9);
    pg.drawText(periodTxt, {
      x: PG_W - MARGEM - periodW,
      y: yBase - (sindico ? 40 : 28),
      size: 9, font: fontNormal, color: COR.suave,
    });
  }

  function desenharRodape(pg: ReturnType<typeof doc.addPage>, numPagina: number) {
    const yRodape = MARGEM + RODAPE_H - 6;
    pg.drawLine({
      start: { x: MARGEM, y: yRodape + 10 },
      end:   { x: PG_W - MARGEM, y: yRodape + 10 },
      thickness: 0.5, color: COR.borda,
    });
    pg.drawText(`Gerado em ${geradoEm} pelo Evolux Gestão Condominial`, {
      x: MARGEM, y: yRodape, size: 7.5, font: fontNormal, color: COR.suave,
    });
    const pgTxt = `Página ${numPagina}`;
    const pgW = fontNormal.widthOfTextAtSize(pgTxt, 7.5);
    pg.drawText(pgTxt, {
      x: PG_W - MARGEM - pgW, y: yRodape, size: 7.5, font: fontNormal, color: COR.suave,
    });
  }

  // Mapa de páginas para numerar no rodapé depois
  const paginas: ReturnType<typeof doc.addPage>[] = [paginaAtual];
  desenharCabecalho(paginaAtual);

  function novaParagrafo(alturaMinima: number) {
    if (y - alturaMinima < Y_MIN) {
      desenharRodape(paginaAtual, paginas.length);
      paginaAtual = doc.addPage(PageSizes.A4);
      paginas.push(paginaAtual);
      desenharCabecalho(paginaAtual);
      y = Y_INICIO;
    }
  }

  // -------------------------------------------------------------------
  // Bloco de resumo
  // -------------------------------------------------------------------
  const RESUMO_H = 42;
  novaParagrafo(RESUMO_H + 8);

  paginaAtual.drawRectangle({
    x: MARGEM, y: y - RESUMO_H,
    width: CONTEUDO_W, height: RESUMO_H,
    color: COR.fundo, borderWidth: 0,
  });

  const resumoItens = [
    { valor: String(manutencoes.length), rotulo: "Total no período", cor: COR.texto },
    { valor: String(pendentes),          rotulo: "Pendentes",        cor: COR.pendente },
    { valor: String(andamento),          rotulo: "Em andamento",     cor: COR.andamento },
    { valor: String(resolvidas),         rotulo: "Resolvidas",       cor: COR.resolvida },
  ];

  const colunaW = CONTEUDO_W / resumoItens.length;
  resumoItens.forEach((item, i) => {
    const cx = MARGEM + i * colunaW + colunaW / 2;
    const valorW = fontBold.widthOfTextAtSize(item.valor, 14);
    paginaAtual.drawText(item.valor, {
      x: cx - valorW / 2, y: y - 18, size: 14, font: fontBold, color: item.cor,
    });
    const rotuloW = fontNormal.widthOfTextAtSize(item.rotulo, 8);
    paginaAtual.drawText(item.rotulo, {
      x: cx - rotuloW / 2, y: y - 32, size: 8, font: fontNormal, color: COR.suave,
    });
  });

  y -= RESUMO_H + 12;

  // -------------------------------------------------------------------
  // Sem manutenções
  // -------------------------------------------------------------------
  if (manutencoes.length === 0) {
    novaParagrafo(20);
    const msg = "Nenhuma manutenção registrada neste período.";
    const msgW = fontNormal.widthOfTextAtSize(msg, 10);
    paginaAtual.drawText(msg, {
      x: MARGEM + (CONTEUDO_W - msgW) / 2, y, size: 10, font: fontNormal, color: COR.suave,
    });
    y -= 20;
  }

  // -------------------------------------------------------------------
  // Cards de manutenção
  // -------------------------------------------------------------------
  for (const man of manutencoes) {
    const PADDING = 10;
    const INNER_W = CONTEUDO_W - PADDING * 2;

    // Pré-calcula a altura do card para decidir se cabe na página atual
    const altCodigo  = 10 * 1.3;
    const altLocal   = alturaTexto(man.local_descricao, fontBold, 11, INNER_W);
    const altDesc    = alturaTexto(man.descricao, fontNormal, 9.5, INNER_W);
    const altMeta    = 8 * 1.3;
    const FOTO_H     = man.fotosRegistro.length > 0 ? 88 : 0;
    const altResolucao = man.status === "resolvida"
      ? 14 + alturaTexto(man.resolucao_descricao ?? "", fontNormal, 9.5, INNER_W) + (man.resolvido_em ? altMeta : 0) + (man.fotosResolucao.length > 0 ? 88 : 0)
      : 0;

    const altCard = PADDING * 2 + altCodigo + altLocal + 6 + altDesc + altMeta + FOTO_H + altResolucao + 8;

    novaParagrafo(Math.min(altCard, PG_H - MARGEM * 2 - CABECALHO_H - RODAPE_H));

    // Borda do card
    paginaAtual.drawRectangle({
      x: MARGEM, y: y - altCard,
      width: CONTEUDO_W, height: altCard,
      borderColor: COR.borda, borderWidth: 1, color: COR.branco,
    });

    let cy = y - PADDING;

    // Código e tipo
    paginaAtual.drawText(`#${man.codigo} · ${man.tipo_nome}`, {
      x: MARGEM + PADDING, y: cy - 10, size: 9, font: fontNormal, color: COR.suave,
    });

    // Tag de status (alinhada à direita)
    const tagTxt = ROTULO_STATUS[man.status] ?? man.status;
    const tagW   = fontNormal.widthOfTextAtSize(tagTxt, 8) + 12;
    const tagCor = COR_STATUS[man.status] ?? COR.suave;
    paginaAtual.drawRectangle({
      x: PG_W - MARGEM - PADDING - tagW, y: cy - 16,
      width: tagW, height: 14,
      color: tagCor, borderWidth: 0,
    });
    paginaAtual.drawText(tagTxt, {
      x: PG_W - MARGEM - PADDING - tagW + 6, y: cy - 12,
      size: 8, font: fontNormal, color: COR.branco,
    });

    cy -= altCodigo + 4;

    // Local
    const altLocalReal = desenharTextoQuebrado(
      paginaAtual, man.local_descricao, fontBold, 11, COR.texto,
      MARGEM + PADDING, cy, INNER_W
    );
    cy -= altLocalReal + 6;

    // Descrição
    const altDescReal = desenharTextoQuebrado(
      paginaAtual, man.descricao, fontNormal, 9.5, COR.texto,
      MARGEM + PADDING, cy, INNER_W
    );
    cy -= altDescReal;

    // Meta: registrado por / em
    const metaTxt = `Registrado em ${formatarDataHora(man.registrado_em)} por ${man.registrado_por_nome}`;
    desenharTextoQuebrado(paginaAtual, metaTxt, fontNormal, 8, COR.suave, MARGEM + PADDING, cy, INNER_W);
    cy -= altMeta + 4;

    // Fotos de registro
    if (man.fotosRegistro.length > 0) {
      const fotosParaDesenhar = man.fotosRegistro.slice(0, 5); // máximo 5 por linha
      let fx = MARGEM + PADDING;
      for (const foto of fotosParaDesenhar) {
        try {
          const imgBytes = Buffer.from(foto.dataUri.split(",")[1], "base64");
          const img = await doc.embedJpg(imgBytes);
          const dim = img.scaleToFit(84, 84);
          paginaAtual.drawImage(img, { x: fx, y: cy - dim.height, width: dim.width, height: dim.height });
          fx += dim.width + 4;
        } catch { /* ignora foto corrompida */ }
      }
      cy -= 88;
    }

    // Bloco de resolução
    if (man.status === "resolvida") {
      paginaAtual.drawLine({
        start: { x: MARGEM + PADDING, y: cy },
        end:   { x: PG_W - MARGEM - PADDING, y: cy },
        thickness: 0.5, color: COR.borda,
      });
      cy -= 8;

      paginaAtual.drawText("Resolução", {
        x: MARGEM + PADDING, y: cy, size: 8.5, font: fontBold, color: COR.resolvida,
      });
      cy -= 12;

      if (man.resolucao_descricao) {
        const altRes = desenharTextoQuebrado(
          paginaAtual, man.resolucao_descricao, fontNormal, 9.5, COR.texto,
          MARGEM + PADDING, cy, INNER_W
        );
        cy -= altRes;
      }

      if (man.resolvido_em) {
        paginaAtual.drawText(`Resolvida em ${formatarDataHora(man.resolvido_em)}`, {
          x: MARGEM + PADDING, y: cy, size: 8, font: fontNormal, color: COR.suave,
        });
        cy -= altMeta;
      }

      if (man.fotosResolucao.length > 0) {
        let fx = MARGEM + PADDING;
        for (const foto of man.fotosResolucao.slice(0, 5)) {
          try {
            const imgBytes = Buffer.from(foto.dataUri.split(",")[1], "base64");
            const img = await doc.embedJpg(imgBytes);
            const dim = img.scaleToFit(84, 84);
            paginaAtual.drawImage(img, { x: fx, y: cy - dim.height, width: dim.width, height: dim.height });
            fx += dim.width + 4;
          } catch { /* ignora foto corrompida */ }
        }
        cy -= 88;
      }
    }

    y -= altCard + 8;
  }

  // Rodapé da última página
  desenharRodape(paginaAtual, paginas.length);

  return doc.save();
}
