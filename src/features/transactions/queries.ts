import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const PAGE_SIZE = 30;

export const cursorSchema = z.object({ date: z.iso.date(), id: z.uuid() });
export type Cursor = z.infer<typeof cursorSchema>;

/** Transações da mais recente para a mais antiga, paginadas por (date, id). */
export async function listTransactions(cursor: Cursor | null) {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select(
      `id, type, status, description, amount, date,
       account:accounts!transactions_account_id_user_id_fkey(name),
       to_account:accounts!transactions_to_account_id_user_id_fkey(name),
       card:credit_cards!transactions_card_id_user_id_fkey(name),
       category:categories!transactions_category_id_user_id_fkey(name, color)`,
    )
    .order("date", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE + 1);
  if (cursor) {
    // cursor já validado por cursorSchema: seguro para interpolar no filtro.
    const { date, id } = cursorSchema.parse(cursor);
    query = query.or(`date.lt.${date},and(date.eq.${date},id.lt.${id})`);
  }
  const { data, error } = await query;
  if (error) throw error;

  const items = data.slice(0, PAGE_SIZE);
  const last = items.at(-1);
  return {
    items,
    next:
      data.length > PAGE_SIZE && last ? { date: last.date, id: last.id } : null,
  };
}

export type TransactionPage = Awaited<ReturnType<typeof listTransactions>>;
export type TransactionItem = TransactionPage["items"][number];
