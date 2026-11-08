import { createClient } from "@/lib/supabase/server";

export async function listSubscriptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_subscriptions")
    .select(
      `id, provider, name, amount, cycle, start_date, status, account_id, card_id, category_id,
       monthly_equivalent, yearly_equivalent, next_charge,
       card:credit_cards!subscriptions_card_id_user_id_fkey(name),
       account:accounts!subscriptions_account_id_user_id_fkey(name)`,
    )
    .order("next_charge", { ascending: true, nullsFirst: false })
    .order("name");
  if (error) throw error;
  // Colunas de view vêm opcionais nos tipos; só next_charge pode ser nula de fato.
  return data.map((s) => ({
    ...s,
    id: s.id!,
    name: s.name ?? "",
    amount: s.amount ?? 0,
    cycle: s.cycle!,
    start_date: s.start_date!,
    status: s.status!,
    monthly_equivalent: s.monthly_equivalent ?? 0,
    yearly_equivalent: s.yearly_equivalent ?? 0,
  }));
}

export type Subscription = Awaited<
  ReturnType<typeof listSubscriptions>
>[number];
