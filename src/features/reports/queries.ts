import { monthBounds, shiftMonth } from "@/lib/finance/dates";
import { createClient } from "@/lib/supabase/server";
import type { ReportTx } from "./aggregate";

/** Todas as transações do mês (sem as canceladas), da mais antiga para a mais nova. */
export async function listMonthTransactions(month: string) {
  const { start, end } = monthBounds(month);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `id, type, status, description, amount, date, category_id, notes,
       account:accounts!transactions_account_id_user_id_fkey(name),
       to_account:accounts!transactions_to_account_id_user_id_fkey(name),
       card:credit_cards!transactions_card_id_user_id_fkey(name),
       category:categories!transactions_category_id_user_id_fkey(name),
       transaction_tags(tags!transaction_tags_tag_id_user_id_fkey(name))`,
    )
    .gte("date", start)
    .lte("date", end)
    .neq("status", "cancelado")
    .order("date")
    .order("created_at");
  if (error) throw error;
  return data.map(({ transaction_tags, ...t }) => ({
    ...t,
    tags: transaction_tags.flatMap((tt) => (tt.tags ? [tt.tags.name] : [])),
  }));
}

export type MonthTransaction = Awaited<
  ReturnType<typeof listMonthTransactions>
>[number];

export const toReportTx = (t: MonthTransaction): ReportTx => ({
  type: t.type,
  amount: t.amount,
  category_id: t.category_id,
  source: t.card ? `${t.card.name} (cartão)` : (t.account?.name ?? null),
  tags: t.tags,
});

/** Os 12 meses terminando em `month`. */
export function last12(month: string) {
  return Array.from({ length: 12 }, (_, i) => shiftMonth(month, i - 11));
}

export async function getEvolutionRows(month: string) {
  const months = last12(month);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_monthly_by_category")
    .select("month, type, total")
    .gte("month", `${months[0]}-01`)
    .lte("month", `${month}-01`);
  if (error) throw error;
  return {
    months,
    rows: data.map((r) => ({
      month: r.month ?? "",
      type: r.type ?? "",
      total: r.total ?? 0,
    })),
  };
}
