"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromCents } from "@/lib/finance/money";
import { createClient } from "@/lib/supabase/server";
import { financingSchema, type FinancingInput } from "./schema";

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
