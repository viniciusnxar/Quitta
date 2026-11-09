import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

// Colunas de view chegam como nullable; o restante vem de financings (not null).
function normalize(f: Tables<"v_financings">) {
  return {
    ...(f as Tables<"financings">),
    paid_installments: f.paid_installments ?? 0,
    remaining_installments: f.remaining_installments ?? 0,
    outstanding_balance: f.outstanding_balance ?? 0,
    next_due_date: f.next_due_date,
    next_amount: f.next_amount,
    total_interest_remaining: f.total_interest_remaining ?? 0,
  };
}

export async function listFinancings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_financings")
    .select("*")
    .order("created_at");
  if (error) throw error;
  return data.map(normalize);
}

export type Financing = Awaited<ReturnType<typeof listFinancings>>[number];

export async function getFinancing(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_financings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data && normalize(data);
}

/** Cronograma com o status da transação de cada parcela. */
export async function listFinancingInstallments(
  financingId: string,
  paidBefore: number,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financing_installments")
    .select(
      "id, number, due_date, amortization, interest, fees, total, balance_after, transactions!financing_installments_transaction_id_user_id_fkey(status)",
    )
    .eq("financing_id", financingId)
    .order("number");
  if (error) throw error;
  return data.map(({ transactions, ...i }) => ({
    ...i,
    total: i.total ?? i.amortization + i.interest + i.fees,
    // Mesma regra da v_financings.
    paid: i.number <= paidBefore || transactions?.status === "pago",
  }));
}

export type FinancingInstallment = Awaited<
  ReturnType<typeof listFinancingInstallments>
>[number];
