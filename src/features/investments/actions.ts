"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromCents, toCents } from "@/lib/finance/money";
import { createClient } from "@/lib/supabase/server";
import {
  investmentSchema,
  MOVEMENT_SIGN,
  movementSchema,
  RATE_MODES_WITH_RATE,
  type InvestmentInput,
  type MovementInput,
} from "./schema";

type Result = { error?: string; id?: string };

export async function saveInvestment(
  id: string | null,
  input: InvestmentInput,
): Promise<Result> {
  const parsed = investmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (id && !z.uuid().safeParse(id).success)
    return { error: "Investimento inválido." };
  const v = parsed.data;
  const row = {
    ...v,
    institution: v.institution || null,
    notes: v.notes || null,
    rate: RATE_MODES_WITH_RATE.includes(v.rate_mode) ? v.rate : null,
    liquidity_days: v.liquidity === "d_mais_n" ? v.liquidity_days : null,
  };

  const supabase = await createClient();
  const { data, error } = id
    ? await supabase
        .from("investments")
        .update(row)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase.from("investments").insert(row).select("id").single();
  if (error) return { error: "Não foi possível salvar o investimento." };
  revalidatePath("/", "layout");
  return { id: data.id };
}

/**
 * Aporte/resgate com conta: o trigger lança a transação na conta.
 * Se o saldo foi informado à mão (current_value), ele acompanha o movimento.
 */
export async function addMovement(
  investmentId: string,
  input: MovementInput,
): Promise<Result> {
  const parsed = movementSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!z.uuid().safeParse(investmentId).success)
    return { error: "Investimento inválido." };
  const { amount_cents, notes, ...m } = parsed.data;

  const supabase = await createClient();
  const { data: inv } = await supabase
    .from("investments")
    .select("current_value")
    .eq("id", investmentId)
    .maybeSingle();
  if (!inv) return { error: "Investimento inválido." };

  const { error } = await supabase.from("investment_movements").insert({
    ...m,
    investment_id: investmentId,
    amount: fromCents(amount_cents),
    notes: notes || null,
  });
  if (error) return { error: "Não foi possível lançar o movimento." };

  const current =
    m.kind === "atualizacao"
      ? amount_cents
      : inv.current_value === null
        ? null
        : Math.max(
            toCents(inv.current_value) + MOVEMENT_SIGN[m.kind] * amount_cents,
            0,
          );
  if (current !== null) {
    const { error: upError } = await supabase
      .from("investments")
      .update({
        current_value: fromCents(current),
        ...(m.kind === "atualizacao" && { current_value_at: m.date }),
      })
      .eq("id", investmentId);
    if (upError)
      return { error: "Movimento lançado, mas o saldo não foi atualizado." };
  }
  revalidatePath("/", "layout");
  return {};
}

/** O trigger apaga a transação da conta. Desfaz o efeito no saldo informado. */
export async function deleteMovement(id: string): Promise<Result> {
  if (!z.uuid().safeParse(id).success) return { error: "Movimento inválido." };
  const supabase = await createClient();
  const { data: mv } = await supabase
    .from("investment_movements")
    .delete()
    .eq("id", id)
    .select("investment_id, kind, amount")
    .maybeSingle();
  if (!mv) return { error: "Não foi possível remover." };

  // shortcut: remover uma "atualização" não volta o saldo anterior; o usuário lança outra.
  if (mv.kind !== "atualizacao") {
    const { data: inv } = await supabase
      .from("investments")
      .select("current_value")
      .eq("id", mv.investment_id)
      .maybeSingle();
    if (inv?.current_value != null)
      await supabase
        .from("investments")
        .update({
          current_value: fromCents(
            Math.max(
              toCents(inv.current_value) -
                MOVEMENT_SIGN[mv.kind] * toCents(mv.amount),
              0,
            ),
          ),
        })
        .eq("id", mv.investment_id);
  }
  revalidatePath("/", "layout");
  return {};
}
