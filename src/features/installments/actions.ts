"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromCents } from "@/lib/finance/money";
import { createClient } from "@/lib/supabase/server";
import { installmentSchema, type InstallmentInput } from "./schema";

type Client = Awaited<ReturnType<typeof createClient>>;

export async function createInstallmentPlan(
  input: InstallmentInput,
): Promise<{ error?: string }> {
  const parsed = installmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const res = await insertPlan(await createClient(), parsed.data);
  if ("error" in res) return res;
  revalidatePath("/", "layout");
  return {};
}

async function insertPlan(
  supabase: Client,
  v: InstallmentInput,
): Promise<{ id: string } | { error: string }> {
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
  const { data, error } = await supabase.rpc("create_installment_plan", {
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
  if (error || !data)
    return { error: "Não foi possível criar o parcelamento." };
  return { id: data };
}

/**
 * Editar = recriar o plano com os novos dados (as parcelas dependem de
 * valor/quantidade/data) e manter como pagas as parcelas que já estavam.
 */
export async function updateInstallmentPlan(
  id: string,
  input: InstallmentInput,
): Promise<{ id?: string; error?: string }> {
  if (!z.uuid().safeParse(id).success)
    return { error: "Parcelamento inválido." };
  const parsed = installmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: paid, error: readError } = await supabase
    .from("transactions")
    .select("installment_number")
    .eq("installment_plan_id", id)
    .eq("status", "pago");
  if (readError) return { error: "Não foi possível salvar o parcelamento." };

  const res = await insertPlan(supabase, parsed.data);
  if ("error" in res) return res;

  const paidNumbers = paid.map((t) => t.installment_number!).filter(Boolean);
  if (paidNumbers.length > 0)
    await supabase
      .from("transactions")
      .update({ status: "pago" })
      .eq("installment_plan_id", res.id)
      .in("installment_number", paidNumbers);

  // Parcelas do plano antigo caem junto (on delete cascade).
  const { error } = await supabase
    .from("installment_plans")
    .delete()
    .eq("id", id);
  if (error) {
    await supabase.from("installment_plans").delete().eq("id", res.id);
    return { error: "Não foi possível salvar o parcelamento." };
  }

  revalidatePath("/", "layout");
  return { id: res.id };
}

export async function deleteInstallmentPlan(
  id: string,
): Promise<{ error?: string }> {
  if (!z.uuid().safeParse(id).success)
    return { error: "Parcelamento inválido." };
  const supabase = await createClient();
  // Parcelas (transações) caem junto (on delete cascade).
  const { error } = await supabase
    .from("installment_plans")
    .delete()
    .eq("id", id);
  if (error) return { error: "Não foi possível excluir o parcelamento." };
  revalidatePath("/", "layout");
  return {};
}
