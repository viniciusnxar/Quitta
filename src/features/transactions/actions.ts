"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { today } from "@/lib/finance/dates";
import { fromCents } from "@/lib/finance/money";
import { createClient } from "@/lib/supabase/server";
import { loadFilters } from "./filters";
import { cursorSchema, listTransactions, type Cursor } from "./queries";
import { transactionSchema, type TransactionInput } from "./schema";

/** Próxima página da lista (rolagem infinita). `search` = query string da URL. */
export async function loadMoreTransactions(search: string, cursor: Cursor) {
  return listTransactions(loadFilters(search), cursorSchema.parse(cursor));
}

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

const idSchema = z.uuid();

/** Marca como pago (efetivado hoje) ou volta para previsto. */
export async function setTransactionPaid(
  id: string,
  paid: boolean,
): Promise<{ error?: string }> {
  if (!idSchema.safeParse(id).success) return { error: "Transação inválida." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update(
      paid
        ? { status: "pago", paid_at: today() }
        : { status: "previsto", paid_at: null },
    )
    .eq("id", id);
  if (error) return { error: "Não foi possível atualizar a transação." };
  revalidatePath("/", "layout");
  return {};
}

/** Copia a transação (com as tags) para hoje. Só tipos lançados pelo formulário. */
export async function duplicateTransaction(
  id: string,
): Promise<{ error?: string }> {
  if (!idSchema.safeParse(id).success) return { error: "Transação inválida." };
  const supabase = await createClient();
  const { data: t } = await supabase
    .from("transactions")
    .select(
      "type, status, description, amount, account_id, to_account_id, card_id, category_id, notes, transaction_tags(tag_id)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!t) return { error: "Transação não encontrada." };
  if (!["receita", "despesa", "transferencia"].includes(t.type))
    return { error: "Este tipo de lançamento não pode ser duplicado." };

  const { transaction_tags, status, ...copy } = t;
  // Vínculos de parcela/assinatura/fatura não são copiados; o trigger recalcula a fatura.
  const { data: created, error } = await supabase
    .from("transactions")
    .insert({
      ...copy,
      status: status === "cancelado" ? "pago" : status,
      date: today(),
    })
    .select("id")
    .single();
  if (error) return { error: "Não foi possível duplicar a transação." };

  if (transaction_tags.length > 0) {
    const { error: tagError } = await supabase.from("transaction_tags").insert(
      transaction_tags.map(({ tag_id }) => ({
        transaction_id: created.id,
        tag_id,
      })),
    );
    if (tagError) {
      await supabase.from("transactions").delete().eq("id", created.id);
      return { error: "Não foi possível duplicar as tags." };
    }
  }

  revalidatePath("/", "layout");
  return {};
}

export async function deleteTransaction(
  id: string,
): Promise<{ error?: string }> {
  if (!idSchema.safeParse(id).success) return { error: "Transação inválida." };
  const supabase = await createClient();
  // transaction_tags cai junto (on delete cascade).
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir a transação." };
  revalidatePath("/", "layout");
  return {};
}
