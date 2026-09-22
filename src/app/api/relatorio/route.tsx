import { NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { prepararFotosParaPdf } from "@/lib/pdf/imagens";
import { gerarRelatorioSemanal, type ManutencaoParaPdf } from "@/lib/pdf/relatorio-semanal";
import type { ManutencaoDetalhada, ManutencaoFoto } from "@/types/database";

// pdf-lib usa apenas JavaScript puro — funciona em Node runtime sem
// depender de binários nativos ou arquivos de fontes externos.
export const runtime = "nodejs";
// O relatório pode baixar e converter várias fotos antes de renderizar o PDF.
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

  const pdfBytes = await gerarRelatorioSemanal({
    clienteNome: cliente.nome,
    sindico: cliente.sindico,
    periodoInicio: de,
    periodoFim: ate,
    manutencoes: manutencoesParaPdf,
  });

  const nomeArquivo = `relatorio-${slugificar(cliente.nome)}-${de}-a-${ate}.pdf`;

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
