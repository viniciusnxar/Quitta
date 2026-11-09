import { createClient } from "@/lib/supabase/server";

/** Formato do jsonb de `get_dashboard` (valores em reais). */
export type Dashboard = {
  month: string;
  total_balance: number;
  projected_balance: number;
  accounts: {
    id: string;
    name: string;
    institution: string | null;
    color: string | null;
    balance: number;
  }[];
  cash_flow: {
    income_realized: number;
    income_expected: number;
    expense_realized: number;
    expense_expected: number;
  };
  spending: {
    budget: number | null;
    spent: number;
    committed: number;
    remaining: number | null;
  };
  installments: {
    active_count: number;
    remaining_amount: number;
    month_amount: number;
  };
  cards: {
    limit: number;
    used: number;
    available: number;
    items: {
      id: string;
      name: string;
      color: string | null;
      limit: number;
      used: number;
      available: number;
      used_pct: number | null;
    }[];
  };
  subscriptions: { active_count: number; monthly_total: number };
  investments_total: number;
  top_categories: { category_id: string | null; name: string; total: number }[];
  upcoming: {
    source: "transacao" | "fatura";
    id: string;
    description: string;
    amount: number;
    date: string;
    type: string;
  }[];
};

/** month = "YYYY-MM". */
export async function getDashboard(month: string): Promise<Dashboard> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard", {
    p_month: `${month}-01`,
  });
  if (error) throw error;
  return data as unknown as Dashboard;
}
