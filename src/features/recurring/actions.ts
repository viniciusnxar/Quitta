"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromCents } from "@/lib/finance/money";
import { createClient } from "@/lib/supabase/server";
import { recurringSchema, type RecurringInput } from "./schema";

export async function saveRecurringRule(
  id: string | null,
  input: RecurringInput,
): Promise<{ error?: string }> {
  const parsed = recurringSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (id && !z.uuid().safeParse(id).success)
    return { error: "Recorrência inválida." };
  const { amount_cents, ...rest } = parsed.data;
  const category_id = rest.type === "transferencia" ? null : rest.category_id;

  const supabase = await createClient();
  if (category_id) {
    const { data } = await supabase
      .from("categories")
      .select("kind")
      .eq("id", category_id)
      .maybeSingle();
    if (data?.kind !== rest.type) return { error: "Categoria inválida." };
  }

  // Na edição, o trigger atualiza (ou refaz) as ocorrências futuras previstas.
  const row = { ...rest, category_id, amount: fromCents(amount_cents) };
  const { error } = id
    ? await supabase.from("recurring_rules").update(row).eq("id", id)
    : await supabase.from("recurring_rules").insert(row);
  if (error) return { error: "Não foi possível salvar a recorrência." };
  return generate("Recorrência salva, mas os lançamentos não foram gerados.");
}

/** Pausar apaga as ocorrências futuras previstas (trigger); reativar gera de novo. */
export async function setRecurringActive(
  id: string,
  is_active: boolean,
): Promise<{ error?: string }> {
  if (!z.uuid().safeParse(id).success)
    return { error: "Recorrência inválida." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_rules")
    .update({ is_active: !!is_active })
    .eq("id", id);
  if (error) return { error: "Não foi possível atualizar a recorrência." };
  return generate("Reativada, mas os lançamentos não foram gerados.");
}

/** O trigger apaga as previstas; as já pagas ficam no histórico. */
export async function deleteRecurringRule(
  id: string,
): Promise<{ error?: string }> {
  if (!z.uuid().safeParse(id).success)
    return { error: "Recorrência inválida." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_rules")
    .delete()
    .eq("id", id);
  if (error) return { error: "Não foi possível excluir a recorrência." };
  revalidatePath("/", "layout");
  return {};
}

async function generate(failMessage: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("generate_recurring");
  revalidatePath("/", "layout");
  return error ? { error: failMessage } : {};
}
