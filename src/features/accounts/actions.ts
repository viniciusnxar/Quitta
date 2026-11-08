"use server";

import { revalidatePath } from "next/cache";
import { fromCents } from "@/lib/finance/money";
import { createClient } from "@/lib/supabase/server";
import { accountSchema, type AccountInput } from "./schema";

type Result = { error?: string };

export async function saveAccount(
  id: string | null,
  input: AccountInput,
): Promise<Result> {
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { initial_balance_cents, institution, ...rest } = parsed.data;
  const row = {
    ...rest,
    institution: institution || null,
    initial_balance: fromCents(initial_balance_cents),
  };

  // user_id vem do default auth.uid(); RLS garante que só a própria conta é editada.
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("accounts").update(row).eq("id", id)
    : await supabase.from("accounts").insert(row);
  if (error) return { error: "Não foi possível salvar a conta." };

  revalidatePath("/contas");
  return {};
}

export async function setAccountArchived(
  id: string,
  archived: boolean,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: "Não foi possível atualizar a conta." };

  revalidatePath("/contas");
  return {};
}
