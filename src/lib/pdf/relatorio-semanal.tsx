/* eslint-disable jsx-a11y/alt-text -- Image do @react-pdf/renderer não possui atributo alt. */
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import fs from "fs";
import path from "path";
import type { FotoParaPdf } from "./imagens";

// Carrega a logo uma única vez quando o módulo é importado.
// process.cwd() aponta para a raiz do projeto Next.js em ambiente de
// desenvolvimento e produção (runtime Node), onde public/ está disponível.
function carregarLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), "public", "marca.png");
    const buffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return "";
  }
}

const LOGO_BASE64 = carregarLogoBase64();

// Fontes: usar Helvetica embutida do PDF em vez de baixar Inter do Google
// Fonts durante a geração — a função serverless não deve depender de uma
// chamada de rede extra só para renderizar texto, e Helvetica já é
// suficientemente próxima do padrão visual do restante do sistema em PDF.

const CORES = {
  primaria: "#1463D9",
  texto: "#1F2937",
  textoSuave: "#6B7280",
  borda: "#E5E7EB",
  pendente: "#B45309",
  andamento: "#1463D9",
  resolvida: "#15803D",
};

const estilos = StyleSheet.create({
  pagina: { padding: 32, fontSize: 10, color: CORES.texto, fontFamily: "Helvetica" },
  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: CORES.primaria,
    paddingBottom: 12,
    marginBottom: 16,
  },
  tituloSistema: { fontSize: 18, fontFamily: "Helvetica-Bold", color: CORES.primaria },
  subtitulo: { fontSize: 9, color: CORES.textoSuave, marginTop: 2 },
  logoMarca: { width: 36, height: 36, objectFit: "contain" },
  blocoCliente: { alignItems: "flex-end" },
  nomeCliente: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  periodo: { fontSize: 9, color: CORES.textoSuave, marginTop: 2 },

  resumo: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 4,
  },
  resumoItem: { alignItems: "center" },
  resumoValor: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  resumoRotulo: { fontSize: 8, color: CORES.textoSuave },

  cardManutencao: {
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    breakInside: "avoid",
  },
  linhaCabecalhoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  codigo: { fontSize: 9, color: CORES.textoSuave },
  local: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  tag: {
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    color: "#FFFFFF",
  },
  descricao: { fontSize: 9.5, lineHeight: 1.4, marginBottom: 6 },
  metaLinha: { fontSize: 8, color: CORES.textoSuave, marginBottom: 6 },

  grupoFotos: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 4 },
  foto: { width: 84, height: 84, borderRadius: 3, objectFit: "cover" },

  blocoResolucao: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: CORES.borda,
  },
  rotuloResolucao: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: CORES.resolvida, marginBottom: 3 },

  rodape: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: CORES.textoSuave,
    borderTopWidth: 1,
    borderTopColor: CORES.borda,
    paddingTop: 6,
  },
});

const CORES_STATUS: Record<string, string> = {
  pendente: CORES.pendente,
  em_andamento: CORES.andamento,
  resolvida: CORES.resolvida,
};

const ROTULOS_STATUS: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  resolvida: "Resolvida",
};

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

interface RelatorioSemanalProps {
  clienteNome: string;
  sindico: string | null;
  periodoInicio: string; // ISO yyyy-MM-dd
  periodoFim: string;
  manutencoes: ManutencaoParaPdf[];
}

function formatarDataHora(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

// Boletim profissional para envio ao síndico (briefing, seções 11-12):
// cabeçalho com cliente e período, resumo numérico, e um bloco por
// manutenção com todos os dados e fotos — incluindo a resolução quando
// já existe.
export function RelatorioSemanal({
  clienteNome,
  sindico,
  periodoInicio,
  periodoFim,
  manutencoes,
}: RelatorioSemanalProps) {
  const resolvidas = manutencoes.filter((m) => m.status === "resolvida").length;
  const pendentes = manutencoes.filter((m) => m.status === "pendente").length;
  const andamento = manutencoes.filter((m) => m.status === "em_andamento").length;
  const geradoEm = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <Document title={`Relatório de manutenções — ${clienteNome}`}>
      <Page size="A4" style={estilos.pagina} wrap>
        <View style={estilos.cabecalho} fixed>
          <View>
            {LOGO_BASE64 ? (
              <Image src={LOGO_BASE64} style={estilos.logoMarca} />
            ) : (
              <Text style={estilos.tituloSistema}>Evolux</Text>
            )}
            <Text style={estilos.subtitulo}>Relatório semanal de manutenções</Text>
          </View>
          <View style={estilos.blocoCliente}>
            <Text style={estilos.nomeCliente}>{clienteNome}</Text>
            {sindico && <Text style={estilos.periodo}>A/C: {sindico}</Text>}
            <Text style={estilos.periodo}>
              {format(new Date(`${periodoInicio}T00:00:00`), "dd/MM/yyyy")} a{" "}
              {format(new Date(`${periodoFim}T00:00:00`), "dd/MM/yyyy")}
            </Text>
          </View>
        </View>

        <View style={estilos.resumo}>
          <View style={estilos.resumoItem}>
            <Text style={estilos.resumoValor}>{manutencoes.length}</Text>
            <Text style={estilos.resumoRotulo}>Total no período</Text>
          </View>
          <View style={estilos.resumoItem}>
            <Text style={[estilos.resumoValor, { color: CORES.pendente }]}>{pendentes}</Text>
            <Text style={estilos.resumoRotulo}>Pendentes</Text>
          </View>
          <View style={estilos.resumoItem}>
            <Text style={[estilos.resumoValor, { color: CORES.andamento }]}>{andamento}</Text>
            <Text style={estilos.resumoRotulo}>Em andamento</Text>
          </View>
          <View style={estilos.resumoItem}>
            <Text style={[estilos.resumoValor, { color: CORES.resolvida }]}>{resolvidas}</Text>
            <Text style={estilos.resumoRotulo}>Resolvidas</Text>
          </View>
        </View>

        {manutencoes.length === 0 ? (
          <Text style={{ textAlign: "center", color: CORES.textoSuave, marginTop: 24 }}>
            Nenhuma manutenção registrada neste período.
          </Text>
        ) : (
          manutencoes.map((manutencao) => (
            <View key={manutencao.codigo} style={estilos.cardManutencao} wrap={false}>
              <View style={estilos.linhaCabecalhoCard}>
                <View>
                  <Text style={estilos.codigo}>#{manutencao.codigo} · {manutencao.tipo_nome}</Text>
                  <Text style={estilos.local}>{manutencao.local_descricao}</Text>
                </View>
                <Text
                  style={[estilos.tag, { backgroundColor: CORES_STATUS[manutencao.status] }]}
                >
                  {ROTULOS_STATUS[manutencao.status]}
                </Text>
              </View>

              <Text style={estilos.descricao}>{manutencao.descricao}</Text>
              <Text style={estilos.metaLinha}>
                Registrado em {formatarDataHora(manutencao.registrado_em)} por{" "}
                {manutencao.registrado_por_nome}
              </Text>

              {manutencao.fotosRegistro.length > 0 && (
                <View style={estilos.grupoFotos}>
                  {manutencao.fotosRegistro.map((foto, indice) => (
                    <Image key={indice} src={foto.dataUri} style={estilos.foto} />
                  ))}
                </View>
              )}

              {manutencao.status === "resolvida" && (
                <View style={estilos.blocoResolucao}>
                  <Text style={estilos.rotuloResolucao}>Resolução</Text>
                  <Text style={estilos.descricao}>{manutencao.resolucao_descricao}</Text>
                  {manutencao.resolvido_em && (
                    <Text style={estilos.metaLinha}>
                      Resolvida em {formatarDataHora(manutencao.resolvido_em)}
                    </Text>
                  )}
                  {manutencao.fotosResolucao.length > 0 && (
                    <View style={estilos.grupoFotos}>
                      {manutencao.fotosResolucao.map((foto, indice) => (
                        <Image key={indice} src={foto.dataUri} style={estilos.foto} />
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          ))
        )}

        <View style={estilos.rodape} fixed>
          <Text>Gerado em {geradoEm} pelo Evolux Gestão Condominial</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
