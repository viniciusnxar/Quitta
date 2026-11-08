// Datas de competência são strings "YYYY-MM-DD"; meses, "YYYY-MM".
// Nada aqui converte para Date com fuso: as contas são feitas nos próprios números.

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TZ = "America/Sao_Paulo";
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Hoje no fuso do Brasil, como "YYYY-MM-DD" (igual no servidor e no navegador). */
export function today(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

export function currentMonth(now = new Date()): string {
  return today(now).slice(0, 7);
}

export function isMonth(value: string | null | undefined): value is string {
  return !!value && MONTH_RE.test(value);
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const mm = String((((total % 12) + 12) % 12) + 1).padStart(2, "0");
  return `${Math.floor(total / 12)}-${mm}`;
}

function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Primeiro e último dia do mês: "2026-02" → { start: "2026-02-01", end: "2026-02-28" }. */
export function monthBounds(month: string): { start: string; end: string } {
  return {
    start: `${month}-01`,
    end: `${month}-${String(daysInMonth(month)).padStart(2, "0")}`,
  };
}

/**
 * Soma meses mantendo o dia, limitado ao fim do mês (igual ao `date + interval 'n month'`
 * do Postgres): "2026-01-31" + 1 → "2026-02-28".
 */
export function addMonths(date: string, months: number): string {
  const month = shiftMonth(date.slice(0, 7), months);
  const day = Math.min(Number(date.slice(8, 10)), daysInMonth(month));
  return `${month}-${String(day).padStart(2, "0")}`;
}

// Meio-dia local: o dia não muda em nenhum fuso ao formatar.
function toLocalDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

/** "2026-11-08" → "08/11/2026" (ou outro padrão do date-fns). */
export function formatDate(date: string, pattern = "dd/MM/yyyy"): string {
  return format(toLocalDate(date), pattern, { locale: ptBR });
}

/** "2026-11" → "Novembro 2026". */
export function formatMonth(month: string): string {
  const label = format(toLocalDate(`${month}-01`), "MMMM yyyy", {
    locale: ptBR,
  });
  return label[0].toUpperCase() + label.slice(1);
}
