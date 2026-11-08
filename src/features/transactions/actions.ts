"use server";

import { revalidatePath } from "next/cache";
import { fromCents } from "@/lib/finance/money";
import { createClient } from "@/lib/supabase/server";
import { transactionSchema, type TransactionInput } from "./schema";

/** Opções do formulário, buscadas ao abrir para nunca ficarem velhas. */
export async function loadTransactionOptions() {
  const supabase = await createClient();
  const [accounts, cards, categories, tags] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, color")
      .is("archived_at", null)
      .order("sort_order")
      .order("name"),
    supabase
      .from("credit_cards")
      .select("id, name, color")
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("categories")
      .select("id, name, kind, parent_id, color")
      .is("archived_at", null)
      .order("name"),
    supabase.from("tags").select("id, name, color").order("name"),
  ]);
  const failed = [accounts, cards, categories, tags].find((r) => r.error);
  if (failed) throw failed.error;
  return {
    accounts: accounts.data ?? [],
    cards: cards.data ?? [],
    categories: categories.data ?? [],
    tags: tags.data ?? [],
  };
}

export type TransactionOptions = Awaited<
  ReturnType<typeof loadTransactionOptions>
>;

export async function createTransaction(
  input: TransactionInput,
): Promise<{ error?: string }> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { amount_cents, tag_ids, notes, ...t } = parsed.data;
  const transfer = t.type === "transferencia";
  const category_id = transfer ? null : t.category_id;

  const supabase = await createClient();

  if (category_id) {
    const { data } = await supabase
      .from("categories")
      .select("kind")
      .eq("id", category_id)
      .maybeSingle();
    if (data?.kind !== t.type) return { error: "Categoria inválida." };
  }

  // user_id vem do default auth.uid(); FKs (id, user_id) barram ids de outro usuário.
  const { data: created, error } = await supabase
    .from("transactions")
    .insert({
      ...t,
      category_id,
      amount: fromCents(amount_cents),
      notes: notes || null,
    })
    .select("id")
    .single();
  if (error) return { error: "Não foi possível salvar a transação." };

  if (tag_ids.length > 0 && !transfer) {
    const { error: tagError } = await supabase
      .from("transaction_tags")
      .insert(
        tag_ids.map((tag_id) => ({ transaction_id: created.id, tag_id })),
      );
    if (tagError) {
      // Os dois inserts não são atômicos: desfaz para não deixar lançamento sem as tags.
      await supabase.from("transactions").delete().eq("id", created.id);
      return { error: "Não foi possível salvar as tags." };
    }
  }

  revalidatePath("/", "layout");
  return {};
}
