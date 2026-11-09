import { toCents } from "@/lib/finance/money";

export type ReportTx = {
  type: string;
  amount: number;
  category_id: string | null;
  source: string | null;
  tags: string[];
};

export type CategoryInfo = {
  id: string;
  name: string;
  color: string | null;
  parent_id: string | null;
  nature: string;
};

export type Slice = { key: string; name: string; cents: number };
export type CategoryGroup = Slice & { color: string | null; children: Slice[] };

const sortDesc = <T extends { cents: number }>(xs: T[]) =>
  xs.sort((a, b) => b.cents - a.cents);

function sumBy(txs: ReportTx[], keyOf: (t: ReportTx) => string[]) {
  const out = new Map<string, number>();
  for (const t of txs)
    for (const k of keyOf(t)) out.set(k, (out.get(k) ?? 0) + toCents(t.amount));
  return out;
}

/** Despesas por categoria principal, com as subcategorias dentro. */
export function byCategory(
  txs: ReportTx[],
  categories: CategoryInfo[],
): CategoryGroup[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const leaf = sumBy(
    txs.filter((t) => t.type === "despesa"),
    (t) => [t.category_id ?? "none"],
  );
  const groups = new Map<string, CategoryGroup>();
  for (const [id, cents] of leaf) {
    const c = byId.get(id);
    const root = c?.parent_id ? byId.get(c.parent_id) : c;
    const key = root?.id ?? "none";
    const g = groups.get(key) ?? {
      key,
      name: root?.name ?? "Sem categoria",
      color: root?.color ?? null,
      cents: 0,
      children: [],
    };
    g.cents += cents;
    if (c?.parent_id) g.children.push({ key: id, name: c.name, cents });
    groups.set(key, g);
  }
  for (const g of groups.values()) sortDesc(g.children);
  return sortDesc([...groups.values()]);
}

/** Despesas por conta ou cartão. */
export function bySource(txs: ReportTx[]): Slice[] {
  const sums = sumBy(
    txs.filter((t) => t.type === "despesa"),
    (t) => [t.source ?? "Sem conta"],
  );
  return sortDesc(
    [...sums].map(([name, cents]) => ({ key: name, name, cents })),
  );
}

/** Despesas por tag (uma transação conta em cada tag que tiver). */
export function byTag(txs: ReportTx[]): Slice[] {
  const sums = sumBy(
    txs.filter((t) => t.type === "despesa"),
    (t) => t.tags,
  );
  return sortDesc(
    [...sums].map(([name, cents]) => ({ key: name, name, cents })),
  );
}

/** Receitas pela natureza da categoria (salário, renda extra...). */
export function incomeByNature(
  txs: ReportTx[],
  categories: CategoryInfo[],
  labels: Record<string, string>,
): Slice[] {
  const natureOf = new Map(categories.map((c) => [c.id, c.nature]));
  const sums = sumBy(
    txs.filter((t) => t.type === "receita"),
    (t) => [(t.category_id && natureOf.get(t.category_id)) || "outro"],
  );
  return sortDesc(
    [...sums].map(([n, cents]) => ({ key: n, name: labels[n] ?? n, cents })),
  );
}

/** Receitas e despesas (centavos) dos 12 meses até `endMonth` ("YYYY-MM"). */
export function evolution(
  rows: { month: string; type: string; total: number }[],
  months: string[],
) {
  return months.map((month) => {
    const of = (type: string) =>
      rows
        .filter((r) => r.month.slice(0, 7) === month && r.type === type)
        .reduce((s, r) => s + toCents(r.total), 0);
    return { month, receita: of("receita"), despesa: of("despesa") };
  });
}
