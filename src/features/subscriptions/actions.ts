"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromCents } from "@/lib/finance/money";
import { createClient } from "@/lib/supabase/server";
import { subscriptionSchema, type SubscriptionInput } from "./schema";

export async function saveSubscription(
  id: string | null,
  input: SubscriptionInput,
): Promise<{ error?: string }> {
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (id && !z.uuid().safeParse(id).success)
    return { error: "Assinatura inválida." };
  const { amount_cents, ...rest } = parsed.data;

  const supabase = await createClient();
  if (rest.category_id) {
    const { data } = await supabase
      .from("categories")
      .select("kind")
      .eq("id", rest.category_id)
      .maybeSingle();
    if (data?.kind !== "despesa") return { error: "Categoria inválida." };
  }

  // Na edição, o trigger atualiza (ou refaz) as cobranças futuras previstas.
  const row = { ...rest, amount: fromCents(amount_cents) };
  const { error } = id
    ? await supabase.from("subscriptions").update(row).eq("id", id)
    : await supabase.from("subscriptions").insert(row);
  if (error) return { error: "Não foi possível salvar a assinatura." };

  // Gera as cobranças (idempotente) para aparecerem nas transações e faturas.
  const { error: genError } = await supabase.rpc("generate_recurring");
  revalidatePath("/", "layout");
  if (genError)
    return {
      error: "Assinatura salva, mas as cobranças não foram geradas agora.",
    };
  return {};
}
