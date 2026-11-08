import { createClient } from "@/lib/supabase/server";

const SELECT = `id, description, total_amount, installment_amount, installment_count,
  paid_installments, remaining_installments, remaining_amount, next_date, is_active, notes,
  card:credit_cards!installment_plans_card_id_user_id_fkey(name),
  account:accounts!installment_plans_account_id_user_id_fkey(name),
  category:categories!installment_plans_category_id_user_id_fkey(name, color)`;

// Colunas de view vêm opcionais nos tipos; na prática só next_date é nula (plano quitado).
function normalize<
  T extends {
    id: string | null;
    description: string | null;
    total_amount: number | null;
    installment_amount: number | null;
    installment_count: number | null;
    paid_installments: number | null;
    remaining_amount: number | null;
    is_active: boolean | null;
  },
>(p: T) {
  return {
    ...p,
    id: p.id!,
    description: p.description ?? "",
    total_amount: p.total_amount ?? 0,
    installment_amount: p.installment_amount ?? 0,
    installment_count: p.installment_count ?? 0,
    paid_installments: p.paid_installments ?? 0,
    remaining_amount: p.remaining_amount ?? 0,
    is_active: !!p.is_active,
  };
}

/** Planos ativos primeiro (pela próxima parcela), depois os quitados. */
export async function listInstallmentPlans() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_installment_plans")
    .select(SELECT)
    .order("is_active", { ascending: false })
    .order("next_date", { ascending: true, nullsFirst: false })
    .order("description");
  if (error) throw error;
  return data.map(normalize);
}

export type InstallmentPlan = Awaited<
  ReturnType<typeof listInstallmentPlans>
>[number];

export async function getInstallmentPlan(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_installment_plans")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data && normalize(data);
}
