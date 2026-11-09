import { createClient } from "@/lib/supabase/server";

/** Ativas primeiro, por descrição. */
export async function listRecurringRules() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_rules")
    .select(
      `id, type, description, amount, cycle, start_date, end_date, account_id, to_account_id,
       card_id, category_id, auto_confirm, is_active,
       account:accounts!recurring_rules_account_id_user_id_fkey(name),
       to_account:accounts!recurring_rules_to_account_id_user_id_fkey(name),
       card:credit_cards!recurring_rules_card_id_user_id_fkey(name)`,
    )
    .order("is_active", { ascending: false })
    .order("description");
  if (error) throw error;
  return data.map((r) => ({
    ...r,
    // O check do banco restringe o tipo às três opções do formulário.
    type: r.type as "receita" | "despesa" | "transferencia",
  }));
}

export type RecurringRule = Awaited<
  ReturnType<typeof listRecurringRules>
>[number];
