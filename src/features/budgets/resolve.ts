export type BudgetRow = {
  id: string;
  category_id: string | null;
  /** "YYYY-MM-01" ou null (valor padrão de todo mês). */
  month: string | null;
  amount: number;
};

/** Linha do mês sobrescreve a padrão (mesma regra do get_dashboard). */
export function resolveBudget(
  rows: BudgetRow[],
  categoryId: string | null,
  monthStart: string,
): BudgetRow | null {
  const mine = rows.filter((r) => r.category_id === categoryId);
  return (
    mine.find((r) => r.month === monthStart) ??
    mine.find((r) => r.month === null) ??
    null
  );
}

/** Soma o gasto das subcategorias na categoria principal (em centavos). */
export function rollupToRoots(
  categories: { id: string; parent_id: string | null }[],
  totals: { category_id: string | null; cents: number }[],
): Map<string, number> {
  const parentOf = new Map(categories.map((c) => [c.id, c.parent_id]));
  const out = new Map<string, number>();
  for (const { category_id, cents } of totals) {
    if (!category_id) continue;
    const root = parentOf.get(category_id) ?? category_id;
    out.set(root, (out.get(root) ?? 0) + cents);
  }
  return out;
}
