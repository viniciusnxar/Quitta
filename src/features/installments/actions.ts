"use server";

import { revalidatePath } from "next/cache";
import { fromCents } from "@/lib/finance/money";
import { createClient } from "@/lib/supabase/server";
import { installmentSchema, type InstallmentInput } from "./schema";

export async function createInstallmentPlan(
  input: InstallmentInput,
): Promise<{ error?: string }> {
  const parsed = installmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;

  const supabase = await createClient();
  if (v.category_id) {
    const { data } = await supabase
      .from("categories")
      .select("kind")
      .eq("id", v.category_id)
      .maybeSingle();
    if (data?.kind !== "despesa") return { error: "Categoria inválida." };
  }

  // A RPC grava o plano e todas as parcelas numa transação só.
  const amount = fromCents(v.amount_cents);
  const { error } = await supabase.rpc("create_installment_plan", {
    p_description: v.description,
    p_installment_count: v.count,
    p_first_date: v.first_date,
    ...(v.mode === "total"
      ? { p_total_amount: amount }
      : { p_installment_amount: amount }),
    p_card_id: v.card_id ?? undefined,
    p_account_id: v.account_id ?? undefined,
    p_category_id: v.category_id ?? undefined,
    p_start_installment: v.start,
    p_notes: v.notes || undefined,
  });
  if (error) return { error: "Não foi possível criar o parcelamento." };

  revalidatePath("/", "layout");
  return {};
}
