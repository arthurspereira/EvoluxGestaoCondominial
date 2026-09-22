import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export interface DiaCalendario {
  data: Date;
  iso: string; // yyyy-MM-dd, para comparar com data_calendario/data
  noMesAtual: boolean;
  hoje: boolean;
}

// Grade de semanas completas (começando no domingo) cobrindo o mês —
// inclui os dias de fechamento do mês anterior/seguinte para não deixar
// a grade com semanas incompletas.
export function montarGradeMes(referencia: Date): DiaCalendario[] {
  const inicio = startOfWeek(startOfMonth(referencia), { locale: ptBR });
  const fim = endOfWeek(endOfMonth(referencia), { locale: ptBR });

  return eachDayOfInterval({ start: inicio, end: fim }).map((data) => ({
    data,
    iso: format(data, "yyyy-MM-dd"),
    noMesAtual: isSameMonth(data, referencia),
    hoje: isToday(data),
  }));
}

export function mesAnterior(referencia: Date) {
  return subMonths(referencia, 1);
}

export function mesSeguinte(referencia: Date) {
  return addMonths(referencia, 1);
}

export function rotuloMes(referencia: Date) {
  return format(referencia, "MMMM 'de' yyyy", { locale: ptBR });
}

// Lê ano/mês da querystring (1-indexado, como as pessoas escrevem data)
// e cai para o mês atual quando ausente ou inválido.
export function referenciaDoParametro(mes?: string, ano?: string): Date {
  const hoje = new Date();
  const numeroMes = Number(mes);
  const numeroAno = Number(ano);

  if (!numeroMes || !numeroAno || numeroMes < 1 || numeroMes > 12) return hoje;

  return new Date(numeroAno, numeroMes - 1, 1);
}
