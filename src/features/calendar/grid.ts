import { monthBounds } from "@/lib/finance/dates";

/** Semanas do mês (domingo primeiro); null = dia de fora do mês. */
export function monthGrid(month: string): (string | null)[][] {
  const { end } = monthBounds(month);
  const [y, m] = month.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = Number(end.slice(8));
  const cells: (string | null)[] = Array(firstWeekday).fill(null);
  for (let d = 1; d <= days; d++)
    cells.push(`${month}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) =>
    cells.slice(i * 7, i * 7 + 7),
  );
}
