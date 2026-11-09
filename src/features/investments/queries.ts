import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

// Colunas de view chegam como nullable; o restante vem de investments (not null).
function normalize(i: Tables<"v_investment_positions">) {
  return {
    ...(i as Tables<"investments">),
    status: i.status as "ativo" | "resgatado",
    liquidity: i.liquidity as "diaria" | "no_vencimento" | "d_mais_n",
    net_invested: i.net_invested ?? 0,
    net_earnings: i.net_earnings ?? 0,
    position: i.position ?? 0,
  };
}

/** Ativos primeiro, por nome. */
export async function listInvestments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_investment_positions")
    .select("*")
    .order("status")
    .order("name");
  if (error) throw error;
  return data.map(normalize);
}

export type Investment = Awaited<ReturnType<typeof listInvestments>>[number];

export async function getInvestment(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_investment_positions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data && normalize(data);
}

export async function listMovements(investmentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investment_movements")
    .select(
      "id, kind, date, amount, notes, account:accounts!investment_movements_account_id_user_id_fkey(name)",
    )
    .eq("investment_id", investmentId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export type Movement = Awaited<ReturnType<typeof listMovements>>[number];
