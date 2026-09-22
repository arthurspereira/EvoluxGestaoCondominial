import { NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { prepararFotosParaPdf } from "@/lib/pdf/imagens";
import type { ManutencaoParaPdf } from "@/lib/pdf/relatorio-semanal";
import type { Cliente, ManutencaoDetalhada, ManutencaoFoto } from "@/types/database";

// @react-pdf/renderer e sharp precisam do runtime Node — não funcionam
// no Edge Runtime.
export const runtime = "nodejs";
// O relatório pode baixar e converter várias fotos antes de renderizar o PDF.
// O limite padrão de 10 s da função é insuficiente para esse fluxo em produção.
export const maxDuration = 30;

function slugificar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();
}

export async function GET(request: NextRequest) {
  const parametros = request.nextUrl.searchParams;
  const clienteId = parametros.get("cliente");
  const de = parametros.get("de");
  const ate = parametros.get("ate");

  if (!clienteId || !de || !ate) {
    return new Response("Informe cliente, data inicial e data final.", { status: 400 });
  }

  const supabase = await criarClienteServidor();

  // getUser() força a verificação da sessão (RLS já protege as tabelas,
  // mas falhar cedo aqui evita gastar tempo baixando fotos à toa).
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) {
    return new Response("Não autenticado.", { status: 401 });
  }

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", clienteId)
    .maybeSingle();

  if (!cliente) {
    return new Response("Cliente não encontrado.", { status: 404 });
  }

  const { data: manutencoes } = await supabase
    .from("manutencoes_detalhadas")
    .select("*")
    .eq("cliente_id", clienteId)
    .gte("data_calendario", de)
    .lte("data_calendario", ate)
    .order("data_calendario", { ascending: true })
    .returns<ManutencaoDetalhada[]>();

  const listaManutencoes = manutencoes ?? [];

  const { data: fotos } = listaManutencoes.length
    ? await supabase
        .from("manutencao_fotos")
        .select("*")
        .in("manutencao_id", listaManutencoes.map((m) => m.id))
        .order("ordem")
        .returns<ManutencaoFoto[]>()
    : { data: [] as ManutencaoFoto[] };

  const listaFotos = fotos ?? [];

  // Converte cada foto uma única vez (independente de aparecer em
  // "registro" ou "resolução") e reaproveita pelo caminho no Storage.
  const fotosConvertidas = await prepararFotosParaPdf(
    supabase,
    listaFotos.map((f) => f.storage_path)
  );

  const manutencoesParaPdf: ManutencaoParaPdf[] = listaManutencoes.map((manutencao) => {
    const fotosDaManutencao = listaFotos.filter((f) => f.manutencao_id === manutencao.id);

    const paraFotosPdf = (etapa: "registro" | "resolucao") =>
      fotosDaManutencao
        .filter((f) => f.etapa === etapa)
        .map((f) => fotosConvertidas.get(f.storage_path))
        .filter((f): f is NonNullable<typeof f> => Boolean(f));

    return {
      codigo: manutencao.codigo,
      local_descricao: manutencao.local_descricao,
      tipo_nome: manutencao.tipo_nome,
      descricao: manutencao.descricao,
      status: manutencao.status,
      registrado_em: manutencao.registrado_em,
      registrado_por_nome: manutencao.registrado_por_nome,
      resolucao_descricao: manutencao.resolucao_descricao,
      resolvido_em: manutencao.resolvido_em,
      fotosRegistro: paraFotosPdf("registro"),
      fotosResolucao: paraFotosPdf("resolucao"),
    };
  });

  // Import dinâmico: garante que o @react-pdf/renderer (e o pdfkit que ele
  // usa internamente) só seja carregado aqui dentro, nunca no bootstrap do
  // servidor. Isso evita o erro de MODULE_NOT_FOUND das fontes do pdfkit
  // que ocorre quando o módulo é avaliado estaticamente pelo Next.js.
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { RelatorioSemanal } = await import("@/lib/pdf/relatorio-semanal");

  const buffer = await renderToBuffer(
    <RelatorioSemanal
      clienteNome={cliente.nome}
      sindico={cliente.sindico}
      periodoInicio={de}
      periodoFim={ate}
      manutencoes={manutencoesParaPdf}
    />
  );

  const nomeArquivo = `relatorio-${slugificar(cliente.nome)}-${de}-a-${ate}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
