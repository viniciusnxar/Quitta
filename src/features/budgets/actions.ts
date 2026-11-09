"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromCents } from "@/lib/finance/money";
import { createClient } from "@/lib/supabase/server";
import { budgetSchema, type BudgetInput } from "./schema";

export async function saveBudget(
  input: BudgetInput,
): Promise<{ error?: string }> {
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { category_id, amount_cents, month, every_month } = parsed.data;
  const monthStart = `${month}-01`;

  const supabase = await createClient();
  if (category_id) {
    const { data } = await supabase
      .from("categories")
      .select("kind, parent_id")
      .eq("id", category_id)
      .maybeSingle();
    if (data?.kind !== "despesa" || data.parent_id)
      return { error: "Categoria inválida." };
  }

  // unique nulls not distinct (user_id, category_id, month): upsert pela chave.
  const { error } = await supabase.from("budgets").upsert(
    {
      category_id,
      month: every_month ? null : monthStart,
      amount: fromCents(amount_cents),
    },
    { onConflict: "user_id,category_id,month" },
  );
  if (error) return { error: "Não foi possível salvar o limite." };

  // "Todo mês" no mês visto: tira o valor específico dele para valer o novo padrão.
  if (every_month) {
    const q = supabase.from("budgets").delete().eq("month", monthStart);
    await (category_id
      ? q.eq("category_id", category_id)
      : q.is("category_id", null));
  }
  revalidatePath("/", "layout");
  return {};
}

export async function deleteBudget(id: string): Promise<{ error?: string }> {
  if (!z.uuid().safeParse(id).success) return { error: "Limite inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) return { error: "Não foi possível remover o limite." };
  revalidatePath("/", "layout");
  return {};
}
