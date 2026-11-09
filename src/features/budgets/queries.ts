import { getDashboard } from "@/features/dashboard/queries";
import { toCents } from "@/lib/finance/money";
import { createClient } from "@/lib/supabase/server";
import { rollupToRoots } from "./resolve";

export async function listBudgets() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("id, category_id, month, amount");
  if (error) throw error;
  return data;
}

/** Gasto global do mês (mesma conta do dashboard: realizado e com previstos). */
export async function getMonthSpending(month: string) {
  const { spending } = await getDashboard(month);
  return { spent: spending.spent, committed: spending.committed };
}

/** Despesas do mês (inclui previstas) por categoria principal, em centavos. */
export async function getCategorySpending(
  month: string,
  categories: { id: string; parent_id: string | null }[],
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_monthly_by_category")
    .select("category_id, total")
    .eq("month", `${month}-01`)
    .eq("type", "despesa");
  if (error) throw error;
  return rollupToRoots(
    categories,
    data.map((r) => ({
      category_id: r.category_id,
      cents: toCents(r.total ?? 0),
    })),
  );
}
