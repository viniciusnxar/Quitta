"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { today } from "@/lib/finance/dates";
import { fromCents, toCents } from "@/lib/finance/money";
import { createClient } from "@/lib/supabase/server";
import {
  extraPaymentSchema,
  financingSchema,
  type ExtraPaymentInput,
  type FinancingInput,
} from "./schema";

export async function saveFinancing(
  id: string | null,
  input: FinancingInput,
): Promise<{ error?: string }> {
  const parsed = financingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (id && !z.uuid().safeParse(id).success)
    return { error: "Financiamento inválido." };
  const {
    financed_cents,
    down_payment_cents,
    monthly_fees_cents,
    institution,
    ...rest
  } = parsed.data;

  const supabase = await createClient();
  if (rest.category_id) {
    const { data } = await supabase
      .from("categories")
      .select("kind")
      .eq("id", rest.category_id)
      .maybeSingle();
    if (data?.kind !== "despesa") return { error: "Categoria inválida." };
  }

  const row = {
    ...rest,
    institution: institution || null,
    financed_amount: fromCents(financed_cents),
    down_payment: fromCents(down_payment_cents),
    monthly_fees: fromCents(monthly_fees_cents),
    interest_rate: rest.system === "sem_juros" ? 0 : rest.interest_rate,
  };
  const { data: saved, error } = id
    ? await supabase
        .from("financings")
        .update(row)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase.from("financings").insert(row).select("id").single();
  if (error) return { error: "Não foi possível salvar o financiamento." };

  // Cria/recalcula as parcelas e uma transação prevista para cada parcela futura.
  const { error: genError } = await supabase.rpc(
    "generate_financing_schedule",
    { p_financing_id: saved.id },
  );
  revalidatePath("/", "layout");
  if (genError)
    return {
      error:
        "Financiamento salvo, mas o cronograma não foi gerado. Tente salvar de novo.",
    };
  return {};
}

/** Lança a amortização extra (saída da conta de débito) e recalcula o cronograma. */
export async function addExtraPayment(
  financingId: string,
  input: ExtraPaymentInput,
): Promise<{ error?: string }> {
  const parsed = extraPaymentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!z.uuid().safeParse(financingId).success)
    return { error: "Financiamento inválido." };
  const { payment_date, amount_cents, strategy } = parsed.data;

  const supabase = await createClient();
  const [{ data: f }, { data: last }] = await Promise.all([
    supabase
      .from("v_financings")
      .select("name, account_id, category_id, outstanding_balance")
      .eq("id", financingId)
      .maybeSingle(),
    supabase
      .from("financing_installments")
      .select("due_date")
      .eq("financing_id", financingId)
      .order("number", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!f?.account_id || !last) return { error: "Financiamento inválido." };
  if (amount_cents > toCents(f.outstanding_balance ?? 0))
    return { error: "O valor passa do saldo devedor." };
  // A RPC só aplica extras até o último vencimento.
  if (payment_date > last.due_date)
    return { error: "A data passa da última parcela." };

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .insert({
      type: "despesa",
      status: payment_date <= today() ? "pago" : "previsto",
      description: `${f.name} (amortização extra)`,
      amount: fromCents(amount_cents),
      date: payment_date,
      account_id: f.account_id,
      category_id: f.category_id,
      financing_id: financingId,
    })
    .select("id")
    .single();
  if (txError) return { error: "Não foi possível lançar a amortização." };

  const { error } = await supabase.from("financing_extra_payments").insert({
    financing_id: financingId,
    payment_date,
    amount: fromCents(amount_cents),
    strategy,
    transaction_id: tx.id,
  });
  if (error) {
    // Os dois inserts não são atômicos: desfaz o lançamento órfão.
    await supabase.from("transactions").delete().eq("id", tx.id);
    return { error: "Não foi possível lançar a amortização." };
  }
  return regenerate(financingId);
}

/** Remove a amortização extra e o lançamento dela; recalcula o cronograma. */
export async function deleteExtraPayment(
  id: string,
): Promise<{ error?: string }> {
  if (!z.uuid().safeParse(id).success) return { error: "Registro inválido." };
  const supabase = await createClient();
  const { data: e } = await supabase
    .from("financing_extra_payments")
    .delete()
    .eq("id", id)
    .select("financing_id, transaction_id")
    .maybeSingle();
  if (!e) return { error: "Não foi possível remover." };
  if (e.transaction_id)
    await supabase.from("transactions").delete().eq("id", e.transaction_id);
  return regenerate(e.financing_id);
}

async function regenerate(financingId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("generate_financing_schedule", {
    p_financing_id: financingId,
  });
  revalidatePath("/", "layout");
  return error ? { error: "Cronograma não recalculado. Tente de novo." } : {};
}
