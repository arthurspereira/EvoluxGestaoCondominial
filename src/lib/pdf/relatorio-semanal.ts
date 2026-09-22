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
  periodoInicio: string;
  periodoFim: string;
  manutencoes: ManutencaoParaPdf[];
}

// ---------------------------------------------------------------------------
// Cores
// ---------------------------------------------------------------------------

const COR = {
  primaria:  rgb(0.078, 0.388, 0.851),
  texto:     rgb(0.122, 0.161, 0.216),
  suave:     rgb(0.420, 0.447, 0.502),
  borda:     rgb(0.898, 0.910, 0.922),
  fundo:     rgb(0.973, 0.980, 0.988),
  branco:    rgb(1, 1, 1),
  pendente:  rgb(0.706, 0.275, 0.035),
  andamento: rgb(0.078, 0.388, 0.851),
  resolvida: rgb(0.086, 0.502, 0.239),
};

const COR_STATUS: Record<string, ReturnType<typeof rgb>> = {
  pendente:     COR.pendente,
  em_andamento: COR.andamento,
  resolvida:    COR.resolvida,
};

const ROTULO_STATUS: Record<string, string> = {
  pendente:     "Pendente",
  em_andamento: "Em andamento",
  resolvida:    "Resolvida",
};

// ---------------------------------------------------------------------------
// Constantes de layout
// ---------------------------------------------------------------------------

// pdf-lib: origem no canto INFERIOR ESQUERDO, Y cresce para CIMA.
// Toda a lógica usa "cursor Y" que começa alto e DECRESCE conforme
// o conteúdo avança para baixo da página.

const [PG_W, PG_H] = PageSizes.A4; // 595.28 x 841.89 pt
const MAR           = 36;           // margem lateral e vertical
const CONT_W        = PG_W - MAR * 2;
const CAB_H         = 56;           // altura do cabeçalho
const ROD_H         = 20;           // altura do rodapé
// Cursor Y onde o conteúdo começa (logo abaixo do cabeçalho)
const Y_TOPO        = PG_H - MAR - CAB_H - 10;
// Cursor Y mínimo antes de virar página (acima do rodapé)
const Y_BASE        = MAR + ROD_H + 10;
const PADDING_CARD  = 10;
const INNER_W       = CONT_W - PADDING_CARD * 2;

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

type Fonte = Awaited<ReturnType<PDFDocument["embedFont"]>>;
type Pagina = ReturnType<PDFDocument["addPage"]>;

// ---------------------------------------------------------------------------
// Utilitários de texto
// ---------------------------------------------------------------------------

/**
 * Quebra texto em linhas que cabem em maxW pontos.
 * Respeita quebras de linha (\n) existentes no texto.
 */
function quebrarTexto(texto: string, fonte: Fonte, tam: number, maxW: number): string[] {
  const resultado: string[] = [];

  for (const paragrafo of texto.split("\n")) {
    const palavras = paragrafo.split(" ");
    let linha = "";

    for (const palavra of palavras) {
      const candidata = linha ? `${linha} ${palavra}` : palavra;
      if (fonte.widthOfTextAtSize(candidata, tam) <= maxW) {
        linha = candidata;
      } else {
        if (linha) resultado.push(linha);
        // Palavra maior que a linha: corta por caractere
        if (fonte.widthOfTextAtSize(palavra, tam) > maxW) {
          let parte = "";
          for (const ch of palavra) {
            if (fonte.widthOfTextAtSize(parte + ch, tam) <= maxW) {
              parte += ch;
            } else {
              if (parte) resultado.push(parte);
              parte = ch;
            }
          }
          linha = parte;
        } else {
          linha = palavra;
        }
      }
    }
    if (linha) resultado.push(linha);
  }

  return resultado.length > 0 ? resultado : [""];
}

/** Altura total que um bloco de texto ocupa. */
function altTexto(texto: string, fonte: Fonte, tam: number, maxW: number, leading = 1.4): number {
  if (!texto?.trim()) return 0;
  return quebrarTexto(texto, fonte, tam, maxW).length * tam * leading;
}

/**
 * Desenha texto com quebra de linha.
 * cursor Y aponta para o TOPO da primeira linha.
 * Retorna a altura total consumida.
 */
function drawText(
  pg: Pagina,
  texto: string,
  fonte: Fonte,
  tam: number,
  cor: ReturnType<typeof rgb>,
  x: number,
  cursorY: number,
  maxW: number,
  leading = 1.4
): number {
  if (!texto?.trim()) return 0;
  const linhas = quebrarTexto(texto, fonte, tam, maxW);
  const altLinha = tam * leading;
  // pdf-lib: y = baseline. Baseline ≈ topo - tam * 0.75
  linhas.forEach((linha, i) => {
    pg.drawText(linha, {
      x,
      y: cursorY - tam * 0.85 - i * altLinha,
      size: tam,
      font: fonte,
      color: cor,
    });
  });
  return linhas.length * altLinha;
}

function fmtDataHora(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

function fmtData(iso: string) {
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

  const fontN = await doc.embedFont(StandardFonts.Helvetica);
  const fontB = await doc.embedFont(StandardFonts.HelveticaBold);

  // Logo (opcional)
  let logoPng: Awaited<ReturnType<typeof doc.embedPng>> | null = null;
  try {
    const logoBytes = fs.readFileSync(path.join(process.cwd(), "public", "marca.png"));
    logoPng = await doc.embedPng(logoBytes);
  } catch { /* sem logo */ }

  const total     = manutencoes.length;
  const resolvidas = manutencoes.filter((m) => m.status === "resolvida").length;
  const pendentes  = manutencoes.filter((m) => m.status === "pendente").length;
  const andamento  = manutencoes.filter((m) => m.status === "em_andamento").length;
  const geradoEm   = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  // -------------------------------------------------------------------
  // Estado de paginação
  // -------------------------------------------------------------------

  let pg    = doc.addPage(PageSizes.A4);
  let curY  = Y_TOPO;
  let numPg = 1;

  // -------------------------------------------------------------------
  // Cabeçalho (redesenhado em cada página nova)
  // -------------------------------------------------------------------

  function desenharCabecalho(p: Pagina) {
    const yTopo = PG_H - MAR;

    // Linha azul separadora
    p.drawLine({
      start: { x: MAR, y: yTopo - CAB_H },
      end:   { x: PG_W - MAR, y: yTopo - CAB_H },
      thickness: 2,
      color: COR.primaria,
    });

    // Logo ou texto "Evolux"
    if (logoPng) {
      const dim = logoPng.scaleToFit(36, 36);
      p.drawImage(logoPng, {
        x: MAR,
        y: yTopo - dim.height,
        width: dim.width,
        height: dim.height,
      });
    } else {
      p.drawText("Evolux", {
        x: MAR, y: yTopo - 20,
        size: 18, font: fontB, color: COR.primaria,
      });
    }

    p.drawText("Relatório semanal de manutenções", {
      x: MAR, y: yTopo - CAB_H + 10,
      size: 9, font: fontN, color: COR.suave,
    });

    // Cliente (direita)
    const nomeW = fontB.widthOfTextAtSize(clienteNome, 12);
    p.drawText(clienteNome, {
      x: PG_W - MAR - nomeW, y: yTopo - 16,
      size: 12, font: fontB, color: COR.texto,
    });

    let offsetDireita = 30;
    if (sindico) {
      const txt = `A/C: ${sindico}`;
      const w = fontN.widthOfTextAtSize(txt, 9);
      p.drawText(txt, {
        x: PG_W - MAR - w, y: yTopo - offsetDireita,
        size: 9, font: fontN, color: COR.suave,
      });
      offsetDireita += 14;
    }

    const periodo = `${fmtData(periodoInicio)} a ${fmtData(periodoFim)}`;
    const periodoW = fontN.widthOfTextAtSize(periodo, 9);
    p.drawText(periodo, {
      x: PG_W - MAR - periodoW, y: yTopo - offsetDireita,
      size: 9, font: fontN, color: COR.suave,
    });
  }

  // -------------------------------------------------------------------
  // Rodapé
  // -------------------------------------------------------------------

  function desenharRodape(p: Pagina, num: number) {
    const yLinha = MAR + ROD_H;
    p.drawLine({
      start: { x: MAR, y: yLinha },
      end:   { x: PG_W - MAR, y: yLinha },
      thickness: 0.5, color: COR.borda,
    });
    p.drawText(`Gerado em ${geradoEm} pelo Evolux Gestão Condominial`, {
      x: MAR, y: MAR + 5,
      size: 7.5, font: fontN, color: COR.suave,
    });
    const pgTxt = `Página ${num}`;
    const pgW = fontN.widthOfTextAtSize(pgTxt, 7.5);
    p.drawText(pgTxt, {
      x: PG_W - MAR - pgW, y: MAR + 5,
      size: 7.5, font: fontN, color: COR.suave,
    });
  }

  // Desenha cabeçalho na primeira página
  desenharCabecalho(pg);

  // -------------------------------------------------------------------
  // Nova página
  // -------------------------------------------------------------------

  function novaPage() {
    desenharRodape(pg, numPg);
    numPg++;
    pg   = doc.addPage(PageSizes.A4);
    curY = Y_TOPO;
    desenharCabecalho(pg);
  }

  /** Garante espaço para `h` pontos; se não couber, vira página. */
  function garantirEspaco(h: number) {
    if (curY - h < Y_BASE) novaPage();
  }

  // -------------------------------------------------------------------
  // Bloco de resumo
  // -------------------------------------------------------------------

  const RESUMO_H = 44;
  garantirEspaco(RESUMO_H + 12);

  // Fundo cinza
  pg.drawRectangle({
    x: MAR, y: curY - RESUMO_H,
    width: CONT_W, height: RESUMO_H,
    color: COR.fundo,
  });

  const resumoItens = [
    { valor: String(total),     rotulo: "Total no período", cor: COR.texto },
    { valor: String(pendentes), rotulo: "Pendentes",        cor: COR.pendente },
    { valor: String(andamento), rotulo: "Em andamento",     cor: COR.andamento },
    { valor: String(resolvidas),rotulo: "Resolvidas",       cor: COR.resolvida },
  ];

  const colW = CONT_W / resumoItens.length;
  resumoItens.forEach((item, i) => {
    const cx = MAR + i * colW + colW / 2;

    const vW = fontB.widthOfTextAtSize(item.valor, 14);
    pg.drawText(item.valor, {
      x: cx - vW / 2,
      y: curY - 20,
      size: 14, font: fontB, color: item.cor,
    });

    const rW = fontN.widthOfTextAtSize(item.rotulo, 8);
    pg.drawText(item.rotulo, {
      x: cx - rW / 2,
      y: curY - 36,
      size: 8, font: fontN, color: COR.suave,
    });
  });

  curY -= RESUMO_H + 14;

  // -------------------------------------------------------------------
  // Sem manutenções
  // -------------------------------------------------------------------

  if (manutencoes.length === 0) {
    garantirEspaco(20);
    const msg = "Nenhuma manutenção registrada neste período.";
    const msgW = fontN.widthOfTextAtSize(msg, 10);
    pg.drawText(msg, {
      x: MAR + (CONT_W - msgW) / 2,
      y: curY - 14,
      size: 10, font: fontN, color: COR.suave,
    });
    curY -= 24;
  }

  // -------------------------------------------------------------------
  // Cards de manutenção
  // -------------------------------------------------------------------

  for (const man of manutencoes) {
    // --- Pré-calcula altura total do card ---
    const TAM_CODIGO = 9;
    const TAM_LOCAL  = 11;
    const TAM_DESC   = 9.5;
    const TAM_META   = 8;
    const LEADING    = 1.4;

    const hCodigo  = TAM_CODIGO * LEADING + 2;
    const hLocal   = altTexto(man.local_descricao,  fontB, TAM_LOCAL, INNER_W, LEADING) + 4;
    const hDesc    = altTexto(man.descricao,         fontN, TAM_DESC,  INNER_W, LEADING) + 2;
    const hMeta    = TAM_META * LEADING + 6;
    const hFotoReg = man.fotosRegistro.length  > 0 ? 88 + 6 : 0;

    let hResolucao = 0;
    if (man.status === "resolvida") {
      hResolucao += 8 + 14; // linha separadora + label "Resolução"
      hResolucao += altTexto(man.resolucao_descricao ?? "", fontN, TAM_DESC, INNER_W, LEADING) + 2;
      if (man.resolvido_em) hResolucao += TAM_META * LEADING + 4;
      if (man.fotosResolucao.length > 0) hResolucao += 88 + 6;
    }

    const hCard = PADDING_CARD * 2 + hCodigo + hLocal + hDesc + hMeta + hFotoReg + hResolucao;

    // Se o card inteiro cabe na página, garante o espaço de uma vez.
    // Se for maior que a área disponível, deixa fluir (vai cortar no Y_BASE).
    const espacoMaximo = Y_TOPO - Y_BASE;
    garantirEspaco(Math.min(hCard, espacoMaximo));

    const cardTop = curY;
    const cardBot = curY - hCard;

    // Retângulo do card
    pg.drawRectangle({
      x: MAR, y: cardBot,
      width: CONT_W, height: hCard,
      color: COR.branco,
      borderColor: COR.borda, borderWidth: 1,
    });

    // Cursor interno ao card, começa no topo interno
    let cy = cardTop - PADDING_CARD;

    // — Linha 1: código · tipo  +  tag de status —
    pg.drawText(`#${man.codigo} · ${man.tipo_nome}`, {
      x: MAR + PADDING_CARD,
      y: cy - TAM_CODIGO * 0.85,
      size: TAM_CODIGO, font: fontN, color: COR.suave,
    });

    // Tag de status
    const tagTxt = ROTULO_STATUS[man.status] ?? man.status;
    const tagW   = fontN.widthOfTextAtSize(tagTxt, 8) + 12;
    const tagCor = COR_STATUS[man.status] ?? COR.suave;
    pg.drawRectangle({
      x: PG_W - MAR - PADDING_CARD - tagW,
      y: cy - TAM_CODIGO * 0.85 - 3,
      width: tagW, height: 13,
      color: tagCor,
    });
    pg.drawText(tagTxt, {
      x: PG_W - MAR - PADDING_CARD - tagW + 6,
      y: cy - TAM_CODIGO * 0.85,
      size: 8, font: fontN, color: COR.branco,
    });

    cy -= hCodigo;

    // — Local —
    cy -= drawText(pg, man.local_descricao, fontB, TAM_LOCAL, COR.texto, MAR + PADDING_CARD, cy, INNER_W, LEADING);
    cy -= 4;

    // — Descrição —
    cy -= drawText(pg, man.descricao, fontN, TAM_DESC, COR.texto, MAR + PADDING_CARD, cy, INNER_W, LEADING);
    cy -= 2;

    // — Meta (registrado por/em) —
    const metaTxt = `Registrado em ${fmtDataHora(man.registrado_em)} por ${man.registrado_por_nome}`;
    cy -= drawText(pg, metaTxt, fontN, TAM_META, COR.suave, MAR + PADDING_CARD, cy, INNER_W, LEADING);
    cy -= 6;

    // — Fotos de registro —
    if (man.fotosRegistro.length > 0) {
      let fx = MAR + PADDING_CARD;
      for (const foto of man.fotosRegistro.slice(0, 5)) {
        try {
          const bytes = Buffer.from(foto.dataUri.split(",")[1], "base64");
          const img   = await doc.embedJpg(bytes);
          const dim   = img.scaleToFit(84, 84);
          pg.drawImage(img, { x: fx, y: cy - dim.height, width: dim.width, height: dim.height });
          fx += dim.width + 4;
        } catch { /* foto corrompida: ignora */ }
      }
      cy -= 88 + 6;
    }

    // — Bloco de resolução —
    if (man.status === "resolvida") {
      // Linha separadora
      pg.drawLine({
        start: { x: MAR + PADDING_CARD, y: cy },
        end:   { x: PG_W - MAR - PADDING_CARD, y: cy },
        thickness: 0.5, color: COR.borda,
      });
      cy -= 8;

      // Label "Resolução"
      pg.drawText("Resolução", {
        x: MAR + PADDING_CARD,
        y: cy - 8.5 * 0.85,
        size: 8.5, font: fontB, color: COR.resolvida,
      });
      cy -= 14;

      // Texto da resolução
      if (man.resolucao_descricao) {
        cy -= drawText(pg, man.resolucao_descricao, fontN, TAM_DESC, COR.texto, MAR + PADDING_CARD, cy, INNER_W, LEADING);
        cy -= 2;
      }

      // Data de resolução
      if (man.resolvido_em) {
        cy -= drawText(
          pg, `Resolvida em ${fmtDataHora(man.resolvido_em)}`,
          fontN, TAM_META, COR.suave, MAR + PADDING_CARD, cy, INNER_W, LEADING
        );
        cy -= 4;
      }

      // Fotos de resolução
      if (man.fotosResolucao.length > 0) {
        let fx = MAR + PADDING_CARD;
        for (const foto of man.fotosResolucao.slice(0, 5)) {
          try {
            const bytes = Buffer.from(foto.dataUri.split(",")[1], "base64");
            const img   = await doc.embedJpg(bytes);
            const dim   = img.scaleToFit(84, 84);
            pg.drawImage(img, { x: fx, y: cy - dim.height, width: dim.width, height: dim.height });
            fx += dim.width + 4;
          } catch { /* foto corrompida: ignora */ }
        }
        cy -= 88 + 6;
      }
    }

    curY = cardBot - 10; // espaço entre cards
  }

  // Rodapé da última página
  desenharRodape(pg, numPg);

  return doc.save();
}
