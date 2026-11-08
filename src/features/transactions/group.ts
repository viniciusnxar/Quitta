import { toCents } from "@/lib/finance/money";

type Row = { type: string; status: string; amount: number; date: string };

/** Sinal no resultado do dia: receita soma, despesa subtrai; o resto não é ganho nem gasto. */
export function signedCents(t: Row): number {
  if (t.status === "cancelado") return 0;
  if (t.type === "receita") return toCents(t.amount);
  if (t.type === "despesa") return -toCents(t.amount);
  return 0;
}

/** Agrupa itens já ordenados por data (desc) mantendo a ordem. */
export function groupByDay<T extends Row>(items: T[]) {
  const days: { date: string; items: T[]; totalCents: number }[] = [];
  for (const item of items) {
    let day = days.at(-1);
    if (day?.date !== item.date) {
      day = { date: item.date, items: [], totalCents: 0 };
      days.push(day);
    }
    day.items.push(item);
    day.totalCents += signedCents(item);
  }
  return days;
}
