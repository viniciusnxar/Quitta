"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { today } from "@/lib/finance/dates";
import type { RateCode } from "@/lib/finance/investments";
import { RATE_CODES } from "./schema";
import { createClient } from "@/lib/supabase/server";

const rateSchema = z.object({
  code: z.enum(RATE_CODES),
  annual_rate: z
    .number({ error: "Informe a taxa." })
    .min(-50, "Taxa inválida.")
    .max(1000, "Taxa alta demais; confira o valor."),
});

/** Grava a taxa própria do usuário, datada de hoje. */
export async function saveRate(
  code: RateCode,
  annual_rate: number,
): Promise<{ error?: string }> {
  const parsed = rateSchema.safeParse({ code, annual_rate });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  // index_rates.user_id não tem default (null = taxa global).
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) return { error: "Sessão expirada." };
  const { error } = await supabase.from("index_rates").upsert(
    {
      ...parsed.data,
      user_id: userId,
      reference_date: today(),
      source: "manual",
    },
    { onConflict: "user_id,code,reference_date" },
  );
  if (error) return { error: "Não foi possível salvar a taxa." };
  revalidatePath("/", "layout");
  return {};
}

/** Apaga as taxas próprias do índice: volta a valer a global. */
export async function resetRate(code: RateCode): Promise<{ error?: string }> {
  if (!RATE_CODES.includes(code)) return { error: "Índice inválido." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("index_rates")
    .delete()
    .eq("code", code)
    .not("user_id", "is", null);
  if (error) return { error: "Não foi possível restaurar a taxa." };
  revalidatePath("/", "layout");
  return {};
}
